/**
 * React Hook for JarBees Motion Client
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { MotionClient } from "./motionClient";
import {
  ConnectionState,
  type MouseButtonPayload,
  type KeyboardKeyPayload,
  type MotionClientConfig,
} from "@/types/motion";

export interface UseMotionClientOptions {
  bridgeUrl: string;
  autoConnect?: boolean;
  onError?: (error: Error) => void;
}

export interface UseMotionClientReturn {
  // State
  state: ConnectionState;
  isConnected: boolean;
  isAuthenticated: boolean;
  latency: number | null;
  error: Error | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  pair: (code: string, deviceName?: string) => Promise<void>;

  // Input methods
  sendMouseMove: (deltaX: number, deltaY: number) => void;
  sendMouseButton: (payload: MouseButtonPayload) => void;
  sendMouseScroll: (deltaX: number, deltaY: number) => void;
  sendKeyboardText: (text: string) => void;
  sendKeyboardKey: (payload: KeyboardKeyPayload) => void;

  // Client instance (for advanced usage)
  client: MotionClient | null;
}

export function useMotionClient(
  options: UseMotionClientOptions
): UseMotionClientReturn {
  const [state, setState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const clientRef = useRef<MotionClient | null>(null);

  // Initialize client
  useEffect(() => {
    const config: MotionClientConfig = {
      wsUrl: options.bridgeUrl,
      reconnect: true,
      reconnectDelay: 1000,
      reconnectMaxDelay: 30000,
      heartbeatInterval: 10000,
    };

    const events = {
      onStateChange: (newState: ConnectionState) => {
        setState(newState);
        if (newState === ConnectionState.Connected) {
          setError(null);
        }
      },
      onError: (err: Error) => {
        setError(err);
        options.onError?.(err);
      },
      onLatencyUpdate: (ms: number) => {
        setLatency(ms);
      },
      onSessionStart: (deviceName: string) => {
        console.log("Session started:", deviceName);
      },
      onSessionEnd: () => {
        console.log("Session ended");
      },
    };

    clientRef.current = new MotionClient(config, events);

    // Auto-connect if enabled
    if (options.autoConnect) {
      clientRef.current.connect();
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [options.bridgeUrl, options.autoConnect, options.onError]);

  // Connection methods
  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  const pair = useCallback(
    async (code: string, deviceName?: string) => {
      if (!clientRef.current) {
        throw new Error("Client not initialized");
      }
      await clientRef.current.pair(code, deviceName);
    },
    []
  );

  // Input methods
  const sendMouseMove = useCallback((deltaX: number, deltaY: number) => {
    clientRef.current?.sendMouseMove(deltaX, deltaY);
  }, []);

  const sendMouseButton = useCallback((payload: MouseButtonPayload) => {
    clientRef.current?.sendMouseButton(payload);
  }, []);

  const sendMouseScroll = useCallback((deltaX: number, deltaY: number) => {
    clientRef.current?.sendMouseScroll(deltaX, deltaY);
  }, []);

  const sendKeyboardText = useCallback((text: string) => {
    clientRef.current?.sendKeyboardText(text);
  }, []);

  const sendKeyboardKey = useCallback((payload: KeyboardKeyPayload) => {
    clientRef.current?.sendKeyboardKey(payload);
  }, []);

  // Derived state
  const isConnected = state === ConnectionState.Connected || state === ConnectionState.Authenticated;
  const isAuthenticated = state === ConnectionState.Authenticated;

  return {
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
    client: clientRef.current,
  };
}
