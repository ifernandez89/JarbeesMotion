/**
 * JarBees Motion Protocol - TypeScript Definitions
 * Protocol Version 1.0
 * 
 * Shared types between PWA and Windows Bridge
 */

export const PROTOCOL_VERSION = "1.0";
export const MAX_MESSAGE_SIZE = 8192;
export const MAX_TEXT_LENGTH = 1000;
export const MAX_MOUSE_DELTA = 500;
export const MAX_MESSAGES_PER_SECOND = 60;

export enum MessageType {
  // Mouse control
  MouseMove = "MouseMove",
  MouseButton = "MouseButton",
  MouseScroll = "MouseScroll",
  
  // Keyboard control
  KeyboardText = "KeyboardText",
  KeyboardKey = "KeyboardKey",
  
  // Session management
  SessionPair = "SessionPair",
  SessionStop = "SessionStop",
  SessionStatus = "SessionStatus",
  
  // Connection health
  Ping = "Ping",
  Pong = "Pong",
  
  // Responses
  Success = "Success",
  Error = "Error",
}

export enum MouseButtonType {
  Left = "Left",
  Right = "Right",
  Middle = "Middle",
}

export enum MouseButtonAction {
  Press = "Press",
  Release = "Release",
}

export enum KeyAction {
  Press = "Press",
  Release = "Release",
}

export interface MotionMessage<T = unknown> {
  version: string;
  type: MessageType;
  timestamp: number;
  payload?: T;
}

export interface MouseMovePayload {
  deltaX: number;
  deltaY: number;
}

export interface MouseButtonPayload {
  button: MouseButtonType;
  action: MouseButtonAction;
}

export interface MouseScrollPayload {
  deltaX: number;
  deltaY: number;
}

export interface KeyboardTextPayload {
  text: string;
}

export interface KeyboardKeyPayload {
  key: string;
  action: KeyAction;
  modifiers?: KeyModifiers;
}

export interface KeyModifiers {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  win: boolean;
}

export interface SessionPairPayload {
  pairingCode: string;
  deviceName?: string;
}

export interface SessionStatusPayload {
  connected: boolean;
  deviceName?: string;
  sessionStarted?: number;
  latencyMs?: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface SuccessPayload {
  sessionToken?: string;
  message?: string;
}

// Connection state
export enum ConnectionState {
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
  Authenticating = "authenticating",
  Authenticated = "authenticated",
  Error = "error",
}

// Client configuration
export interface MotionClientConfig {
  wsUrl: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  reconnectMaxDelay?: number;
  heartbeatInterval?: number;
  messageTimeout?: number;
}

// Client events
export interface MotionClientEvents {
  onStateChange: (state: ConnectionState) => void;
  onError: (error: Error) => void;
  onLatencyUpdate: (latencyMs: number) => void;
  onSessionStart: (deviceName: string) => void;
  onSessionEnd: () => void;
  onMessage?: (message: MotionMessage) => void;
}

// Validation helpers
export function validateMouseMove(payload: MouseMovePayload): boolean {
  return (
    Math.abs(payload.deltaX) <= MAX_MOUSE_DELTA &&
    Math.abs(payload.deltaY) <= MAX_MOUSE_DELTA
  );
}

export function validateKeyboardText(payload: KeyboardTextPayload): boolean {
  return (
    typeof payload.text === "string" &&
    payload.text.length > 0 &&
    payload.text.length <= MAX_TEXT_LENGTH
  );
}

export function clampMouseDelta(delta: number): number {
  return Math.max(-MAX_MOUSE_DELTA, Math.min(MAX_MOUSE_DELTA, delta));
}

// Message factory
export function createMessage<T>(
  type: MessageType,
  payload?: T
): MotionMessage<T> {
  return {
    version: PROTOCOL_VERSION,
    type,
    timestamp: Date.now(),
    payload,
  };
}

// Virtual key codes (subset for common keys)
export const VirtualKeys: Record<string, string> = {
  BACKSPACE: "BACKSPACE",
  TAB: "TAB",
  ENTER: "ENTER",
  SHIFT: "SHIFT",
  CTRL: "CTRL",
  ALT: "ALT",
  ESCAPE: "ESCAPE",
  SPACE: "SPACE",
  LEFT: "LEFT",
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  DELETE: "DELETE",
  WIN: "WIN",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};
