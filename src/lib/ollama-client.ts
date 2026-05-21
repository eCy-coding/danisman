/**
 * eCyPro — Ollama REST Client (TypeScript, zero dependencies)
 * Desteklenen API'lar: generate, chat, generateStream, chatStream, listModels, showModel
 */

// ─── Types ────────────────────────────────────────────────

export interface OllamaOptions {
  baseUrl?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  seed?: number;
  numCtx?: number;
  stop?: string[];
  timeout?: number;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaChatMessage;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaListResponse {
  models: OllamaModel[];
}

export interface OllamaStreamChunk {
  response?: string; // for /api/generate
  message?: { role: string; content: string }; // for /api/chat
  done: boolean;
}

// ─── Client ──────────────────────────────────────────────

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly defaultOptions: Record<string, unknown>;
  private readonly timeout: number;

  constructor(opts: OllamaOptions = {}) {
    this.baseUrl = (
      opts.baseUrl ??
      import.meta.env.VITE_OLLAMA_BASE_URL ??
      'http://localhost:11434'
    ).replace(/\/$/, '');
    this.timeout = opts.timeout ?? 60_000;
    this.defaultOptions = {
      ...(opts.temperature !== undefined && { temperature: opts.temperature }),
      ...(opts.topK !== undefined && { top_k: opts.topK }),
      ...(opts.topP !== undefined && { top_p: opts.topP }),
      ...(opts.seed !== undefined && { seed: opts.seed }),
      ...(opts.numCtx !== undefined && { num_ctx: opts.numCtx }),
      ...(opts.stop !== undefined && { stop: opts.stop }),
    };
  }

  // ── Internal helpers ──────────────────────────────────

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    abort?: AbortSignal,
  ): Promise<Response> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), this.timeout);
    try {
      const signal = abort ? AbortSignal.any([controller.signal, abort]) : controller.signal;
      const res = await fetch(url, { ...init, signal });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new OllamaError(`HTTP ${res.status}: ${body}`, res.status);
      }
      return res;
    } finally {
      clearTimeout(tid);
    }
  }

  // ── One-shot generation ───────────────────────────────

  async generate(
    model: string,
    prompt: string,
    opts?: { system?: string; options?: Record<string, unknown>; signal?: AbortSignal },
  ): Promise<string> {
    const body: OllamaGenerateRequest = {
      model,
      prompt,
      stream: false,
      system: opts?.system,
      options: { ...this.defaultOptions, ...opts?.options },
    };
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts?.signal,
    );
    const data = (await res.json()) as OllamaGenerateResponse;
    return data.response;
  }

  // ── Multi-turn chat ──────────────────────────────────

  async chat(
    model: string,
    messages: OllamaChatMessage[],
    opts?: { options?: Record<string, unknown>; signal?: AbortSignal },
  ): Promise<string> {
    const body: OllamaChatRequest = {
      model,
      messages,
      stream: false,
      options: { ...this.defaultOptions, ...opts?.options },
    };
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts?.signal,
    );
    const data = (await res.json()) as OllamaChatResponse;
    return data.message.content;
  }

  // ── Streaming generation ──────────────────────────────

  async *generateStream(
    model: string,
    prompt: string,
    opts?: { system?: string; options?: Record<string, unknown>; signal?: AbortSignal },
  ): AsyncGenerator<string> {
    const body: OllamaGenerateRequest = {
      model,
      prompt,
      stream: true,
      system: opts?.system,
      options: { ...this.defaultOptions, ...opts?.options },
    };
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts?.signal,
    );
    yield* this.streamLines(res, 'response');
  }

  // ── Streaming chat ────────────────────────────────────

  async *chatStream(
    model: string,
    messages: OllamaChatMessage[],
    opts?: { options?: Record<string, unknown>; signal?: AbortSignal },
  ): AsyncGenerator<string> {
    const body: OllamaChatRequest = {
      model,
      messages,
      stream: true,
      options: { ...this.defaultOptions, ...opts?.options },
    };
    const res = await this.fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      opts?.signal,
    );
    yield* this.streamLines(res, 'content');
  }

  // ── List models ───────────────────────────────────────

  async listModels(): Promise<OllamaModel[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, { method: 'GET' });
    const data = (await res.json()) as OllamaListResponse;
    return data.models;
  }

  // ── Show model details ────────────────────────────────

  async showModel(name: string): Promise<Record<string, unknown>> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json() as Promise<Record<string, unknown>>;
  }

  // ── Health check ─────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Internal: NDJSON line reader ──────────────────────

  private async *streamLines(res: Response, key: 'response' | 'content'): AsyncGenerator<string> {
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line) as OllamaStreamChunk;
            if (key === 'response' && chunk.response) {
              yield chunk.response;
            } else if (key === 'content' && chunk.message?.content) {
              yield chunk.message.content;
            }
            if (chunk.done) return;
          } catch {
            // Malformed JSON line — skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// ─── Custom Error ─────────────────────────────────────────

export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

// ─── Singleton ───────────────────────────────────────────

export const ollamaClient = new OllamaClient({
  baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://localhost:11434',
  temperature: Number(import.meta.env.VITE_OLLAMA_TEMPERATURE ?? 0.2),
});
