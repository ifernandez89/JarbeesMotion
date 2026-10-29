using System.Runtime.InteropServices;

namespace JarbeesMotionBridge;

/// <summary>
/// Windows input controller using SendInput API
/// Handles mouse and keyboard input injection with safety checks
/// </summary>
public class InputController
{
    private readonly HashSet<MouseButtonType> _pressedButtons = new();
    private readonly HashSet<ushort> _pressedKeys = new();
    private readonly object _lock = new();
    
    // Win32 API imports
    [DllImport("user32.dll")]
    private static extern bool SetCursorPos(int x, int y);
    
    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out POINT lpPoint);
    
    [DllImport("user32.dll")]
    private static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);
    
    private const int SM_CXSCREEN = 0;
    private const int SM_CYSCREEN = 1;
    
    [StructLayout(LayoutKind.Sequential)]
    private struct POINT
    {
        public int X;
        public int Y;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT
    {
        public uint Type;
        public INPUTUNION Union;
    }
    
    [StructLayout(LayoutKind.Explicit)]
    private struct INPUTUNION
    {
        [FieldOffset(0)] public MOUSEINPUT Mouse;
        [FieldOffset(0)] public KEYBDINPUT Keyboard;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
    
    // Input types
    private const uint INPUT_MOUSE = 0;
    private const uint INPUT_KEYBOARD = 1;
    
    // Mouse flags
    private const uint MOUSEEVENTF_MOVE = 0x0001;
    private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    private const uint MOUSEEVENTF_LEFTUP = 0x0004;
    private const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    private const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    private const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    private const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    private const uint MOUSEEVENTF_WHEEL = 0x0800;
    private const uint MOUSEEVENTF_HWHEEL = 0x1000;
    
    // Keyboard flags
    private const uint KEYEVENTF_KEYUP = 0x0002;
    private const uint KEYEVENTF_UNICODE = 0x0004;
    
    // Wheel delta
    private const int WHEEL_DELTA = 120;
    
    public void MoveMouse(int deltaX, int deltaY)
    {
        lock (_lock)
        {
            // Validate deltas
            deltaX = Math.Clamp(deltaX, -Protocol.MaxMouseDelta, Protocol.MaxMouseDelta);
            deltaY = Math.Clamp(deltaY, -Protocol.MaxMouseDelta, Protocol.MaxMouseDelta);
            
            // Get current position
            if (!GetCursorPos(out POINT currentPos))
                return;
            
            // Calculate new position
            int newX = currentPos.X + deltaX;
            int newY = currentPos.Y + deltaY;
            
            // Clamp to screen bounds
            int screenWidth = GetSystemMetrics(SM_CXSCREEN);
            int screenHeight = GetSystemMetrics(SM_CYSCREEN);
            newX = Math.Clamp(newX, 0, screenWidth - 1);
            newY = Math.Clamp(newY, 0, screenHeight - 1);
            
            // Move cursor
            SetCursorPos(newX, newY);
        }
    }
    
    public void MouseButton(MouseButtonType button, MouseButtonAction action)
    {
        lock (_lock)
        {
            uint flags = button switch
            {
                MouseButtonType.Left => action == MouseButtonAction.Press ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP,
                MouseButtonType.Right => action == MouseButtonAction.Press ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP,
                MouseButtonType.Middle => action == MouseButtonAction.Press ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP,
                _ => 0
            };
            
            if (flags == 0) return;
            
            // Track pressed state
            if (action == MouseButtonAction.Press)
                _pressedButtons.Add(button);
            else
                _pressedButtons.Remove(button);
            
            var input = new INPUT
            {
                Type = INPUT_MOUSE,
                Union = new INPUTUNION
                {
                    Mouse = new MOUSEINPUT
                    {
                        dx = 0,
                        dy = 0,
                        mouseData = 0,
                        dwFlags = flags,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                }
            };
            
            SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
        }
    }
    
    public void MouseScroll(int deltaX, int deltaY)
    {
        lock (_lock)
        {
            // Vertical scroll
            if (deltaY != 0)
            {
                int scrollAmount = deltaY * WHEEL_DELTA;
                var input = new INPUT
                {
                    Type = INPUT_MOUSE,
                    Union = new INPUTUNION
                    {
                        Mouse = new MOUSEINPUT
                        {
                            dx = 0,
                            dy = 0,
                            mouseData = (uint)scrollAmount,
                            dwFlags = MOUSEEVENTF_WHEEL,
                            time = 0,
                            dwExtraInfo = IntPtr.Zero
                        }
                    }
                };
                SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
            }
            
            // Horizontal scroll
            if (deltaX != 0)
            {
                int scrollAmount = deltaX * WHEEL_DELTA;
                var input = new INPUT
                {
                    Type = INPUT_MOUSE,
                    Union = new INPUTUNION
                    {
                        Mouse = new MOUSEINPUT
                        {
                            dx = 0,
                            dy = 0,
                            mouseData = (uint)scrollAmount,
                            dwFlags = MOUSEEVENTF_HWHEEL,
                            time = 0,
                            dwExtraInfo = IntPtr.Zero
                        }
                    }
                };
                SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
            }
        }
    }
    
    public void SendText(string text)
    {
        if (string.IsNullOrEmpty(text) || text.Length > Protocol.MaxTextLength)
            return;
        
        lock (_lock)
        {
            foreach (char c in text)
            {
                // Send key down
                var inputDown = new INPUT
                {
                    Type = INPUT_KEYBOARD,
                    Union = new INPUTUNION
                    {
                        Keyboard = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = c,
                            dwFlags = KEYEVENTF_UNICODE,
                            time = 0,
                            dwExtraInfo = IntPtr.Zero
                        }
                    }
                };
                
                // Send key up
                var inputUp = new INPUT
                {
                    Type = INPUT_KEYBOARD,
                    Union = new INPUTUNION
                    {
                        Keyboard = new KEYBDINPUT
                        {
                            wVk = 0,
                            wScan = c,
                            dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                            time = 0,
                            dwExtraInfo = IntPtr.Zero
                        }
                    }
                };
                
                SendInput(2, new[] { inputDown, inputUp }, Marshal.SizeOf<INPUT>());
            }
        }
    }
    
    public void SendKey(ushort virtualKey, KeyAction action)
    {
        lock (_lock)
        {
            // Track pressed state
            if (action == KeyAction.Press)
                _pressedKeys.Add(virtualKey);
            else
                _pressedKeys.Remove(virtualKey);
            
            uint flags = action == KeyAction.Release ? KEYEVENTF_KEYUP : 0;
            
            var input = new INPUT
            {
                Type = INPUT_KEYBOARD,
                Union = new INPUTUNION
                {
                    Keyboard = new KEYBDINPUT
                    {
                        wVk = virtualKey,
                        wScan = 0,
                        dwFlags = flags,
                        time = 0,
                        dwExtraInfo = IntPtr.Zero
                    }
                }
            };
            
            SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
        }
    }
    
    /// <summary>
    /// Emergency release all pressed keys and buttons
    /// Called on disconnect or session end
    /// </summary>
    public void ReleaseAll()
    {
        lock (_lock)
        {
            // Release all mouse buttons
            foreach (var button in _pressedButtons.ToList())
            {
                MouseButton(button, MouseButtonAction.Release);
            }
            _pressedButtons.Clear();
            
            // Release all keyboard keys
            foreach (var key in _pressedKeys.ToList())
            {
                SendKey(key, KeyAction.Release);
            }
            _pressedKeys.Clear();
        }
    }
    
    public bool IsUacActive()
    {
        // Check if UAC or secure desktop is active
        // SendInput doesn't work in these contexts
        var foregroundWindow = GetForegroundWindow();
        return foregroundWindow == IntPtr.Zero;
    }
}

/// <summary>
/// Virtual key codes for common keys
/// </summary>
public static class VirtualKeys
{
    public const ushort VK_BACK = 0x08;
    public const ushort VK_TAB = 0x09;
    public const ushort VK_RETURN = 0x0D;
    public const ushort VK_SHIFT = 0x10;
    public const ushort VK_CONTROL = 0x11;
    public const ushort VK_MENU = 0x12; // Alt
    public const ushort VK_ESCAPE = 0x1B;
    public const ushort VK_SPACE = 0x20;
    public const ushort VK_LEFT = 0x25;
    public const ushort VK_UP = 0x26;
    public const ushort VK_RIGHT = 0x27;
    public const ushort VK_DOWN = 0x28;
    public const ushort VK_DELETE = 0x2E;
    public const ushort VK_LWIN = 0x5B;
    public const ushort VK_RWIN = 0x5C;
    public const ushort VK_F1 = 0x70;
    public const ushort VK_F12 = 0x7B;
    
    public static ushort? GetVirtualKey(string keyName)
    {
        return keyName.ToUpperInvariant() switch
        {
            "BACKSPACE" => VK_BACK,
            "TAB" => VK_TAB,
            "ENTER" => VK_RETURN,
            "SHIFT" => VK_SHIFT,
            "CTRL" => VK_CONTROL,
            "ALT" => VK_MENU,
            "ESCAPE" => VK_ESCAPE,
            "SPACE" => VK_SPACE,
            "LEFT" => VK_LEFT,
            "UP" => VK_UP,
            "RIGHT" => VK_RIGHT,
            "DOWN" => VK_DOWN,
            "DELETE" => VK_DELETE,
            "WIN" => VK_LWIN,
            _ when keyName.StartsWith("F") && int.TryParse(keyName[1..], out int fNum) && fNum >= 1 && fNum <= 12 
                => (ushort)(VK_F1 + fNum - 1),
            _ => null
        };
    }
}
