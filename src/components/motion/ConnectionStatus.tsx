"use client";

import { ConnectionState } from "@/types/motion";

interface ConnectionStatusProps {
  state: ConnectionState;
  latency: number | null;
  deviceName?: string;
}

export function ConnectionStatus({
  state,
  latency,
  deviceName,
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (state) {
      case ConnectionState.Connected:
      case ConnectionState.Authenticated:
        return "text-green-500";
      case ConnectionState.Connecting:
      case ConnectionState.Authenticating:
        return "text-yellow-500";
      case ConnectionState.Error:
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (state) {
      case ConnectionState.Connected:
      case ConnectionState.Authenticated:
        return "🟢";
      case ConnectionState.Connecting:
      case ConnectionState.Authenticating:
        return "🟡";
      case ConnectionState.Error:
        return "🔴";
      default:
        return "⚫";
    }
  };

  const getStatusText = () => {
    switch (state) {
      case ConnectionState.Disconnected:
        return "Disconnected";
      case ConnectionState.Connecting:
        return "Connecting...";
      case ConnectionState.Connected:
        return "Connected";
      case ConnectionState.Authenticating:
        return "Authenticating...";
      case ConnectionState.Authenticated:
        return deviceName ? `Connected to ${deviceName}` : "Authenticated";
      case ConnectionState.Error:
        return "Connection Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-xl">{getStatusIcon()}</span>
        <div className="flex-1">
          <p className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          {latency !== null && state === ConnectionState.Authenticated && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Latency: {latency}ms
            </p>
          )}
        </div>
      </div>

      {/* Visual indicator */}
      {(state === ConnectionState.Connecting ||
        state === ConnectionState.Authenticating) && (
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <div
            className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      )}
    </div>
  );
}
