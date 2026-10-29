"use client";

import { useState, useEffect } from "react";
import { useMotionClient } from "@/lib/motion/useMotionClient";
import { ConnectionState } from "@/types/motion";
import { Trackpad } from "./Trackpad";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { ConnectionStatus } from "./ConnectionStatus";
import { PairingScreen } from "./PairingScreen";
import {
  KeyboardIcon,
  PowerIcon,
  SettingsIcon,
  BeeIcon,
  HelpIcon,
} from "./MotionIcons";

interface MotionControllerProps {
  bridgeUrl: string;
}

export function MotionController({ bridgeUrl }: MotionControllerProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.5);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const {
    state,
    isConnected,
    isAuthenticated,
    latency,
    error,
    connect,
    disconnect,
    pair,
    sendMouseMove,
    sendMouseButton,
    sendMouseScroll,
    sendKeyboardText,
    sendKeyboardKey,
  } = useMotionClient({
    bridgeUrl,
    autoConnect: true,
    onError: (err) => {
      console.error("Motion client error:", err);
    },
  });

  // Auto-reconnect on mount
  useEffect(() => {
    if (state === ConnectionState.Disconnected) {
      connect();
    }
  }, [state, connect]);

  const handlePair = async (code: string) => {
    setIsPairing(true);
    setPairingError(null);

    try {
      await pair(code, "JarBees Mobile");
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleRetryConnection = () => {
    setPairingError(null);
    connect();
  };

  // Show pairing screen if connected but not authenticated
  if (isConnected && !isAuthenticated) {
    return (
      <PairingScreen
        onPair={handlePair}
        onCancel={handleDisconnect}
        loading={isPairing}
        error={pairingError}
      />
    );
  }

  // Show error screen if connection failed
  if (state === ConnectionState.Error || !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {error?.message || "Cannot connect to Windows Bridge"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              Troubleshooting
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>✓ Bridge is running on Windows</li>
              <li>✓ Both devices on same WiFi network</li>
              <li>✓ Firewall allows port 8443</li>
              <li>✓ Bridge URL is correct: {bridgeUrl}</li>
            </ul>

            <button
              onClick={handleRetryConnection}
              className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() =>
                window.open(
                  "https://github.com/yourusername/JarbeesMotion#troubleshooting",
                  "_blank"
                )
              }
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View detailed troubleshooting guide
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main controller interface
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BeeIcon className="w-6 h-6 text-yellow-500" />
          <h1 className="font-bold text-lg text-gray-900 dark:text-white">
            JarBees Motion
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleDisconnect}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Disconnect"
          >
            <PowerIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </header>

      {/* Connection status */}
      <div className="px-4 py-2">
        <ConnectionStatus state={state} latency={latency} deviceName="Windows PC" />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mx-4 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Mouse Sensitivity: {sensitivity.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Bridge URL: {bridgeUrl}
            </div>
          </div>
        </div>
      )}

      {/* Main trackpad area */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <Trackpad
          onMove={sendMouseMove}
          onButton={sendMouseButton}
          onScroll={sendMouseScroll}
          sensitivity={sensitivity}
          enabled={isAuthenticated}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 flex gap-3">
        <button
          onClick={() => setShowKeyboard(true)}
          disabled={!isAuthenticated}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-600 active:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <KeyboardIcon className="w-5 h-5" />
          <span>Keyboard</span>
        </button>

        <button
          onClick={() =>
            window.open(
              "https://github.com/yourusername/JarbeesMotion",
              "_blank"
            )
          }
          className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          title="Help"
        >
          <HelpIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Virtual keyboard overlay */}
      {showKeyboard && (
        <VirtualKeyboard
          onText={sendKeyboardText}
          onKey={sendKeyboardKey}
          onClose={() => setShowKeyboard(false)}
          enabled={isAuthenticated}
        />
      )}

      {/* Haptic feedback helper */}
      <div className="hidden">
        <button
          onClick={() => {
            if ("vibrate" in navigator) {
              navigator.vibrate(10);
            }
          }}
        />
      </div>
    </div>
  );
}
