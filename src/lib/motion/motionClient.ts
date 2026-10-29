/**
 * JarBees Motion WebSocket Client
 * Handles secure connection to Windows Bridge
 */

import {
  ConnectionState,
  MessageType,
  type MotionMessage,
  type MotionClientConfig,
  type MotionClientEvents,
  type MouseMovePayload,
  type MouseButtonPayload,
  type MouseScrollPayload,
  type KeyboardTextPayload,
  type KeyboardKeyPayload,
  type SessionPairPayload,
  createMessage,
  validateMouseMove,
  validateKeyboardText,
  MAX_MESSAGES_PER_SECOND,
} from "@/types/motion";

export class MotionClient {
  private ws: WebSocket | null = null;
  private config: Required<MotionClientConfig>;
  private events: MotionClientEvents;
  private state: ConnectionState = ConnectionState.Disconnected;
  private sessionToken: string | null = null;
  
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: MotionMessage[] = [];
  private lastMessageTime = 0;
  private messageCount = 0;
  private messageCountResetTime = Date.now();
  
  private pingTime: number | null = null;
  private latencyMs: number | null = null;

  constructor(config: MotionClientConfig, events: MotionClientEvents) {
    this.config = {
      wsUrl: config.wsUrl,
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 10000,
      messageTimeout: config.messageTimeout ?? 5000,
    };
    this.events = events;
  }

  /**
   * Connect to the Windows Bridge
   */
  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn("Already connected");
      return;
    }

    this.setState(ConnectionState.Connecting);

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Disconnect from the Bridge
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      // Send session stop if authenticated
      if (this.state === ConnectionState.Authenticated) {
        this.sendMessage(createMessage(MessageType.SessionStop));
      }
      
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.sessionToken = null;
    this.setState(ConnectionState.Disconnected);
  }

  /**
   * Pair with Bridge using 6-digit code
   */
  public async pair(pairingCode: string, deviceName?: string): Promise<void> {
    if (this.state !== ConnectionState.Connected) {
      throw new Error("Not connected to Bridge");
    }

    this.setState(ConnectionState.Authenticating);

    const payload: SessionPairPayload = {
      pairingCode,
      deviceName: deviceName ?? this.getDeviceName(),
    };

    this.sendMessage(createMessage(MessageType.SessionPair, payload));

    // Wait for response
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Pairing timeout"));
      }, this.config.messageTimeout);

      const originalOnMessage = this.events.onMessage;
      this.events.onMessage = (message) => {
        if (message.type === MessageType.Success) {
          clearTimeout(timeout);
          this.events.onMessage = originalOnMessage;
          
          const payload = message.payload as { sessionToken?: string };
          if (payload.sessionToken) {
            this.sessionToken = payload.sessionToken;
            this.setState(ConnectionState.Authenticated);
            this.startHeartbeat();
            this.events.onSessionStart(deviceName ?? "Mobile Device");
            resolve();
          } else {
            reject(new Error("No session token received"));
          }
        } else if (message.type === MessageType.Error) {
          clearTimeout(timeout);
          this.events.onMessage = originalOnMessage;
          
          const payload = message.payload as { message?: string };
          reject(new Error(payload.message ?? "Pairing failed"));
        }
      };
    });
  }

  /**
   * Send mouse movement (relative)
   */
  public sendMouseMove(deltaX: number, deltaY: number): void {
    if (!this.canSendMessage()) return;

    const payload: MouseMovePayload = { deltaX, deltaY };
    
    if (!validateMouseMove(payload)) {
      console.warn("Invalid mouse move payload", payload);
      return;
    }

    this.sendMessage(createMessage(MessageType.MouseMove, payload));
  }

  /**
   * Send mouse button action
   */
  public sendMouseButton(payload: MouseButtonPayload): void {
    if (!this.canSendMessage()) return;
    this.sendMessage(createMessage(MessageType.MouseButton, payload));
  }

  /**
   * Send mouse scroll
   */
  public sendMouseScroll(deltaX: number, deltaY: number): void {
    if (!this.canSendMessage()) return;

    const payload: MouseScrollPayload = { deltaX, deltaY };
    this.sendMessage(createMessage(MessageType.MouseScroll, payload));
  }

  /**
   * Send keyboard text
   */
  public sendKeyboardText(text: string): void {
    if (!this.canSendMessage()) return;

    const payload: KeyboardTextPayload = { text };
    
    if (!validateKeyboardText(payload)) {
      console.warn("Invalid keyboard text payload", payload);
      return;
    }

    this.sendMessage(createMessage(MessageType.KeyboardText, payload));
  }

  /**
   * Send keyboard key action
   */
  public sendKeyboardKey(payload: KeyboardKeyPayload): void {
    if (!this.canSendMessage()) return;
    this.sendMessage(createMessage(MessageType.KeyboardKey, payload));
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get current latency in milliseconds
   */
  public getLatency(): number | null {
    return this.latencyMs;
  }

  /**
   * Check if client is authenticated and ready
   */
  public isReady(): boolean {
    return this.state === ConnectionState.Authenticated;
  }

  // Private methods

  private handleOpen(): void {
    console.log("WebSocket connected");
    this.reconnectAttempts = 0;
    this.setState(ConnectionState.Connected);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: MotionMessage = JSON.parse(event.data);

      // Handle pong for latency measurement
      if (message.type === MessageType.Pong && this.pingTime) {
        this.latencyMs = Date.now() - this.pingTime;
        this.pingTime = null;
        this.events.onLatencyUpdate(this.latencyMs);
      }

      // Handle errors
      if (message.type === MessageType.Error) {
        const payload = message.payload as { message?: string };
        this.events.onError(new Error(payload.message ?? "Unknown error"));
      }

      // Pass to custom handler
      if (this.events.onMessage) {
        this.events.onMessage(message);
      }
    } catch (error) {
      console.error("Failed to parse message", error);
    }
  }

  private handleError(error: Event | Error): void {
    console.error("WebSocket error", error);
    
    const err = error instanceof Error 
      ? error 
      : new Error("WebSocket connection error");
    
    this.events.onError(err);
    this.setState(ConnectionState.Error);
  }

  private handleClose(event: CloseEvent): void {
    console.log("WebSocket closed", event.code, event.reason);
    
    this.clearTimers();
    this.ws = null;

    if (this.state === ConnectionState.Authenticated) {
      this.events.onSessionEnd();
    }

    this.sessionToken = null;
    this.setState(ConnectionState.Disconnected);

    // Attempt reconnection if enabled
    if (this.config.reconnect && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.events.onStateChange(newState);
    }
  }

  private sendMessage(message: MotionMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message: not connected");
      return;
    }

    // Rate limiting
    if (!this.checkRateLimit()) {
      console.warn("Rate limit exceeded, dropping message");
      return;
    }

    try {
      const json = JSON.stringify(message);
      this.ws.send(json);
      this.lastMessageTime = Date.now();
    } catch (error) {
      console.error("Failed to send message", error);
    }
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every second
    if (now - this.messageCountResetTime >= 1000) {
      this.messageCount = 0;
      this.messageCountResetTime = now;
    }

    this.messageCount++;
    return this.messageCount <= MAX_MESSAGES_PER_SECOND;
  }

  private canSendMessage(): boolean {
    return this.state === ConnectionState.Authenticated && this.sessionToken !== null;
  }

  private startHeartbeat(): void {
    this.clearTimers();

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingTime = Date.now();
        this.sendMessage(createMessage(MessageType.Ping));
      }
    }, this.config.heartbeatInterval);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelay
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private clearTimers(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private getDeviceName(): string {
    // Try to get device info from user agent
    const ua = navigator.userAgent;
    
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android [0-9.]+/);
      return match ? match[0] : "Android Device";
    }
    
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return /iPad/i.test(ua) ? "iPad" : "iPhone";
    }

    return "Mobile Device";
  }
}
