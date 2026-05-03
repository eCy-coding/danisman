export const SECURITY_HEADERS = {
  // Prvents clickjacking
  "X-Frame-Options": "DENY",
  // Prevents MIME-sniffing
  "X-Content-Type-Options": "nosniff",
  // HSTS (Strict-Transport-Security) - 1 year
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Referrer Policy
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions Policy (formerly Feature Policy) - Lock down powerful features
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
};

export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"], // unsafe-eval needed for some dev tools / WASM
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "https://images.unsplash.com", "blob:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://huggingface.co", "https://cdn-lfs.huggingface.co", "wss://*", "http://localhost:*"],
  "worker-src": ["'self'", "blob:"],
  "frame-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
};

export function getCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}
