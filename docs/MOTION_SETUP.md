# JarBees Motion - Setup Guide

Complete guide to set up and use JarBees Motion for remote mouse and keyboard control from your Android device to Windows PC.

## Table of Contents

- [Requirements](#requirements)
- [Windows Bridge Setup](#windows-bridge-setup)
- [Mobile PWA Setup](#mobile-pwa-setup)
- [First Connection](#first-connection)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Requirements

### Windows PC
- Windows 10 (1809+) or Windows 11
- .NET 8.0 Runtime ([Download](https://dotnet.microsoft.com/download/dotnet/8.0))
- Local network connection (WiFi)
- Administrator rights (first run only)

### Mobile Device
- Android 8.0+ or iOS 15.4+
- Modern browser (Chrome, Edge, Safari)
- Same WiFi network as PC

## Windows Bridge Setup

### 1. Download and Install

**Option A: Build from Source**

```powershell
# Clone repository
git clone https://github.com/yourusername/JarbeesMotion.git
cd JarbeesMotion/bridge

# Build
dotnet build -c Release

# Run
cd JarbeesMotionBridge/bin/Release/net8.0-windows
.\JarbeesMotionBridge.exe
```

**Option B: Download Release** (coming soon)

Download the latest release from GitHub Releases and run the executable.

### 2. First Run

1. **Run as Administrator** (first time only)
   - Right-click `JarbeesMotionBridge.exe`
   - Select "Run as administrator"
   - This generates the SSL certificate

2. **Windows Firewall Permission**
   - When prompted, click "Allow access"
   - This permits incoming connections on port 8443

3. **Note the Information**
   - Bridge window will show:
     - Your PC's IP address (e.g., `192.168.1.100`)
     - The WebSocket URL (e.g., `wss://192.168.1.100:8443/motion`)
     - A 6-digit pairing code

### 3. Keep Bridge Running

- Keep the Bridge window open while using Motion
- You can minimize it, but don't close it
- The Bridge must be running to receive connections

## Mobile PWA Setup

### 1. Access the PWA

**Option A: GitHub Pages** (if deployed)

```
https://yourusername.github.io/JarbeesMotion/
```

**Option B: Local Development**

```bash
npm install
npm run build
npm run start
```

Then access from your mobile browser.

### 2. Install as PWA (Recommended)

**Android (Chrome/Edge):**
1. Open the PWA in your browser
2. Tap the menu (⋮)
3. Tap "Install app" or "Add to Home Screen"
4. Follow the prompts

**iOS (Safari):**
1. Open the PWA in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### 3. Navigate to Motion

- Open the installed PWA
- Tap the menu or navigate to `/motion`
- You'll see the setup screen

## First Connection

### Step 1: Configure Bridge Address

On your mobile device:

1. Open JarBees Motion
2. Go to `/motion` route
3. Enter your PC's IP address shown in the Bridge
   - Example: `192.168.1.100:8443`
   - Or full URL: `wss://192.168.1.100:8443/motion`
4. Tap "Connect"

**Tip:** Use "Auto-Detect" button for common configurations.

### Step 2: Accept Certificate Warning

On first connection, you'll see a security warning because the Bridge uses a self-signed certificate.

**Android Chrome:**
1. Tap "Advanced"
2. Tap "Proceed to [IP address] (unsafe)"
3. The certificate will be remembered

**iOS Safari:**
- iOS may require additional steps to trust the certificate
- See [iOS Certificate Trust](#ios-certificate-trust) below

### Step 3: Enter Pairing Code

1. Look at the Bridge window on your PC
2. Copy the 6-digit pairing code
3. Enter it in the PWA
4. Tap "Connect"

### Step 4: Start Using!

Once paired:
- ✅ Green indicator shows connection
- ✅ Latency is displayed
- ✅ Ready to control Windows

## Usage

### Mouse Control

**Trackpad:**
- Slide your finger to move the cursor
- Tap once for left click
- Two-finger slide for scrolling

**Buttons:**
- "Left Click" button for left mouse button
- "Right Click" button for right mouse button

**Tips:**
- Adjust sensitivity in Settings (gear icon)
- Larger movements = faster cursor motion
- Works like a laptop trackpad

### Keyboard Control

**To Open:**
- Tap the "Keyboard" button at the bottom

**Text Mode:**
- Tap individual keys to type
- Use the text input field for longer text
- Tap "Send" to submit text

**Special Keys:**
- Switch to "Special" tab for:
  - Arrow keys
  - Enter, Escape, Tab
  - Backspace, Delete
  - Space

**Function Keys:**
- Switch to "F1-F12" tab
- Access F1 through F12 keys

**Modifiers:**
- Tap Shift, Ctrl, Alt to activate
- They stay active until you press a key
- Tap again to deactivate

### Session Management

**Disconnect:**
- Tap the power icon (top right)
- Or close the PWA
- Bridge will release all inputs automatically

**Reconnect:**
- Open PWA again
- Connection resumes automatically
- May need to re-enter pairing code if session expired

## Troubleshooting

### Cannot Connect to Bridge

**Check:**
1. ✓ Bridge is running on Windows
2. ✓ Both devices on **same WiFi network**
3. ✓ Not on guest network or VPN
4. ✓ Windows Firewall allows port 8443
5. ✓ IP address is correct

**Test Firewall:**

```powershell
# Windows PowerShell (as Administrator)
New-NetFirewallRule -DisplayName "JarBees Motion Bridge" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
```

**Find Your PC's IP:**

```powershell
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### Certificate Warnings

**This is normal** for self-signed certificates on local networks.

**Android:**
- Accept the warning once
- Browser remembers the certificate

**iOS Certificate Trust:**

1. Download the certificate (if needed)
2. Go to Settings → General → About → Certificate Trust Settings
3. Enable trust for the certificate

Alternative: Use mDNS/Bonjour if your network supports `.local` domains.

### High Latency

**Causes:**
- WiFi 2.4GHz (slower than 5GHz)
- Distance from router
- Network congestion
- Interference

**Solutions:**
- Move closer to router
- Use WiFi 5GHz if available
- Close bandwidth-heavy apps
- Restart router

**Expected Latency:**
- WiFi 5GHz: < 50ms (excellent)
- WiFi 2.4GHz: < 100ms (good)
- \> 150ms: May feel sluggish

### Mouse Doesn't Move

**Possible Causes:**

1. **UAC Prompt Active**
   - Bridge cannot control UAC windows
   - Click through UAC prompt manually
   - Then control resumes

2. **Secure Desktop**
   - Ctrl+Alt+Del screen
   - Windows login screen
   - Bridge cannot control these for security

3. **Windows Locked**
   - Unlock Windows first
   - Then reconnect

**Solution:** Ensure Windows is unlocked and no UAC prompts are active.

### Keyboard Not Working

**Check:**
1. ✓ Keyboard overlay is open
2. ✓ Connection status is green
3. ✓ Not in a UAC or secure window

**For Special Characters:**
- Use text input field in keyboard
- Type the text, then tap "Send"
- More reliable for Unicode characters

### Connection Drops Randomly

**Causes:**
- Phone screen sleep/power saving
- WiFi power management
- Network instability

**Solutions:**
- Keep phone screen on while using
- Disable WiFi power saving in phone settings
- Improve WiFi signal strength

### Router/Network Issues

**Guest Network Isolation:**
- Many routers isolate guest network devices
- Use main WiFi network instead

**AP Isolation:**
- Some routers block device-to-device communication
- Check router settings
- Disable "AP Isolation" or "Client Isolation"

**VPN/Proxy:**
- Disable VPN on mobile device
- Bridge only works on local network

## Advanced Configuration

### Change Bridge Port

Edit `JarbeesMotionBridge` configuration (future feature) or rebuild with different port.

Default: `8443`

### Custom Certificate

Replace auto-generated certificate with your own:

1. Generate certificate with private key
2. Export as `.pfx` with password
3. Place in `%APPDATA%\JarbeesMotionBridge\bridge.pfx`
4. Restart Bridge

### Bridge as Windows Service

For advanced users who want Bridge to start automatically:

```powershell
# Use NSSM or similar service manager
nssm install JarbeesMotionBridge "C:\Path\To\JarbeesMotionBridge.exe"
nssm start JarbeesMotionBridge
```

## Security Considerations

### What's Secure

- ✅ Encrypted connection (TLS/SSL)
- ✅ Authentication required (pairing code)
- ✅ Local network only
- ✅ Session timeout (30 minutes)
- ✅ Automatic input release on disconnect

### What's NOT Protected

- ⚠️ Self-signed certificate (accept manually)
- ⚠️ No protection from local network attackers
- ⚠️ Cannot control UAC/secure desktop

### Best Practices

1. **Use only on trusted networks**
   - Home WiFi is safe
   - Office WiFi with trusted colleagues
   - Never on public WiFi

2. **Don't expose to Internet**
   - Bridge is for LAN only
   - No port forwarding
   - No exposing through Ngrok/Cloudflare

3. **Generate new codes**
   - Use "New Code" button regularly
   - Each pairing code is single-use
   - Expired codes don't work

4. **Keep Bridge window visible**
   - Monitor when connections occur
   - Use emergency stop if needed
   - Close Bridge when not in use

## FAQ

**Q: Can I use this over the Internet?**  
A: No, this is designed for local network only. Internet exposure would be a security risk.

**Q: Does it work with multiple monitors?**  
A: Yes, the cursor can move across all connected monitors.

**Q: Can multiple devices connect?**  
A: No, currently only one device at a time. Second connection is rejected.

**Q: Does it work on macOS or Linux?**  
A: Currently Windows only. The Bridge uses Windows-specific APIs (`SendInput`).

**Q: Is this safe?**  
A: Yes, for local trusted networks. All communication is encrypted and authenticated.

**Q: Can I use a wired connection instead of WiFi?**  
A: Yes, as long as both devices are on the same network. The mobile device would need WiFi, and PC can be wired.

**Q: What happens if I lose connection?**  
A: All pressed keys and mouse buttons are released automatically. No keys get "stuck."

**Q: Can I customize keyboard layout?**  
A: Currently uses standard QWERTY. Custom layouts may be added in future updates.

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/JarbeesMotion/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/JarbeesMotion/discussions)
- **Documentation:** [Main README](../README.md)

## Next Steps

- [View Keyboard Shortcuts](MOTION_SHORTCUTS.md)
- [Protocol Documentation](MOTION_PROTOCOL.md)
- [Security Details](MOTION_SECURITY.md)
- [Contributing Guide](../CONTRIBUTING.md)
