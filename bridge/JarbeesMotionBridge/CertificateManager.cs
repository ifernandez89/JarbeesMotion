using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Org.BouncyCastle.Asn1.X509;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Operators;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Math;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.X509;

namespace JarbeesMotionBridge;

/// <summary>
/// Manages SSL certificates for WebSocket Secure (WSS) connections
/// Generates self-signed certificates for local network use
/// </summary>
public class CertificateManager
{
    private readonly string _certificatePath;
    private readonly string _certificatePassword = "JarbeesMotionBridge2024";
    
    public CertificateManager(string certificatePath)
    {
        _certificatePath = certificatePath;
    }
    
    /// <summary>
    /// Get or create certificate for WSS
    /// </summary>
    public X509Certificate2? GetOrCreateCertificate()
    {
        try
        {
            // Try to load existing certificate
            if (File.Exists(_certificatePath))
            {
                var cert = new X509Certificate2(_certificatePath, _certificatePassword);
                
                // Check if certificate is still valid
                if (cert.NotAfter > DateTime.Now.AddDays(30))
                {
                    return cert;
                }
                
                // Certificate expiring soon, generate new one
                cert.Dispose();
            }
            
            // Generate new self-signed certificate
            return GenerateSelfSignedCertificate();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Certificate error: {ex.Message}");
            return null;
        }
    }
    
    private X509Certificate2 GenerateSelfSignedCertificate()
    {
        // Generate RSA key pair
        var random = new SecureRandom();
        var keyPairGenerator = new RsaKeyPairGenerator();
        keyPairGenerator.Init(new KeyGenerationParameters(random, 2048));
        var keyPair = keyPairGenerator.GenerateKeyPair();
        
        // Certificate details
        var certificateGenerator = new X509V3CertificateGenerator();
        
        // Serial number
        var serialNumber = BigInteger.ProbablePrime(120, random);
        certificateGenerator.SetSerialNumber(serialNumber);
        
        // Subject and Issuer (same for self-signed)
        var subjectDN = new X509Name("CN=JarBees Motion Bridge,O=JarBees,C=US");
        var issuerDN = subjectDN;
        certificateGenerator.SetIssuerDN(issuerDN);
        certificateGenerator.SetSubjectDN(subjectDN);
        
        // Valid period: 1 year
        certificateGenerator.SetNotBefore(DateTime.UtcNow.Date);
        certificateGenerator.SetNotAfter(DateTime.UtcNow.Date.AddYears(1));
        
        // Public key
        certificateGenerator.SetPublicKey(keyPair.Public);
        
        // Extensions
        certificateGenerator.AddExtension(
            X509Extensions.KeyUsage,
            true,
            new KeyUsage(KeyUsage.DigitalSignature | KeyUsage.KeyEncipherment));
        
        certificateGenerator.AddExtension(
            X509Extensions.ExtendedKeyUsage,
            false,
            new ExtendedKeyUsage(KeyPurposeID.IdKPServerAuth));
        
        // Subject Alternative Names (localhost + local IP)
        var subjectAlternativeNames = new Asn1Encodable[]
        {
            new GeneralName(GeneralName.DnsName, "localhost"),
            new GeneralName(GeneralName.DnsName, Environment.MachineName),
            new GeneralName(GeneralName.IPAddress, "127.0.0.1")
        };
        
        certificateGenerator.AddExtension(
            X509Extensions.SubjectAlternativeName,
            false,
            new DerSequence(subjectAlternativeNames));
        
        // Sign certificate
        ISignatureFactory signatureFactory = new Asn1SignatureFactory(
            "SHA256WithRSA",
            keyPair.Private,
            random);
        
        var bouncyCert = certificateGenerator.Generate(signatureFactory);
        
        // Convert to .NET X509Certificate2
        var cert = new X509Certificate2(bouncyCert.GetEncoded());
        
        // Add private key
        var rsaPrivateKey = DotNetUtilities.ToRSA((RsaPrivateCrtKeyParameters)keyPair.Private);
        var certWithKey = cert.CopyWithPrivateKey(rsaPrivateKey);
        
        // Export to PFX format with password
        var pfxBytes = certWithKey.Export(X509ContentType.Pfx, _certificatePassword);
        
        // Save to disk
        File.WriteAllBytes(_certificatePath, pfxBytes);
        Console.WriteLine($"Generated new self-signed certificate: {_certificatePath}");
        
        // Return certificate with private key
        return new X509Certificate2(pfxBytes, _certificatePassword);
    }
    
    /// <summary>
    /// Get certificate instructions for mobile devices
    /// </summary>
    public static string GetInstallInstructions()
    {
        return @"
To connect from your mobile device:

1. The Bridge uses a self-signed certificate for secure connections
2. First connection will show a security warning in your browser
3. On Android Chrome:
   - Tap 'Advanced'
   - Tap 'Proceed to [IP address] (unsafe)'
4. The certificate will be remembered for this session
5. For permanent trust, you can install the certificate in your device settings

Alternative: Use mDNS/Bonjour (.local domain) if supported by your network.
";
    }
}
