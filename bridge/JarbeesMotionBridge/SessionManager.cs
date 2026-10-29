using System.Security.Cryptography;
using System.Text;

namespace JarbeesMotionBridge;

/// <summary>
/// Manages pairing codes, session tokens, and connection state
/// </summary>
public class SessionManager
{
    private string? _currentPairingCode;
    private string? _currentSessionToken;
    private string? _connectedDeviceName;
    private DateTime? _sessionStartTime;
    private DateTime _pairingCodeCreated;
    private readonly object _lock = new();
    
    public const int PairingCodeLength = 6;
    public const int SessionTimeoutMinutes = 30;
    private const int PairingCodeValidMinutes = 10;
    
    public event EventHandler<string>? PairingCodeGenerated;
    public event EventHandler<string>? SessionStarted;
    public event EventHandler? SessionEnded;
    
    public string? CurrentPairingCode
    {
        get
        {
            lock (_lock)
            {
                // Check if pairing code expired
                if (_currentPairingCode != null && 
                    DateTime.Now - _pairingCodeCreated > TimeSpan.FromMinutes(PairingCodeValidMinutes))
                {
                    _currentPairingCode = null;
                }
                return _currentPairingCode;
            }
        }
    }
    
    public bool HasActiveSession
    {
        get
        {
            lock (_lock)
            {
                if (_currentSessionToken == null)
                    return false;
                
                // Check session timeout
                if (_sessionStartTime != null && 
                    DateTime.Now - _sessionStartTime.Value > TimeSpan.FromMinutes(SessionTimeoutMinutes))
                {
                    EndSession();
                    return false;
                }
                
                return true;
            }
        }
    }
    
    public string? ConnectedDeviceName
    {
        get { lock (_lock) return _connectedDeviceName; }
    }
    
    public DateTime? SessionStartTime
    {
        get { lock (_lock) return _sessionStartTime; }
    }
    
    /// <summary>
    /// Generate a new 6-digit pairing code
    /// </summary>
    public string GeneratePairingCode()
    {
        lock (_lock)
        {
            // Generate random 6-digit code
            var random = new Random();
            _currentPairingCode = random.Next(100000, 999999).ToString();
            _pairingCodeCreated = DateTime.Now;
            
            PairingCodeGenerated?.Invoke(this, _currentPairingCode);
            return _currentPairingCode;
        }
    }
    
    /// <summary>
    /// Validate pairing code and create session if valid
    /// </summary>
    public (bool success, string? token, string? error) ValidatePairingCode(string code, string? deviceName)
    {
        lock (_lock)
        {
            // Check if there's already an active session
            if (HasActiveSession)
            {
                return (false, null, "Another device is already connected");
            }
            
            // Check if pairing code exists and matches
            if (string.IsNullOrEmpty(CurrentPairingCode))
            {
                return (false, null, "No pairing code available. Generate a new code.");
            }
            
            if (code != CurrentPairingCode)
            {
                return (false, null, "Invalid pairing code");
            }
            
            // Create session
            _currentSessionToken = GenerateSessionToken();
            _connectedDeviceName = deviceName ?? "Unknown Device";
            _sessionStartTime = DateTime.Now;
            _currentPairingCode = null; // Invalidate pairing code after use
            
            SessionStarted?.Invoke(this, _connectedDeviceName);
            return (true, _currentSessionToken, null);
        }
    }
    
    /// <summary>
    /// Validate session token
    /// </summary>
    public bool ValidateSessionToken(string? token)
    {
        lock (_lock)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(_currentSessionToken))
                return false;
            
            if (token != _currentSessionToken)
                return false;
            
            // Check timeout
            if (_sessionStartTime != null && 
                DateTime.Now - _sessionStartTime.Value > TimeSpan.FromMinutes(SessionTimeoutMinutes))
            {
                EndSession();
                return false;
            }
            
            return true;
        }
    }
    
    /// <summary>
    /// End current session
    /// </summary>
    public void EndSession()
    {
        lock (_lock)
        {
            if (_currentSessionToken == null)
                return;
            
            _currentSessionToken = null;
            _connectedDeviceName = null;
            _sessionStartTime = null;
            
            SessionEnded?.Invoke(this, EventArgs.Empty);
        }
    }
    
    /// <summary>
    /// Get session status info
    /// </summary>
    public SessionStatusPayload GetStatus()
    {
        lock (_lock)
        {
            return new SessionStatusPayload
            {
                Connected = HasActiveSession,
                DeviceName = _connectedDeviceName,
                SessionStarted = _sessionStartTime?.Ticks,
                LatencyMs = null
            };
        }
    }
    
    private static string GenerateSessionToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var tokenBytes = new byte[32];
        rng.GetBytes(tokenBytes);
        return Convert.ToBase64String(tokenBytes);
    }
}
