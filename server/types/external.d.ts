// Type stubs for runtime deps lacking installable @types/* packages.
// Production build unblock — npm refuses to install @types/jsonwebtoken
// and @types/ws despite being listed in devDependencies. Untyped any
// behavior is acceptable for these surfaces; refine post-launch.

// export = jwt + namespace pattern: allows `import jwt from 'jsonwebtoken'` (esModuleInterop)
// AND `jwt.SignOptions` as a type reference (namespace merge).
declare module 'jsonwebtoken' {
  namespace jwt {
    type Algorithm = string;
    type SignOptions = Record<string, unknown>;
    type VerifyOptions = Record<string, unknown>;
    type JwtPayload = Record<string, unknown>;
    type Secret = string | Buffer;
    function sign(
      payload: string | object | Buffer,
      secretOrPrivateKey: Secret,
      options?: SignOptions,
    ): string;
    function verify(
      token: string,
      secretOrPublicKey: Secret,
      options?: VerifyOptions,
    ): JwtPayload | string;
    function decode(token: string, options?: Record<string, unknown>): JwtPayload | string | null;
    class TokenExpiredError extends Error {
      expiredAt: Date;
    }
    class JsonWebTokenError extends Error {}
    class NotBeforeError extends Error {
      date: Date;
    }
  }
  export = jwt;
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
