/**
 * EcyPro — AI (Ollama) Backend Proxy Router
 * Rate-limited, Zod-validated, SSE-streaming proxy to local Ollama.
 */

import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { createRateLimiter } from '../middleware/rateLimiter';
import { logger } from '../config/logger';

const router = Router();

// ─── Config ───────────────────────────────────────────────

const OLLAMA_BASE = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL ?? 'qwen2.5-coder:14b';
const DEFAULT_TEMP  = parseFloat(process.env.OLLAMA_TEMPERATURE ?? '0.2');
const REQUEST_TIMEOUT_MS = 120_000;

// ─── Rate Limiters ────────────────────────────────────────

const aiCompletionLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
  message: 'AI istek limiti aşıldı. 1 dakika sonra tekrar deneyin.',
});

const aiStreamLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 5,
  message: 'AI stream limiti aşıldı. 1 dakika sonra tekrar deneyin.',
});

// ─── Zod Schemas ─────────────────────────────────────────

const GenerateSchema = z.object({
  model:  z.string().min(1).max(100).optional().default(DEFAULT_MODEL),
  prompt: z.string().min(1).max(32_000),
  system: z.string().max(4_000).optional(),
  temperature: z.number().min(0).max(2).optional().default(DEFAULT_TEMP),
  stream: z.boolean().optional().default(false),
});

const ChatMessageSchema = z.object({
  role:    z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(32_000),
});

const ChatSchema = z.object({
  model:    z.string().min(1).max(100).optional().default(DEFAULT_MODEL),
  messages: z.array(ChatMessageSchema).min(1).max(50),
  temperature: z.number().min(0).max(2).optional().default(DEFAULT_TEMP),
  stream:   z.boolean().optional().default(false),
});

// ─── Health: Ollama availability ─────────────────────────

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!resp.ok) {
      res.status(503).json({ status: 'ollama_unreachable' });
      return;
    }
    const data = await resp.json() as { models?: unknown[] };
    res.json({
      status: 'ok',
      ollamaUrl: OLLAMA_BASE,
      modelCount: data.models?.length ?? 0,
    });
  } catch {
    res.status(503).json({ status: 'ollama_unreachable', url: OLLAMA_BASE });
  }
});

// ─── List available models ────────────────────────────────

router.get('/models', aiCompletionLimit, async (_req: Request, res: Response): Promise<void> => {
  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      res.status(502).json({ error: 'Ollama unavailable' });
      return;
    }
    const data = await resp.json() as { models?: unknown[] };
    res.json({ models: data.models ?? [] });
  } catch (err) {
    logger.error('[ai/models] error', { message: (err as Error).message });
    res.status(503).json({ error: 'Could not reach Ollama' });
  }
});

// ─── One-shot generate ────────────────────────────────────

router.post('/complete', aiCompletionLimit, async (req: Request, res: Response): Promise<void> => {
  let parsed: z.infer<typeof GenerateSchema>;
  try {
    parsed = GenerateSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Geçersiz istek', details: err.issues });
    } else {
      res.status(400).json({ error: 'Geçersiz istek' });
    }
    return;
  }

  const ollamaBody = {
    model:   parsed.model,
    prompt:  parsed.prompt,
    system:  parsed.system,
    stream:  false,
    options: { temperature: parsed.temperature },
  };

  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ollamaBody),
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      res.status(502).json({ error: 'Ollama hatası', detail: text });
      return;
    }

    const data = await resp.json() as { response: string; eval_count?: number; total_duration?: number };
    res.json({
      text:          data.response,
      model:         parsed.model,
      eval_count:    data.eval_count,
      total_duration: data.total_duration,
    });
  } catch (err) {
    logger.error('[ai/complete] error', { message: (err as Error).message });
    if ((err as Error).name === 'TimeoutError') {
      res.status(504).json({ error: 'Ollama zaman aşımı' });
    } else {
      res.status(503).json({ error: 'Ollama bağlantı hatası' });
    }
  }
});

// ─── Multi-turn chat ──────────────────────────────────────

router.post('/chat', aiCompletionLimit, async (req: Request, res: Response): Promise<void> => {
  let parsed: z.infer<typeof ChatSchema>;
  try {
    parsed = ChatSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Geçersiz istek', details: err.issues });
    } else {
      res.status(400).json({ error: 'Geçersiz istek' });
    }
    return;
  }

  const ollamaBody = {
    model:    parsed.model,
    messages: parsed.messages,
    stream:   false,
    options:  { temperature: parsed.temperature },
  };

  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ollamaBody),
      signal:  AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      res.status(502).json({ error: 'Ollama hatası', detail: text });
      return;
    }

    const data = await resp.json() as { message: { role: string; content: string }; eval_count?: number };
    res.json({
      message:   data.message,
      model:     parsed.model,
      eval_count: data.eval_count,
    });
  } catch (err) {
    logger.error('[ai/chat] error', { message: (err as Error).message });
    res.status(503).json({ error: 'Ollama bağlantı hatası' });
  }
});

// ─── SSE Streaming generate ───────────────────────────────

router.post('/stream', aiStreamLimit, async (req: Request, res: Response): Promise<void> => {
  let parsed: z.infer<typeof GenerateSchema>;
  try {
    parsed = GenerateSchema.parse({ ...req.body, stream: true });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Geçersiz istek', details: err.issues });
    } else {
      res.status(400).json({ error: 'Geçersiz istek' });
    }
    return;
  }

  res.setHeader('Content-Type',  'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const ollamaBody = {
    model:   parsed.model,
    prompt:  parsed.prompt,
    system:  parsed.system,
    stream:  true,
    options: { temperature: parsed.temperature },
  };

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ollamaBody),
      signal:  AbortSignal.any([controller.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });

    if (!resp.ok || !resp.body) {
      sendEvent('error', { message: 'Ollama unavailable' });
      res.end();
      return;
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as { response?: string; done?: boolean };
          if (chunk.response) {
            sendEvent('chunk', { text: chunk.response });
          }
          if (chunk.done) {
            sendEvent('done', { model: parsed.model });
            res.end();
            return;
          }
        } catch {
          // Malformed NDJSON — skip
        }
      }
    }
    sendEvent('done', { model: parsed.model });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      logger.error('[ai/stream] error', { message: (err as Error).message });
      sendEvent('error', { message: 'Stream hatası' });
    }
  } finally {
    res.end();
  }
});

// ─── SSE Streaming chat ───────────────────────────────────

router.post('/stream/chat', aiStreamLimit, async (req: Request, res: Response): Promise<void> => {
  let parsed: z.infer<typeof ChatSchema>;
  try {
    parsed = ChatSchema.parse({ ...req.body, stream: true });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Geçersiz istek', details: err.issues });
    } else {
      res.status(400).json({ error: 'Geçersiz istek' });
    }
    return;
  }

  res.setHeader('Content-Type',  'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const ollamaBody = {
    model:    parsed.model,
    messages: parsed.messages,
    stream:   true,
    options:  { temperature: parsed.temperature },
  };

  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ollamaBody),
      signal:  AbortSignal.any([controller.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });

    if (!resp.ok || !resp.body) {
      sendEvent('error', { message: 'Ollama unavailable' });
      res.end();
      return;
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as { message?: { content: string }; done?: boolean };
          if (chunk.message?.content) {
            sendEvent('chunk', { text: chunk.message.content });
          }
          if (chunk.done) {
            sendEvent('done', { model: parsed.model });
            res.end();
            return;
          }
        } catch {
          // Malformed NDJSON — skip
        }
      }
    }
    sendEvent('done', { model: parsed.model });
  } catch (err) {
    if ((err as Error).name !== 'AbortError') {
      logger.error('[ai/stream/chat] error', { message: (err as Error).message });
      sendEvent('error', { message: 'Stream hatası' });
    }
  } finally {
    res.end();
  }
});

export default router;
