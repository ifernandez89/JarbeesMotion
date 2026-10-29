using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace JarbeesMotionBridge;

/// <summary>
/// Protocol version 1.0 - Message types and structures for JarBees Motion
/// </summary>
public static class Protocol
{
    public const string Version = "1.0";
    public const int MaxMessageSize = 8192; // 8KB
    public const int MaxTextLength = 1000;
    public const int MaxMouseDelta = 500;
    public const int MaxMessagesPerSecond = 60;
}

[JsonConverter(typeof(StringEnumConverter))]
public enum MessageType
{
    // Mouse control
    MouseMove,
    MouseButton,
    MouseScroll,
    
    // Keyboard control
    KeyboardText,
    KeyboardKey,
    
    // Session management
    SessionPair,
    SessionStop,
    SessionStatus,
    
    // Connection health
    Ping,
    Pong,
    
    // Responses
    Success,
    Error
}

[JsonConverter(typeof(StringEnumConverter))]
public enum MouseButtonType
{
    Left,
    Right,
    Middle
}

[JsonConverter(typeof(StringEnumConverter))]
public enum MouseButtonAction
{
    Press,
    Release
}

[JsonConverter(typeof(StringEnumConverter))]
public enum KeyAction
{
    Press,
    Release
}

public class MotionMessage
{
    [JsonProperty("version")]
    public string Version { get; set; } = Protocol.Version;
    
    [JsonProperty("type")]
    public MessageType Type { get; set; }
    
    [JsonProperty("timestamp")]
    public long Timestamp { get; set; }
    
    [JsonProperty("payload")]
    public object? Payload { get; set; }
}

public class MouseMovePayload
{
    [JsonProperty("deltaX")]
    public int DeltaX { get; set; }
    
    [JsonProperty("deltaY")]
    public int DeltaY { get; set; }
}

public class MouseButtonPayload
{
    [JsonProperty("button")]
    public MouseButtonType Button { get; set; }
    
    [JsonProperty("action")]
    public MouseButtonAction Action { get; set; }
}

public class MouseScrollPayload
{
    [JsonProperty("deltaX")]
    public int DeltaX { get; set; }
    
    [JsonProperty("deltaY")]
    public int DeltaY { get; set; }
}

public class KeyboardTextPayload
{
    [JsonProperty("text")]
    public string Text { get; set; } = string.Empty;
}

public class KeyboardKeyPayload
{
    [JsonProperty("key")]
    public string Key { get; set; } = string.Empty;
    
    [JsonProperty("action")]
    public KeyAction Action { get; set; }
    
    [JsonProperty("modifiers")]
    public KeyModifiers? Modifiers { get; set; }
}

public class KeyModifiers
{
    [JsonProperty("shift")]
    public bool Shift { get; set; }
    
    [JsonProperty("ctrl")]
    public bool Ctrl { get; set; }
    
    [JsonProperty("alt")]
    public bool Alt { get; set; }
    
    [JsonProperty("win")]
    public bool Win { get; set; }
}

public class SessionPairPayload
{
    [JsonProperty("pairingCode")]
    public string PairingCode { get; set; } = string.Empty;
    
    [JsonProperty("deviceName")]
    public string? DeviceName { get; set; }
}

public class SessionStatusPayload
{
    [JsonProperty("connected")]
    public bool Connected { get; set; }
    
    [JsonProperty("deviceName")]
    public string? DeviceName { get; set; }
    
    [JsonProperty("sessionStarted")]
    public long? SessionStarted { get; set; }
    
    [JsonProperty("latencyMs")]
    public int? LatencyMs { get; set; }
}

public class ErrorPayload
{
    [JsonProperty("code")]
    public string Code { get; set; } = string.Empty;
    
    [JsonProperty("message")]
    public string Message { get; set; } = string.Empty;
}
