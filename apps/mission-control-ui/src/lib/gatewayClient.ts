/**
 * Minimal OpenClaw Gateway protocol client for the browser.
 * Connects to Mission Control's WS proxy (/gateway/ws), sends connect, then RPC + events.
 * (OpenClaw Studio parity - Phase 2)
 */

export type GatewayConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface GatewayFrame {
  type: "req" | "res" | "event";
  id?: string;
  method?: string;
  ok?: boolean;
  payload?: unknown;
  error?: { code: string; message: string };
  event?: string;
  params?: unknown;
}

function randomId(): string {
  return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private eventListeners: Array<(frame: GatewayFrame) => void> = [];
  private _state: GatewayConnectionState = "disconnected";
  private onStateChange: (state: GatewayConnectionState) => void = () => {};

  constructor(private wsUrl: string) {}

  get state(): GatewayConnectionState {
    return this._state;
  }

  setStateChange(cb: (state: GatewayConnectionState) => void): void {
    this.onStateChange = cb;
  }

  private setState(s: GatewayConnectionState): void {
    if (this._state !== s) {
      this._state = s;
      this.onStateChange(s);
    }
  }

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    this.setState("connecting");
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.wsUrl);
        this.ws = ws;

        ws.onopen = () => {
          const id = randomId();
          ws.send(
            JSON.stringify({
              type: "req",
              id,
              method: "connect",
              params: {},
            })
          );
          const timeout = setTimeout(() => {
            if (this.pending.has(id)) {
              this.pending.delete(id);
              this.setState("error");
              reject(new Error("Connect timeout"));
            }
          }, 15000);
          const origResolve = resolve;
          const origReject = reject;
          this.pending.set(id, {
            resolve: (v: unknown) => {
              clearTimeout(timeout);
              const res = v as { ok?: boolean; error?: { code: string; message: string } };
              if (res?.ok !== true && res?.error) {
                this.setState("error");
                origReject(new Error(res.error.message || res.error.code));
              } else {
                this.setState("connected");
                origResolve();
              }
            },
            reject: (e) => {
              clearTimeout(timeout);
              this.setState("error");
              origReject(e);
            },
          });
        };

        ws.onmessage = (ev) => {
          try {
            const frame = JSON.parse(ev.data as string) as GatewayFrame;
            if (frame.type === "res" && frame.id && this.pending.has(frame.id)) {
              const { resolve: res } = this.pending.get(frame.id)!;
              this.pending.delete(frame.id);
              res(frame.ok ? frame.payload : { ok: false, error: frame.error });
            } else if (frame.type === "event") {
              this.eventListeners.forEach((cb) => cb(frame));
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = (ev) => {
          this.ws = null;
          this.setState(ev.wasClean ? "disconnected" : "error");
          this.pending.forEach(({ reject }) => reject(new Error("Connection closed")));
          this.pending.clear();
        };

        ws.onerror = () => {
          this.setState("error");
          reject(new Error("WebSocket error"));
        };
      } catch (e) {
        this.setState("error");
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState("disconnected");
  }

  request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Not connected"));
    }
    const id = randomId();
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      });
      this.ws!.send(
        JSON.stringify({
          type: "req",
          id,
          method,
          params: params ?? {},
        })
      );
    });
  }

  onEvent(callback: (frame: GatewayFrame) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      const i = this.eventListeners.indexOf(callback);
      if (i !== -1) this.eventListeners.splice(i, 1);
    };
  }
}

export { getGatewayWsUrl } from "./orchestrationUrl";

/** @deprecated Use getGatewayWsUrl() or getOrchestrationBaseUrl() from orchestrationUrl */
export const ORCHESTRATION_WS_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_ORCHESTRATION_URL) ||
  "http://localhost:4100";
