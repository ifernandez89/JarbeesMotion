# JarBees Motion v2.0.0 - Verification Checklist

**Status:** 🟡 PENDING - Implementation complete, awaiting real-world testing

This document tracks the verification of JarBees Motion on actual hardware. All tests must pass before the release can be considered production-ready.

## Test Environment

- **Windows PC:** [Version to be filled]
- **Mobile Device:** Moto G(7) Plus, Android [Version]
- **Network:** [WiFi Router Model/Type]
- **Browser:** [Chrome/Edge version]

## Phase 0: Build Verification

### Bridge Compilation

```powershell
cd c:\Projects\JarbeesMotion\bridge
dotnet --info
dotnet build -c Release
```

**Results:**
- [ ] .NET SDK version: ________________
- [ ] Build completed: ☐ Success ☐ Errors
- [ ] Warnings (if any): ________________
- [ ] Output location: ________________

**Expected Output:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### PWA Build

```bash
cd c:\Projects\JarbeesMotion
npm --version
npm ci --legacy-peer-deps
npm run build
```

**Results:**
- [ ] Node version: ________________
- [ ] Build completed: ☐ Success ☐ Errors
- [ ] Export successful: ☐ Yes ☐ No
- [ ] Static files in: `out/` ☐ Verified

**Expected Output:**
```
✓ Generating static pages
✓ Finalizing page optimization
```

## Phase 1: First Start

### Bridge Startup

**Test Steps:**
1. Run `JarbeesMotionBridge.exe` (as Administrator first time)
2. Observe certificate generation
3. Note IP address displayed
4. Note 6-digit pairing code
5. Check Windows Firewall prompt

**Results:**
- [ ] Application launched: ☐ Yes ☐ No
- [ ] Certificate created: ☐ Yes ☐ No
- [ ] Certificate location: ________________
- [ ] Firewall prompt appeared: ☐ Yes ☐ No
- [ ] Firewall allowed: ☐ Yes ☐ No
- [ ] IP address shown: ________________
- [ ] Pairing code: ________________
- [ ] WebSocket URL: ________________

**Expected Behavior:**
- Window opens showing status
- Console shows "✓ WebSocket server started"
- IP address and pairing code visible

### PWA Access

**Test Steps:**
1. Open PWA on mobile browser
2. Navigate to `/motion`
3. See setup screen

**Results:**
- [ ] PWA loaded: ☐ Yes ☐ No
- [ ] Motion page accessible: ☐ Yes ☐ No
- [ ] Setup screen displays: ☐ Yes ☐ No

## Phase 2: Network Connection

### WSS Connectivity

**Test Steps:**
1. In PWA, enter Bridge IP address
2. Tap "Connect"
3. Accept certificate warning (if shown)
4. Observe connection state

**Results:**
- [ ] Connection initiated: ☐ Yes ☐ No
- [ ] Certificate warning: ☐ Shown ☐ Not shown
- [ ] Certificate accepted: ☐ Yes ☐ No ☐ N/A
- [ ] Connection state: ☐ Connected ☐ Error
- [ ] Error message (if any): ________________

**Common Issues:**
- ❌ "Connection refused" → Check firewall
- ❌ "Certificate invalid" → Accept self-signed cert
- ❌ "Network error" → Check same WiFi network

### Pairing

**Test Steps:**
1. Enter 6-digit code from Bridge
2. Tap "Connect"
3. Wait for authentication

**Results:**
- [ ] Pairing initiated: ☐ Yes ☐ No
- [ ] Authentication success: ☐ Yes ☐ No
- [ ] Session started: ☐ Yes ☐ No
- [ ] Green indicator: ☐ Yes ☐ No
- [ ] Latency displayed: ☐ Yes (___ms) ☐ No

**Expected:**
- Bridge shows "✓ Device paired: [device name]"
- PWA shows "🟢 Connected to Windows PC"

## Phase 3: Input Testing

### Mouse Movement

**Test Steps:**
1. Slide finger on trackpad area
2. Observe cursor movement on Windows
3. Try different speeds and directions

**Results:**
- [ ] Cursor moves: ☐ Yes ☐ No
- [ ] Movement smooth: ☐ Yes ☐ Jerky
- [ ] Direction correct: ☐ Yes ☐ Inverted
- [ ] Sensitivity appropriate: ☐ Yes ☐ Too fast ☐ Too slow

**Notes:** ________________

### Mouse Buttons

**Test Steps:**
1. Tap "Left Click" button
2. Tap "Right Click" button
3. Tap once on trackpad (quick tap)

**Results:**
- [ ] Left click works: ☐ Yes ☐ No
- [ ] Right click works: ☐ Yes ☐ No
- [ ] Trackpad tap works: ☐ Yes ☐ No

**Test in:** Notepad, File Explorer, Desktop

### Mouse Scroll

**Test Steps:**
1. Open a long document
2. Use two-finger gesture on trackpad
3. Observe scrolling

**Results:**
- [ ] Scroll works: ☐ Yes ☐ No
- [ ] Direction correct: ☐ Yes ☐ Inverted
- [ ] Smooth: ☐ Yes ☐ Choppy

### Keyboard - Text Input

**Test Steps:**
1. Open Notepad on Windows
2. Tap "Keyboard" button in PWA
3. Type text using virtual keyboard
4. Use text input field for longer text

**Results:**
- [ ] Keyboard opens: ☐ Yes ☐ No
- [ ] Individual keys work: ☐ Yes ☐ No
- [ ] Text field works: ☐ Yes ☐ No
- [ ] Text appears in Notepad: ☐ Yes ☐ No
- [ ] Unicode/emoji work: ☐ Yes ☐ No ☐ Not tested

**Sample text typed:** ________________

### Keyboard - Special Keys

**Test Steps:**
1. Test Enter, Escape, Tab
2. Test Arrow keys
3. Test Backspace, Delete

**Results:**
- [ ] Enter: ☐ Works ☐ Fails
- [ ] Escape: ☐ Works ☐ Fails
- [ ] Tab: ☐ Works ☐ Fails
- [ ] Arrows: ☐ Work ☐ Fail
- [ ] Backspace: ☐ Works ☐ Fails
- [ ] Delete: ☐ Works ☐ Fails

### Keyboard - Modifiers

**Test Steps:**
1. Enable Shift, type letter (should be uppercase)
2. Try Ctrl+C, Ctrl+V (copy/paste)
3. Try Alt+Tab (window switching)

**Results:**
- [ ] Shift works: ☐ Yes ☐ No
- [ ] Ctrl combinations: ☐ Work ☐ Fail
- [ ] Alt combinations: ☐ Work ☐ Fail

## Phase 4: Safety & Security

### Disconnect Handling

**Test Steps:**
1. Press and hold left mouse button in PWA
2. Tap disconnect button
3. Verify button released in Windows

**Results:**
- [ ] Button held: ☐ Yes ☐ No
- [ ] Disconnect clean: ☐ Yes ☐ No
- [ ] Button released: ☐ Yes ☐ Stuck

**Repeat with:**
- [ ] Keyboard key held
- [ ] Multiple keys held

### Network Loss

**Test Steps:**
1. Hold a key down
2. Disable WiFi on mobile
3. Check if key releases in Windows

**Results:**
- [ ] Key held: ☐ Yes ☐ No
- [ ] WiFi disabled: ☐ Yes ☐ No
- [ ] Key released: ☐ Yes (after ___s) ☐ Stuck

### Emergency Stop

**Test Steps:**
1. Hold multiple keys/buttons
2. Click red emergency stop in Bridge
3. Verify all inputs released

**Results:**
- [ ] Emergency stop clicked: ☐ Yes ☐ No
- [ ] All inputs released: ☐ Yes ☐ Some stuck
- [ ] Session ended: ☐ Yes ☐ No

### UAC Protection

**Test Steps:**
1. Connect and verify working
2. Trigger UAC prompt (e.g., run app as admin)
3. Try to control UAC window

**Results:**
- [ ] UAC prompt shown: ☐ Yes ☐ No
- [ ] Control blocked: ☐ Yes (correct) ☐ No (security issue)
- [ ] Error message shown: ☐ Yes ☐ No

**Expected:** Control should NOT work on UAC windows.

### Session Timeout

**Test Steps:**
1. Connect successfully
2. Wait 30+ minutes without activity
3. Try to send input

**Results:**
- [ ] Session timed out: ☐ Yes ☐ No
- [ ] Re-pairing required: ☐ Yes ☐ No

### Multiple Connections

**Test Steps:**
1. Connect from first device
2. Try to connect from second device
3. Observe rejection

**Results:**
- [ ] First connection active: ☐ Yes ☐ No
- [ ] Second connection rejected: ☐ Yes (correct) ☐ No (bug)
- [ ] Error message clear: ☐ Yes ☐ No

## Phase 5: Performance

### Latency Measurement

**Test Steps:**
1. Note latency shown in PWA
2. Test at different times of day
3. Test with other network activity

**Results:**
- [ ] Latency displayed: ☐ Yes (___ms) ☐ No
- [ ] Feels responsive: ☐ Yes ☐ Laggy
- [ ] WiFi band: ☐ 2.4GHz ☐ 5GHz
- [ ] Distance from router: ☐ Close ☐ Medium ☐ Far

**Measurements:**
- Best: ___ms
- Typical: ___ms
- Worst: ___ms
- Median: ___ms
- 95th percentile: ___ms

### Sensitivity

**Test Steps:**
1. Test default sensitivity (1.5x)
2. Adjust to minimum (0.5x)
3. Adjust to maximum (3.0x)

**Results:**
- [ ] Settings accessible: ☐ Yes ☐ No
- [ ] Sensitivity changes effective: ☐ Yes ☐ No
- [ ] Preferred setting: ___x

### Stability

**Test Steps:**
1. Use continuously for 10+ minutes
2. Perform various tasks
3. Check for crashes or freezes

**Results:**
- [ ] Duration used: ___minutes
- [ ] PWA stable: ☐ Yes ☐ Crashed
- [ ] Bridge stable: ☐ Yes ☐ Crashed
- [ ] Connection stable: ☐ Yes ☐ Dropped

## Phase 6: Edge Cases

### Expired Pairing Code

**Test Steps:**
1. Generate code, wait 10+ minutes
2. Try to use expired code

**Results:**
- [ ] Code expired: ☐ Yes ☐ Still works (bug)
- [ ] Error message: ☐ Clear ☐ Confusing

### Invalid Input

**Test Steps:**
1. Try connecting to wrong IP
2. Enter invalid pairing code
3. Send rapid-fire movements

**Results:**
- [ ] Wrong IP handled: ☐ Gracefully ☐ Crashes
- [ ] Invalid code rejected: ☐ Yes ☐ No
- [ ] Rate limiting works: ☐ Yes ☐ No

### Reconnection

**Test Steps:**
1. Connect, disconnect, reconnect
2. Repeat 5 times

**Results:**
- [ ] Reconnection works: ☐ Always ☐ Sometimes ☐ Never
- [ ] Each reconnection count: ☐ All successful

## Known Issues

Document any bugs or issues found:

1. ________________
2. ________________
3. ________________

## Performance Notes

- **Best use case:** ________________
- **Worst use case:** ________________
- **Recommended settings:** ________________

## Final Verdict

- [ ] ✅ **PASS** - Ready for production use
- [ ] ⚠️ **PASS WITH NOTES** - Usable with documented limitations
- [ ] ❌ **FAIL** - Critical issues prevent use

**Overall Assessment:** ________________

**Date of Verification:** ________________
**Verified by:** ________________
**Next Review Date:** ________________

## Recommendations

Based on testing results:

1. ________________
2. ________________
3. ________________

---

**Note:** Update this document as verification progresses. Keep it as the single source of truth for v2.0.0 validation status.
