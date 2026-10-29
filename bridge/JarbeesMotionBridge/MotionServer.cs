using System.Collections.Concurrent;
using System.Net;
using System.Security.Cryptography.X509Certificates;
using Newtonsoft.Json;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace JarbeesMotionBridge;

/// <summary>
/// WebSocket server for JarBees Motion remote control
/// Handles secure WSS connections from mobile devices
/// </summary>
public class MotionServer
{
    private WebSocketServer? _server;
    private readonly InputController _inputController;
    private readonly SessionManager _sessionManager;
    private readonly int _port;
    private readonly X509Certificate2? _certificate;
    
    public event EventHandler<string>? LogMessage;
    
    public MotionServer(int port, SessionManager sessionManager, X509Certificate2? certificate)
    {
        _port = port;
        _sessionManager = sessionManager;
        _certificate = certificate;
        _inputController = new InputController();
    }
    
    public void Start()
    {
        try
        {
            // Create WebSocket server with SSL
            _server = new WebSocketServer($"wss://0.0.0.0:{_port}");
            
            if (_certificate != null)
            {
                _server.SslConfiguration.ServerCertificate = _certificate;
                _server.SslConfiguration.EnabledSslProtocols = System.Security.Authentication.SslProtocols.Tls12 | System.Security.Authentication.SslProtocols.Tls13;
            }
            
            // Add motion service
            _server.AddWebSocketService<MotionService>("/motion", (service) =>
            {
                service.InputController = _inputController;
                service.SessionManager = _sessionManager;
                service.LogMessage += (s, msg) => LogMessage?.Invoke(this, msg);
            });
            
            _server.Start();
            
            var localIp = GetLocalIPAddress();
            LogMessage?.Invoke(this, $"✓ WebSocket server started");
            LogMessage?.Invoke(this, $"  Secure (WSS): wss://{localIp}:{_port}/motion");
            LogMessage?.Invoke(this, $"  Also: wss://localhost:{_port}/motion");
        }
        catch (Exception ex)
        {
            LogMessage?.Invoke(this, $"✗ Failed to start server: {ex.Message}");
            throw;
        }
    }
    
    public void Stop()
    {
        try
        {
            // Release all inputs before stopping
            _inputController.ReleaseAll();
            
            _server?.Stop();
            LogMessage?.Invoke(this, "Server stopped");
        }
        catch (Exception ex)
        {
            LogMessage?.Invoke(this, $"Error stopping server: {ex.Message}");
        }
    }
    
    private static string GetLocalIPAddress()
    {
        try
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    return ip.ToString();
                }
            }
        }
        catch { }
        
        return "localhost";
    }
}

/// <summary>
/// WebSocket service behavior for individual connections
/// </summary>
public class MotionService : WebSocketBehavior
{
    public InputController? InputController { get; set; }
    public SessionManager? SessionManager { get; set; }
    public event EventHandler<string>? LogMessage;
    
    private string? _sessionToken;
    private DateTime _lastMessageTime = DateTime.Now;
    private readonly ConcurrentDictionary<MessageType, DateTime> _messageTimestamps = new();
    private int _messageCount = 0;
    private DateTime _messageCountResetTime = DateTime.Now;
    
    protected override void OnOpen()
    {
        Log($"New connection from {Context.UserEndPoint}");
    }
    
    protected override void OnMessage(MessageEventArgs e)
    {
        try
        {
            // Rate limiting: max 60 messages per second
            _messageCount++;
            if ((DateTime.Now - _messageCountResetTime).TotalSeconds >= 1)
            {
                _messageCount = 0;
                _messageCountResetTime = DateTime.Now;
            }
            
            if (_messageCount > Protocol.MaxMessagesPerSecond)
            {
                SendError("RATE_LIMIT", "Too many messages per second");
                return;
            }
            
            // Parse message
            var message = JsonConvert.DeserializeObject<MotionMessage>(e.Data);
            if (message == null)
            {
                SendError("INVALID_MESSAGE", "Failed to parse message");
                return;
            }
            
            // Validate protocol version
            if (message.Version != Protocol.Version)
            {
                SendError("VERSION_MISMATCH", $"Protocol version {Protocol.Version} required");
                return;
            }
            
            // Handle message based on type
            switch (message.Type)
            {
                case MessageType.SessionPair:
                    HandlePairing(message);
                    break;
                
                case MessageType.SessionStop:
                    HandleStopSession();
                    break;
                
                case MessageType.SessionStatus:
                    HandleStatusRequest();
                    break;
                
                case MessageType.Ping:
                    HandlePing(message);
                    break;
                
                // Input messages require valid session
                case MessageType.MouseMove:
                case MessageType.MouseButton:
                case MessageType.MouseScroll:
                case MessageType.KeyboardText:
                case MessageType.KeyboardKey:
                    if (!ValidateSession())
                        return;
                    HandleInputMessage(message);
                    break;
                
                default:
                    SendError("UNKNOWN_TYPE", $"Unknown message type: {message.Type}");
                    break;
            }
            
            _lastMessageTime = DateTime.Now;
        }
        catch (Exception ex)
        {
            Log($"Error handling message: {ex.Message}");
            SendError("INTERNAL_ERROR", "Failed to process message");
        }
    }
    
    protected override void OnClose(CloseEventArgs e)
    {
        Log($"Connection closed: {e.Reason}");
        
        // Release all inputs on disconnect
        InputController?.ReleaseAll();
        
        // End session if this was the active connection
        if (_sessionToken != null && SessionManager?.ValidateSessionToken(_sessionToken) == true)
        {
            SessionManager?.EndSession();
        }
    }
    
    protected override void OnError(ErrorEventArgs e)
    {
        Log($"WebSocket error: {e.Message}");
    }
    
    private void HandlePairing(MotionMessage message)
    {
        var payload = JsonConvert.DeserializeObject<SessionPairPayload>(message.Payload?.ToString() ?? "");
        if (payload == null || string.IsNullOrEmpty(payload.PairingCode))
        {
            SendError("INVALID_PAYLOAD", "Pairing code required");
            return;
        }
        
        var result = SessionManager?.ValidatePairingCode(payload.PairingCode, payload.DeviceName);
        if (result?.success == true)
        {
            _sessionToken = result.Value.token;
            Log($"✓ Device paired: {payload.DeviceName ?? "Unknown"}");
            
            SendSuccess(new { sessionToken = _sessionToken, message = "Paired successfully" });
        }
        else
        {
            SendError("PAIRING_FAILED", result?.error ?? "Invalid pairing code");
        }
    }
    
    private void HandleStopSession()
    {
        if (ValidateSession())
        {
            SessionManager?.EndSession();
            InputController?.ReleaseAll();
            _sessionToken = null;
            SendSuccess(new { message = "Session ended" });
            Log("Session ended by client");
        }
    }
    
    private void HandleStatusRequest()
    {
        var status = SessionManager?.GetStatus();
        Send(CreateMessage(MessageType.SessionStatus, status));
    }
    
    private void HandlePing(MotionMessage message)
    {
        // Respond with pong
        Send(CreateMessage(MessageType.Pong, new { timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() }));
    }
    
    private void HandleInputMessage(MotionMessage message)
    {
        try
        {
            switch (message.Type)
            {
                case MessageType.MouseMove:
                    var movePayload = JsonConvert.DeserializeObject<MouseMovePayload>(message.Payload?.ToString() ?? "");
                    if (movePayload != null)
                    {
                        InputController?.MoveMouse(movePayload.DeltaX, movePayload.DeltaY);
                    }
                    break;
                
                case MessageType.MouseButton:
                    var buttonPayload = JsonConvert.DeserializeObject<MouseButtonPayload>(message.Payload?.ToString() ?? "");
                    if (buttonPayload != null)
                    {
                        InputController?.MouseButton(buttonPayload.Button, buttonPayload.Action);
                    }
                    break;
                
                case MessageType.MouseScroll:
                    var scrollPayload = JsonConvert.DeserializeObject<MouseScrollPayload>(message.Payload?.ToString() ?? "");
                    if (scrollPayload != null)
                    {
                        InputController?.MouseScroll(scrollPayload.DeltaX, scrollPayload.DeltaY);
                    }
                    break;
                
                case MessageType.KeyboardText:
                    var textPayload = JsonConvert.DeserializeObject<KeyboardTextPayload>(message.Payload?.ToString() ?? "");
                    if (textPayload != null && !string.IsNullOrEmpty(textPayload.Text))
                    {
                        InputController?.SendText(textPayload.Text);
                    }
                    break;
                
                case MessageType.KeyboardKey:
                    var keyPayload = JsonConvert.DeserializeObject<KeyboardKeyPayload>(message.Payload?.ToString() ?? "");
                    if (keyPayload != null)
                    {
                        var virtualKey = VirtualKeys.GetVirtualKey(keyPayload.Key);
                        if (virtualKey.HasValue)
                        {
                            InputController?.SendKey(virtualKey.Value, keyPayload.Action);
                        }
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            Log($"Error processing input: {ex.Message}");
        }
    }
    
    private bool ValidateSession()
    {
        if (SessionManager?.ValidateSessionToken(_sessionToken) != true)
        {
            SendError("UNAUTHORIZED", "Invalid or expired session");
            return false;
        }
        return true;
    }
    
    private void SendSuccess(object data)
    {
        Send(CreateMessage(MessageType.Success, data));
    }
    
    private void SendError(string code, string message)
    {
        Send(CreateMessage(MessageType.Error, new ErrorPayload { Code = code, Message = message }));
    }
    
    private string CreateMessage(MessageType type, object? payload)
    {
        var message = new MotionMessage
        {
            Version = Protocol.Version,
            Type = type,
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Payload = payload
        };
        
        return JsonConvert.SerializeObject(message);
    }
    
    private void Log(string message)
    {
        LogMessage?.Invoke(this, message);
    }
}
