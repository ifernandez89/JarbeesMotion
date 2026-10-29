# JarBees Motion Protocol Specification

Protocol Version: **1.0**

## Overview

JarBees Motion uses WebSocket Secure (WSS) for bidirectional communication between the mobile PWA and Windows Bridge. All messages are JSON-formatted with strict validation.

## Connection

### Endpoint

```
wss://<bridge-ip>:<port>/motion
```

Default port: `8443`

### TLS/SSL

- Certificate: Self-signed (generated on first run)
- Protocols: TLS 1.2, TLS 1.3
- Client must accept self-signed certificate

### Connection Flow

```
1. Client → Bridge: WebSocket connection request
2. Bridge → Client: Connection accepted (onopen)
3. Client ↔ Bridge: SessionPair exchange
4. Bridge → Client: Success with session token
5. Client ↔ Bridge: Input messages + Ping/Pong heartbeat
6. Client or Bridge: Disconnect (onclose)
```

## Message Structure

### Base Message

All messages follow this structure:

```typescript
{
  "version": "1.0",           // Protocol version
  "type": "MessageType",      // Message type (see below)
  "timestamp": 1234567890,    // Unix timestamp (ms)
  "payload": { }              // Type-specific payload (optional)
}
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `SessionPair` | Client → Bridge | Authenticate with pairing code |
| `SessionStop` | Client → Bridge | End current session |
| `SessionStatus` | Client → Bridge | Request session status |
| `MouseMove` | Client → Bridge | Move mouse cursor |
| `MouseButton` | Client → Bridge | Press/release mouse button |
| `MouseScroll` | Client → Bridge | Scroll wheel |
| `KeyboardText` | Client → Bridge | Type Unicode text |
| `KeyboardKey` | Client → Bridge | Press/release special key |
| `Ping` | Client → Bridge | Heartbeat check |
| `Pong` | Bridge → Client | Heartbeat response |
| `Success` | Bridge → Client | Operation succeeded |
| `Error` | Bridge → Client | Operation failed |

## Session Management

### SessionPair

Authenticate and establish a session.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "SessionPair",
  "timestamp": 1730188800000,
  "payload": {
    "pairingCode": "123456",
    "deviceName": "Moto G7 Plus"
  }
}
```

**Bridge → Client (Success):**

```json
{
  "version": "1.0",
  "type": "Success",
  "timestamp": 1730188800100,
  "payload": {
    "sessionToken": "base64-encoded-token",
    "message": "Paired successfully"
  }
}
```

**Bridge → Client (Error):**

```json
{
  "version": "1.0",
  "type": "Error",
  "timestamp": 1730188800100,
  "payload": {
    "code": "INVALID_CODE",
    "message": "Invalid pairing code"
  }
}
```

### SessionStop

End the current session.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "SessionStop",
  "timestamp": 1730188900000
}
```

**Result:** All pressed keys and buttons are released. Session terminated.

### SessionStatus

Query current session information.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "SessionStatus",
  "timestamp": 1730188850000
}
```

**Bridge → Client:**

```json
{
  "version": "1.0",
  "type": "SessionStatus",
  "timestamp": 1730188850100,
  "payload": {
    "connected": true,
    "deviceName": "Moto G7 Plus",
    "sessionStarted": 1730188800000,
    "latencyMs": 45
  }
}
```

## Mouse Control

### MouseMove

Move the cursor by relative deltas.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "MouseMove",
  "timestamp": 1730188860000,
  "payload": {
    "deltaX": 10,
    "deltaY": -5
  }
}
```

**Validation:**
- `deltaX`: integer, range `[-500, 500]`
- `deltaY`: integer, range `[-500, 500]`
- Values clamped to screen bounds

### MouseButton

Press or release a mouse button.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "MouseButton",
  "timestamp": 1730188870000,
  "payload": {
    "button": "Left",
    "action": "Press"
  }
}
```

**Enum Values:**
- `button`: `"Left"`, `"Right"`, `"Middle"`
- `action`: `"Press"`, `"Release"`

**Typical Click Sequence:**

```json
// Press
{ "button": "Left", "action": "Press" }
// Wait 50-100ms
{ "button": "Left", "action": "Release" }
```

### MouseScroll

Scroll vertically or horizontally.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "MouseScroll",
  "timestamp": 1730188880000,
  "payload": {
    "deltaX": 0,
    "deltaY": -3
  }
}
```

**Validation:**
- `deltaX`: integer (horizontal scroll)
- `deltaY`: integer (vertical scroll, negative = scroll down)
- Values multiplied by `WHEEL_DELTA` (120) in Bridge

## Keyboard Control

### KeyboardText

Type Unicode text.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "KeyboardText",
  "timestamp": 1730188890000,
  "payload": {
    "text": "Hello, World!"
  }
}
```

**Validation:**
- `text`: string, max length 1000 characters
- Supports full Unicode (emoji, international characters)

**Use Case:** Typing sentences, paragraphs, special characters.

### KeyboardKey

Press or release a specific key.

**Client → Bridge:**

```json
{
  "version": "1.0",
  "type": "KeyboardKey",
  "timestamp": 1730188900000,
  "payload": {
    "key": "ENTER",
    "action": "Press",
    "modifiers": {
      "shift": false,
      "ctrl": true,
      "alt": false,
      "win": false
    }
  }
}
```

**Enum Values:**
- `key`: See [Virtual Keys](#virtual-keys) below
- `action`: `"Press"`, `"Release"`
- `modifiers`: optional, all fields are boolean

**Use Case:** Special keys, keyboard shortcuts, navigation.

#### Virtual Keys

Supported key names:

| Key Name | Description |
|----------|-------------|
| `BACKSPACE` | Backspace |
| `TAB` | Tab |
| `ENTER` | Enter/Return |
| `SHIFT` | Shift modifier |
| `CTRL` | Control modifier |
| `ALT` | Alt modifier |
| `ESCAPE` | Escape |
| `SPACE` | Space bar |
| `LEFT`, `UP`, `RIGHT`, `DOWN` | Arrow keys |
| `DELETE` | Delete |
| `WIN` | Windows key |
| `F1` - `F12` | Function keys |

**Modifier Behavior:**
- Modifiers in `modifiers` field are pressed before the key
- Released after the key
- For holding modifiers, send separate Press/Release messages

## Connection Health

### Ping/Pong

Heartbeat to check connection and measure latency.

**Client → Bridge (every 10 seconds):**

```json
{
  "version": "1.0",
  "type": "Ping",
  "timestamp": 1730188910000
}
```

**Bridge → Client:**

```json
{
  "version": "1.0",
  "type": "Pong",
  "timestamp": 1730188910050
}
```

**Latency Calculation:**
```
latency = pong.timestamp - ping.timestamp
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `VERSION_MISMATCH` | Protocol version not supported |
| `INVALID_MESSAGE` | Malformed JSON or missing fields |
| `INVALID_PAYLOAD` | Payload validation failed |
| `UNAUTHORIZED` | Not authenticated or session expired |
| `PAIRING_FAILED` | Incorrect pairing code |
| `RATE_LIMIT` | Too many messages per second |
| `UNKNOWN_TYPE` | Message type not recognized |
| `INTERNAL_ERROR` | Server-side error |

### Error Response

```json
{
  "version": "1.0",
  "type": "Error",
  "timestamp": 1730188920000,
  "payload": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired session"
  }
}
```

## Rate Limiting

**Maximum:** 60 messages per second

**Enforcement:**
- Counter resets every second
- Messages beyond limit are dropped
- Error response sent to client

**Exemptions:** Ping/Pong messages not counted.

## Security

### Authentication

1. **Pairing Code:**
   - 6 random digits
   - Valid for 10 minutes
   - Single use
   - Generated by Bridge, displayed to user

2. **Session Token:**
   - 256-bit random token (base64-encoded)
   - Returned after successful pairing
   - Must be stored by client
   - Valid for 30 minutes of inactivity

3. **Origin Validation:**
   - Bridge validates `Origin` header
   - Rejects unknown origins (future feature)

### Input Safety

**On Disconnect:**
- All pressed mouse buttons are released
- All pressed keyboard keys are released
- Ensures no "stuck" inputs

**UAC Protection:**
- Bridge detects UAC/secure desktop
- Refuses to send input to these windows
- Prevents privilege escalation

**Validation:**
- All payloads validated before execution
- Out-of-range values clamped or rejected
- Malformed messages dropped

## Protocol Extensions (Future)

### Planned Features

- **Multi-touch gestures:** Pinch, rotate, swipe
- **Clipboard sync:** Share clipboard between devices
- **File transfer:** Small file transfers over WSS
- **Screen streaming:** Low-latency screen preview
- **Macro recording:** Record and replay input sequences

### Version Negotiation

Future versions will support:

```json
{
  "version": "2.0",
  "supportedVersions": ["1.0", "2.0"],
  ...
}
```

Bridge will accept highest common version.

## Implementation Notes

### Message Ordering

- No guaranteed ordering across message types
- Mouse movements may be coalesced or dropped
- Keyboard presses must maintain order

### Reconnection

- Client should implement exponential backoff
- Start: 1 second delay
- Max: 30 seconds delay
- Reset on successful connection

### Timestamps

- All timestamps in milliseconds since Unix epoch
- Used for latency measurement
- Not for message ordering (use sequence numbers if needed)

## Reference Implementation

- **Client:** `src/lib/motion/motionClient.ts`
- **Bridge:** `bridge/JarbeesMotionBridge/MotionServer.cs`
- **Types:** `src/types/motion.ts` and `bridge/JarbeesMotionBridge/Protocol.cs`

## Changelog

### Version 1.0 (2024-10-29)

- Initial release
- Mouse control (move, button, scroll)
- Keyboard control (text, keys)
- Session management
- Ping/Pong heartbeat
- Error handling

## License

Part of JarBees Motion project. See repository license.
