// Type stubs for runtime deps lacking installable @types/* packages.
// Production build unblock — npm refuses to install @types/jsonwebtoken
// and @types/ws despite being listed in devDependencies. Untyped any
// behavior is acceptable for these surfaces; refine post-launch.

declare module 'jsonwebtoken' {
  export type Algorithm = string;
  export type SignOptions = Record<string, unknown>;
  export type VerifyOptions = Record<string, unknown>;
  export type JwtPayload = Record<string, unknown>;
  export type Secret = string | Buffer;
  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: Secret,
    options?: SignOptions,
  ): string;
  export function verify(
    token: string,
    secretOrPublicKey: Secret,
    options?: VerifyOptions,
  ): JwtPayload | string;
  export function decode(
    token: string,
    options?: Record<string, unknown>,
  ): JwtPayload | string | null;
  export class TokenExpiredError extends Error {
    expiredAt: Date;
  }
  export class JsonWebTokenError extends Error {}
  export class NotBeforeError extends Error {
    date: Date;
  }
  const _default: { sign: typeof sign; verify: typeof verify; decode: typeof decode };
  export default _default;
}

declare module 'ws' {
  import { EventEmitter } from 'events';
  import { Server as HttpServer, IncomingMessage } from 'http';
  export class WebSocket extends EventEmitter {
    constructor(address: string, options?: Record<string, unknown>);
    on(event: string, listener: (...args: unknown[]) => void): this;
    send(data: unknown, callback?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    readyState: number;
    static OPEN: number;
    static CLOSED: number;
  }
  export class WebSocketServer extends EventEmitter {
    constructor(options: {
      server?: HttpServer;
      port?: number;
      path?: string;
      [k: string]: unknown;
    });
    on(event: 'connection', listener: (ws: WebSocket, request: IncomingMessage) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    close(callback?: () => void): void;
  }
  export default WebSocket;
}
