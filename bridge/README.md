# JarBees Motion Bridge - Windows Application

Windows desktop application that receives mouse and keyboard control commands from mobile devices over the local network.

## System Requirements

- **Windows 10** (version 1809 or later) or **Windows 11**
- **.NET 8.0 Runtime** ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
- Administrator rights (first run only, for certificate generation)
- Local network connection (same WiFi as mobile device)

## Features

- ✅ Secure WebSocket (WSS) with self-signed certificates
- ✅ 6-digit pairing code authentication
- ✅ Mouse control with relative movement (trackpad style)
- ✅ Keyboard input (text + special keys)
- ✅ Automatic input release on disconnect
- ✅ Emergency stop button
- ✅ Single session at a time
- ✅ Activity logging

## Building from Source

### Prerequisites

- Visual Studio 2022 or later
- .NET 8.0 SDK
- Windows 10/11

### Build Steps

```powershell
# Navigate to bridge directory
cd bridge

# Restore NuGet packages
dotnet restore

# Build Release version
dotnet build -c Release

# Output will be in:
# bridge\JarbeesMotionBridge\bin\Release\net8.0-windows\
```

### Run in Development

```powershell
# From bridge/JarbeesMotionBridge directory
dotnet run
```

## Installation

### Option 1: Build and Run

1. Clone the repository
2. Open `bridge/JarbeesMotionBridge.sln` in Visual Studio
3. Build in Release mode (Ctrl+Shift+B)
4. Run `JarbeesMotionBridge.exe` from the output directory

### Option 2: Publish Self-Contained

```powershell
# Create a standalone executable (no .NET runtime required)
cd bridge/JarbeesMotionBridge
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# Output in: bin\Release\net8.0-windows\win-x64\publish\
```

## First Run Setup

1. **Run as Administrator** (first time only)
   - Right-click `JarbeesMotionBridge.exe`
   - Select "Run as administrator"
   - This generates the SSL certificate

2. **Allow in Windows Firewall**
   - When prompted, click "Allow access"
   - This permits port 8443 for WSS connections

3. **Note your PC's IP address**
   - Displayed in the app when Bridge starts
   - Example: `wss://192.168.1.100:8443/motion`

## Usage

### Starting the Bridge

1. Launch JarbeesMotionBridge.exe
2. Click **"Start Bridge"**
3. Note the 6-digit pairing code displayed
4. Share this code with your mobile device

### Pairing a Device

1. On your mobile device, open the JarBees Motion PWA
2. Navigate to `/motion`
3. Enter the 6-digit code from the Bridge
4. Tap "Connect"
5. Accept the certificate warning (first time only)

### Controlling Windows

Once paired:
- **Trackpad area**: Move mouse cursor
- **Left/Right buttons**: Click
- **Keyboard icon**: Open virtual keyboard
- **Red disconnect**: End session

### Emergency Stop

If something goes wrong:
- Click the red **"🛑 EMERGENCY STOP"** button in the Bridge
- All pressed keys and mouse buttons will be released immediately
- Works even if mobile device is disconnected

### Security Notes

- Bridge only accepts connections from the local network
- Each pairing code is valid for 10 minutes
- Sessions expire after 30 minutes of inactivity
- Only one device can be connected at a time
- All inputs are released on disconnect

## Firewall Configuration

If you have trouble connecting:

### Windows Firewall

```powershell
# Allow inbound on port 8443
New-NetFirewallRule -DisplayName "JarBees Motion Bridge" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
```

### Third-party Firewalls

Add an exception for:
- Application: `JarbeesMotionBridge.exe`
- Port: `8443` (TCP)
- Direction: Inbound

## Troubleshooting

### "Failed to create SSL certificate"

**Solution**: Run as Administrator once to generate the certificate.

### "Port 8443 is already in use"

**Solution**: Another application is using this port. Close it or change the port in code.

### Mobile device can't connect

**Check**:
1. Both devices on same WiFi network
2. Windows Firewall allows port 8443
3. Router doesn't have AP isolation enabled
4. Guest network isolation is disabled

### Certificate warning on mobile

**This is normal** for self-signed certificates:
- On first connection, you'll see a security warning
- Tap "Advanced" → "Proceed anyway"
- Certificate will be remembered for this session

### Mouse doesn't move

**Possible causes**:
1. UAC prompt is active (Bridge can't control UAC windows)
2. Secure desktop active (Ctrl+Alt+Del screen)
3. Windows is locked

## Architecture

### Components

```
MainForm (Windows Forms)
    ├── SessionManager (Authentication)
    ├── CertificateManager (SSL)
    └── MotionServer (WebSocket)
            ├── MotionService (Per-connection handler)
            └── InputController (Win32 SendInput)
```

### Protocol

- **Transport**: WebSocket Secure (WSS)
- **Port**: 8443
- **Protocol Version**: 1.0
- **Message Format**: JSON

### Message Types

| Type | Description |
|------|-------------|
| `SessionPair` | Authenticate with pairing code |
| `MouseMove` | Move cursor (relative deltas) |
| `MouseButton` | Press/release mouse button |
| `MouseScroll` | Vertical/horizontal scroll |
| `KeyboardText` | Type Unicode text |
| `KeyboardKey` | Press/release special keys |
| `Ping/Pong` | Connection health check |

## Security Considerations

### What's Protected

✅ Encrypted connection (TLS/SSL)
✅ Authentication required (pairing code)
✅ Local network only
✅ Session timeout
✅ Rate limiting (60 msg/sec)
✅ Input validation
✅ Automatic cleanup on disconnect

### Limitations

⚠️ Self-signed certificate (requires manual accept)
⚠️ No protection if attacker is on your local network
⚠️ Cannot control UAC prompts
⚠️ Cannot control secure desktop (Ctrl+Alt+Del)

### Best Practices

- Use only on trusted networks
- Don't expose bridge to the Internet
- Generate new pairing codes for each session
- Keep the bridge window visible when in use

## Development

### Key Files

- `Program.cs` - Main entry point and UI
- `MotionServer.cs` - WebSocket server
- `InputController.cs` - Win32 SendInput wrapper
- `SessionManager.cs` - Authentication
- `Protocol.cs` - Message types
- `CertificateManager.cs` - SSL certificates

### Testing

```powershell
# Build and run
dotnet run

# Test with wscat
npm install -g wscat
wscat -c "wss://localhost:8443/motion" --no-check
```

### Logs

Application logs are displayed in the Bridge window. For debugging, check:
- Windows Event Viewer
- Application console output

## License

Part of the JarBees Motion project. See main repository for license information.

## Support

For issues or questions:
- Check the main repository README
- Review troubleshooting section above
- Open an issue on GitHub
