"use client";

import { useState, useEffect } from "react";
import { MotionController } from "@/components/motion/MotionController";

export default function MotionPage() {
  const [bridgeUrl, setBridgeUrl] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    // Try to load saved bridge URL from localStorage
    const saved = localStorage.getItem("jarbees-motion-bridge-url");
    if (saved) {
      setBridgeUrl(saved);
      setIsConfigured(true);
    }
  }, []);

  const handleAutoDetect = () => {
    // Try common local IP patterns
    const hostname = window.location.hostname;
    
    // If running on localhost, use localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const url = "wss://localhost:8443/motion";
      setBridgeUrl(url);
      localStorage.setItem("jarbees-motion-bridge-url", url);
      setIsConfigured(true);
      return;
    }

    // Otherwise, prompt user for their PC's IP
    const detectedUrl = "wss://192.168.1.100:8443/motion";
    setManualUrl(detectedUrl);
  };

  const handleManualConnect = () => {
    if (!manualUrl.trim()) return;
    
    // Ensure URL has protocol
    let url = manualUrl.trim();
    if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
      url = "wss://" + url;
    }
    
    // Ensure URL has path
    if (!url.endsWith("/motion")) {
      url = url + "/motion";
    }

    setBridgeUrl(url);
    localStorage.setItem("jarbees-motion-bridge-url", url);
    setIsConfigured(true);
  };

  // Show controller if URL is configured
  if (isConfigured && bridgeUrl) {
    return <MotionController bridgeUrl={bridgeUrl} />;
  }

  // Show setup screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐝🖱️</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            JarBees Motion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Remote Mouse & Keyboard Control
          </p>
        </div>

        {/* Setup card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Setup Connection
          </h2>

          {/* Auto-detect option */}
          <div className="mb-6">
            <button
              onClick={handleAutoDetect}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              🔍 Auto-Detect Bridge
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Recommended for getting started
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                Or enter manually
              </span>
            </div>
          </div>

          {/* Manual input */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bridge Address
              </label>
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="192.168.1.100:8443"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleManualConnect();
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: IP:PORT or wss://IP:PORT/motion
              </p>
            </div>

            <button
              onClick={handleManualConnect}
              disabled={!manualUrl.trim()}
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:shadow-none"
            >
              Connect
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📝 Before Connecting
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Start JarBees Motion Bridge on Windows</li>
            <li>2. Note the IP address shown in the Bridge</li>
            <li>3. Ensure both devices on same WiFi</li>
            <li>4. Enter the IP address above</li>
          </ol>
        </div>

        {/* Help */}
        <div className="text-center">
          <a
            href="https://github.com/yourusername/JarbeesMotion#setup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Need help? View setup guide →
          </a>
        </div>
      </div>
    </div>
  );
}
