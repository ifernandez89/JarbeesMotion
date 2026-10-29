using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace JarbeesMotionBridge;

/// <summary>
/// Creates a local certificate authority and issues a WSS certificate for this PC.
/// The CA private key stays on this Windows user account; only its public certificate
/// should be installed on a mobile device.
/// </summary>
public class CertificateManager
{
    private readonly string _certificatePath;
    private readonly string _authorityPath;
    private readonly string _authorityPublicPath;
    private readonly string _passwordPath;

    public CertificateManager(string certificatePath)
    {
        _certificatePath = certificatePath;
        var directory = Path.GetDirectoryName(certificatePath)
            ?? throw new ArgumentException("Certificate path must include a directory.", nameof(certificatePath));
        _authorityPath = Path.Combine(directory, "bridge-ca.pfx");
        _authorityPublicPath = Path.Combine(directory, "bridge-ca.cer");
        _passwordPath = Path.Combine(directory, "bridge-ca-password.dpapi");
    }

    public string MobileCaCertificatePath => _authorityPublicPath;

    public X509Certificate2? GetOrCreateCertificate()
    {
        try
        {
            var password = GetOrCreatePassword();
            using var authority = GetOrCreateAuthority(password);
            File.WriteAllBytes(_authorityPublicPath, authority.Export(X509ContentType.Cert));

            var certificateBytes = CreateServerCertificate(authority, password);
            File.WriteAllBytes(_certificatePath, certificateBytes);

            return new X509Certificate2(
                certificateBytes,
                password,
                X509KeyStorageFlags.EphemeralKeySet);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Certificate error: {ex.Message}");
            return null;
        }
    }

    private string GetOrCreatePassword()
    {
        if (File.Exists(_passwordPath))
        {
            var protectedPassword = File.ReadAllBytes(_passwordPath);
            var passwordBytes = ProtectedData.Unprotect(
                protectedPassword,
                optionalEntropy: null,
                DataProtectionScope.CurrentUser);
            return Convert.ToBase64String(passwordBytes);
        }

        var generatedPassword = RandomNumberGenerator.GetBytes(32);
        var protectedBytes = ProtectedData.Protect(
            generatedPassword,
            optionalEntropy: null,
            DataProtectionScope.CurrentUser);
        File.WriteAllBytes(_passwordPath, protectedBytes);
        return Convert.ToBase64String(generatedPassword);
    }

    private X509Certificate2 GetOrCreateAuthority(string password)
    {
        if (File.Exists(_authorityPath))
        {
            var existingAuthority = new X509Certificate2(
                _authorityPath,
                password,
                X509KeyStorageFlags.EphemeralKeySet);

            if (existingAuthority.NotAfter > DateTime.UtcNow.AddDays(30))
            {
                return existingAuthority;
            }

            existingAuthority.Dispose();
        }

        using var key = RSA.Create(2048);
        var request = new CertificateRequest(
            "CN=JarBees Motion Local CA",
            key,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        request.CertificateExtensions.Add(
            new X509BasicConstraintsExtension(true, false, 0, critical: true));
        request.CertificateExtensions.Add(
            new X509KeyUsageExtension(
                X509KeyUsageFlags.KeyCertSign | X509KeyUsageFlags.CrlSign,
                critical: true));
        request.CertificateExtensions.Add(new X509SubjectKeyIdentifierExtension(request.PublicKey, false));

        using var authority = request.CreateSelfSigned(
            DateTimeOffset.UtcNow.AddMinutes(-5),
            DateTimeOffset.UtcNow.AddYears(10));
        var authorityBytes = authority.Export(X509ContentType.Pfx, password);
        File.WriteAllBytes(_authorityPath, authorityBytes);
        return new X509Certificate2(
            authorityBytes,
            password,
            X509KeyStorageFlags.EphemeralKeySet);
    }

    private static byte[] CreateServerCertificate(X509Certificate2 authority, string password)
    {
        using var key = RSA.Create(2048);
        var request = new CertificateRequest(
            $"CN={Environment.MachineName}",
            key,
            HashAlgorithmName.SHA256,
            RSASignaturePadding.Pkcs1);
        request.CertificateExtensions.Add(
            new X509BasicConstraintsExtension(false, false, 0, critical: true));
        request.CertificateExtensions.Add(
            new X509KeyUsageExtension(
                X509KeyUsageFlags.DigitalSignature | X509KeyUsageFlags.KeyEncipherment,
                critical: true));
        request.CertificateExtensions.Add(
            new X509EnhancedKeyUsageExtension(
                new OidCollection { new("1.3.6.1.5.5.7.3.1") },
                critical: false));
        request.CertificateExtensions.Add(new X509SubjectKeyIdentifierExtension(request.PublicKey, false));

        var subjectAlternativeNames = new SubjectAlternativeNameBuilder();
        subjectAlternativeNames.AddDnsName("localhost");
        subjectAlternativeNames.AddDnsName(Environment.MachineName);
        subjectAlternativeNames.AddIpAddress(IPAddress.Loopback);

        foreach (var address in GetLocalIpAddresses())
        {
            subjectAlternativeNames.AddIpAddress(address);
        }

        request.CertificateExtensions.Add(subjectAlternativeNames.Build());

        var serialNumber = RandomNumberGenerator.GetBytes(16);
        using var publicCertificate = request.Create(
            authority,
            DateTimeOffset.UtcNow.AddMinutes(-5),
            DateTimeOffset.UtcNow.AddYears(1),
            serialNumber);
        using var certificateWithKey = publicCertificate.CopyWithPrivateKey(key);
        return certificateWithKey.Export(X509ContentType.Pfx, password);
    }

    private static IEnumerable<IPAddress> GetLocalIpAddresses()
    {
        return NetworkInterface.GetAllNetworkInterfaces()
            .Where(network => network.OperationalStatus == OperationalStatus.Up)
            .SelectMany(network => network.GetIPProperties().UnicastAddresses)
            .Select(unicast => unicast.Address)
            .Where(address =>
                address.AddressFamily == AddressFamily.InterNetwork &&
                !IPAddress.IsLoopback(address) &&
                !address.ToString().StartsWith("169.254.", StringComparison.Ordinal));
    }

    public static string GetInstallInstructions(string certificatePath)
    {
        return $"""
            Install only this public CA certificate on the Moto:
            {certificatePath}

            Android 10: Settings > Security > Encryption & credentials > Install a certificate > CA certificate.
            Import the .cer file, then retry the connection in Brave. Do not copy the .pfx or .dpapi files to the phone.
            Remove this user CA from Android after testing if you no longer need the Bridge.
            """;
    }
}
