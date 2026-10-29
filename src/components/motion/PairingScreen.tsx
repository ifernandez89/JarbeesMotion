"use client";

import { useState } from "react";

interface PairingScreenProps {
  onPair: (code: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function PairingScreen({
  onPair,
  onCancel,
  loading = false,
  error = null,
}: PairingScreenProps) {
  const [code, setCode] = useState("");
  const [bridgeIp, setBridgeIp] = useState("");

  const handleCodeChange = (value: string) => {
    // Only allow digits, max 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && !loading) {
      await onPair(code);
    }
  };

  const isValidCode = code.length === 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐝</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            JarBees Motion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Control Windows from your phone
          </p>
        </div>

        {/* Pairing card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Connect to Bridge
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bridge IP (optional, for display) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bridge Address (optional)
              </label>
              <input
                type="text"
                value={bridgeIp}
                onChange={(e) => setBridgeIp(e.target.value)}
                placeholder="192.168.1.100:8443"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Shown in the Bridge window
              </p>
            </div>

            {/* Pairing code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                6-Digit Pairing Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="123456"
                disabled={loading}
                autoFocus
                className="w-full px-4 py-3 text-2xl font-mono text-center tracking-widest border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the code displayed in the Windows Bridge
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValidCode || loading}
                className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📝 Setup Instructions
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Start the JarBees Motion Bridge on your Windows PC</li>
            <li>2. Make sure your phone and PC are on the same WiFi network</li>
            <li>3. Copy the 6-digit pairing code from the Bridge window</li>
            <li>4. Enter the code above and tap Connect</li>
          </ol>
        </div>

        {/* Troubleshooting link */}
        <div className="mt-4 text-center">
          <button
            onClick={() =>
              window.open(
                "https://github.com/yourusername/JarbeesMotion#troubleshooting",
                "_blank"
              )
            }
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Having trouble connecting? View troubleshooting guide
          </button>
        </div>
      </div>
    </div>
  );
}
