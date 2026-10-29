using System.Security.Cryptography.X509Certificates;

namespace JarbeesMotionBridge;

static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

public class MainForm : Form
{
    private MotionServer? _server;
    private SessionManager? _sessionManager;
    private CertificateManager? _certificateManager;
    
    private Label? _titleLabel;
    private Label? _statusLabel;
    private Label? _pairingCodeLabel;
    private TextBox? _logTextBox;
    private Button? _startButton;
    private Button? _stopButton;
    private Button? _generateCodeButton;
    private Button? _emergencyStopButton;
    private Label? _connectionLabel;
    private Label? _ipLabel;
    
    private const int DefaultPort = 8443;
    
    public MainForm()
    {
        InitializeComponents();
        InitializeManagers();
    }
    
    private void InitializeComponents()
    {
        // Form setup
        Text = "JarBees Motion Bridge";
        Size = new Size(600, 700);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        
        // Title
        _titleLabel = new Label
        {
            Text = "🐝 JarBees Motion Bridge",
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            Location = new Point(20, 20),
            Size = new Size(560, 40),
            TextAlign = ContentAlignment.MiddleCenter
        };
        
        // Status
        _statusLabel = new Label
        {
            Text = "Status: Stopped",
            Font = new Font("Segoe UI", 10),
            Location = new Point(20, 70),
            Size = new Size(560, 25),
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.Gray
        };
        
        // IP Address
        _ipLabel = new Label
        {
            Text = "",
            Font = new Font("Segoe UI", 9),
            Location = new Point(20, 95),
            Size = new Size(560, 40),
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.DarkGray
        };
        
        // Pairing Code
        _pairingCodeLabel = new Label
        {
            Text = "Pairing Code: ------",
            Font = new Font("Consolas", 24, FontStyle.Bold),
            Location = new Point(20, 140),
            Size = new Size(560, 50),
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.DarkBlue,
            BorderStyle = BorderStyle.FixedSingle,
            BackColor = Color.LightYellow
        };
        
        // Connection status
        _connectionLabel = new Label
        {
            Text = "No device connected",
            Font = new Font("Segoe UI", 10),
            Location = new Point(20, 200),
            Size = new Size(560, 25),
            TextAlign = ContentAlignment.MiddleCenter,
            ForeColor = Color.Gray
        };
        
        // Buttons
        _startButton = new Button
        {
            Text = "Start Bridge",
            Font = new Font("Segoe UI", 11, FontStyle.Bold),
            Location = new Point(50, 240),
            Size = new Size(150, 40),
            BackColor = Color.LightGreen
        };
        _startButton.Click += StartButton_Click;
        
        _stopButton = new Button
        {
            Text = "Stop Bridge",
            Font = new Font("Segoe UI", 11),
            Location = new Point(220, 240),
            Size = new Size(150, 40),
            Enabled = false
        };
        _stopButton.Click += StopButton_Click;
        
        _generateCodeButton = new Button
        {
            Text = "New Code",
            Font = new Font("Segoe UI", 11),
            Location = new Point(390, 240),
            Size = new Size(150, 40),
            Enabled = false
        };
        _generateCodeButton.Click += GenerateCodeButton_Click;
        
        // Emergency stop
        _emergencyStopButton = new Button
        {
            Text = "🛑 EMERGENCY STOP",
            Font = new Font("Segoe UI", 12, FontStyle.Bold),
            Location = new Point(150, 290),
            Size = new Size(300, 50),
            BackColor = Color.Red,
            ForeColor = Color.White,
            Enabled = false
        };
        _emergencyStopButton.Click += EmergencyStopButton_Click;
        
        // Log
        var logLabel = new Label
        {
            Text = "Activity Log:",
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            Location = new Point(20, 355),
            Size = new Size(560, 20)
        };
        
        _logTextBox = new TextBox
        {
            Location = new Point(20, 380),
            Size = new Size(560, 280),
            Multiline = true,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            Font = new Font("Consolas", 9),
            BackColor = Color.Black,
            ForeColor = Color.LightGreen
        };
        
        // Add controls
        Controls.Add(_titleLabel);
        Controls.Add(_statusLabel);
        Controls.Add(_ipLabel);
        Controls.Add(_pairingCodeLabel);
        Controls.Add(_connectionLabel);
        Controls.Add(_startButton);
        Controls.Add(_stopButton);
        Controls.Add(_generateCodeButton);
        Controls.Add(_emergencyStopButton);
        Controls.Add(logLabel);
        Controls.Add(_logTextBox);
    }
    
    private void InitializeManagers()
    {
        try
        {
            // Setup certificate
            var appData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "JarbeesMotionBridge");
            Directory.CreateDirectory(appData);
            
            var certPath = Path.Combine(appData, "bridge.pfx");
            _certificateManager = new CertificateManager(certPath);
            
            // Setup session manager
            _sessionManager = new SessionManager();
            _sessionManager.PairingCodeGenerated += SessionManager_PairingCodeGenerated;
            _sessionManager.SessionStarted += SessionManager_SessionStarted;
            _sessionManager.SessionEnded += SessionManager_SessionEnded;
            
            Log("Managers initialized");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Initialization error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
    
    private void StartButton_Click(object? sender, EventArgs e)
    {
        try
        {
            if (_sessionManager == null || _certificateManager == null)
            {
                MessageBox.Show("Managers not initialized", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            
            // Get or create certificate
            var certificate = _certificateManager.GetOrCreateCertificate();
            if (certificate == null)
            {
                MessageBox.Show("Failed to create SSL certificate", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            
            // Create and start server
            _server = new MotionServer(DefaultPort, _sessionManager, certificate);
            _server.LogMessage += Server_LogMessage;
            _server.Start();
            
            // Generate initial pairing code
            var code = _sessionManager.GeneratePairingCode();
            
            // Update UI
            _startButton!.Enabled = false;
            _stopButton!.Enabled = true;
            _generateCodeButton!.Enabled = true;
            _emergencyStopButton!.Enabled = true;
            _statusLabel!.Text = "Status: Running";
            _statusLabel.ForeColor = Color.Green;
            
            var localIp = GetLocalIPAddress();
            _ipLabel!.Text = $"Connect from mobile device:\nwss://{localIp}:{DefaultPort}/motion";
            
            Log($"✓ Bridge started on port {DefaultPort}");
            Log(CertificateManager.GetInstallInstructions(_certificateManager.MobileCaCertificatePath));
            Log($"✓ Pairing code: {code}");
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to start: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Log($"✗ Error: {ex.Message}");
        }
    }
    
    private void StopButton_Click(object? sender, EventArgs e)
    {
        try
        {
            _server?.Stop();
            _server = null;
            
            _sessionManager?.EndSession();
            
            // Update UI
            _startButton!.Enabled = true;
            _stopButton!.Enabled = false;
            _generateCodeButton!.Enabled = false;
            _emergencyStopButton!.Enabled = false;
            _statusLabel!.Text = "Status: Stopped";
            _statusLabel.ForeColor = Color.Gray;
            _ipLabel!.Text = "";
            _pairingCodeLabel!.Text = "Pairing Code: ------";
            _connectionLabel!.Text = "No device connected";
            _connectionLabel.ForeColor = Color.Gray;
            
            Log("Bridge stopped");
        }
        catch (Exception ex)
        {
            Log($"Error stopping: {ex.Message}");
        }
    }
    
    private void GenerateCodeButton_Click(object? sender, EventArgs e)
    {
        if (_sessionManager == null) return;
        
        if (_sessionManager.HasActiveSession)
        {
            var result = MessageBox.Show(
                "A device is currently connected. Generating a new code will end the current session. Continue?",
                "Confirm",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
            
            if (result != DialogResult.Yes)
                return;
            
            _sessionManager.EndSession();
        }
        
        var code = _sessionManager.GeneratePairingCode();
        Log($"New pairing code: {code}");
    }
    
    private void EmergencyStopButton_Click(object? sender, EventArgs e)
    {
        // Immediate stop of all inputs
        var inputController = new InputController();
        inputController.ReleaseAll();
        
        _sessionManager?.EndSession();
        
        Log("🛑 EMERGENCY STOP - All inputs released");
        MessageBox.Show("Emergency stop activated.\nAll keyboard and mouse inputs have been released.",
            "Emergency Stop", MessageBoxButtons.OK, MessageBoxIcon.Warning);
    }
    
    private void SessionManager_PairingCodeGenerated(object? sender, string code)
    {
        if (InvokeRequired)
        {
            Invoke(() => SessionManager_PairingCodeGenerated(sender, code));
            return;
        }
        
        _pairingCodeLabel!.Text = $"Pairing Code: {code}";
    }
    
    private void SessionManager_SessionStarted(object? sender, string deviceName)
    {
        if (InvokeRequired)
        {
            Invoke(() => SessionManager_SessionStarted(sender, deviceName));
            return;
        }
        
        _connectionLabel!.Text = $"🟢 Connected: {deviceName}";
        _connectionLabel.ForeColor = Color.Green;
        _pairingCodeLabel!.Text = "Pairing Code: (in use)";
        _pairingCodeLabel.BackColor = Color.LightGreen;
        
        Log($"✓ Device connected: {deviceName}");
    }
    
    private void SessionManager_SessionEnded(object? sender, EventArgs e)
    {
        if (InvokeRequired)
        {
            Invoke(() => SessionManager_SessionEnded(sender, e));
            return;
        }
        
        _connectionLabel!.Text = "No device connected";
        _connectionLabel.ForeColor = Color.Gray;
        _pairingCodeLabel!.BackColor = Color.LightYellow;
        
        // Generate new code
        if (_sessionManager != null && _server != null)
        {
            var code = _sessionManager.GeneratePairingCode();
        }
        
        Log("Device disconnected");
    }
    
    private void Server_LogMessage(object? sender, string message)
    {
        Log(message);
    }
    
    private void Log(string message)
    {
        if (InvokeRequired)
        {
            Invoke(() => Log(message));
            return;
        }
        
        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        _logTextBox?.AppendText($"[{timestamp}] {message}\r\n");
    }
    
    private static string GetLocalIPAddress()
    {
        try
        {
            var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
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
    
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (_server != null)
        {
            var result = MessageBox.Show(
                "The bridge is still running. Stop the bridge before closing?",
                "Confirm Close",
                MessageBoxButtons.YesNoCancel,
                MessageBoxIcon.Question);
            
            if (result == DialogResult.Cancel)
            {
                e.Cancel = true;
                return;
            }
            
            if (result == DialogResult.Yes)
            {
                _server.Stop();
            }
        }
        
        base.OnFormClosing(e);
    }
}
