import { useState, useCallback, useRef } from 'react';
import {
  OllamaClient,
  type OllamaChatMessage,
  type OllamaOptions,
  OllamaError,
} from '../lib/ollama-client';

interface UseOllamaOptions extends OllamaOptions {
  model?: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (full: string) => void;
  onError?: (err: Error) => void;
}

interface UseOllamaReturn {
  generate: (prompt: string, system?: string) => Promise<string>;
  chat: (messages: OllamaChatMessage[]) => Promise<string>;
  generateStream: (prompt: string, system?: string) => Promise<void>;
  chatStream: (messages: OllamaChatMessage[]) => Promise<void>;
  abort: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  streamText: string;
  error: string | null;
  clearError: () => void;
  clearStream: () => void;
}

export function useOllama(opts: UseOllamaOptions = {}): UseOllamaReturn {
  const {
    model = (import.meta.env.VITE_OLLAMA_DEFAULT_MODEL as string | undefined) ??
      'qwen2.5-coder:14b',
    onChunk,
    onComplete,
    onError,
    ...clientOpts
  } = opts;

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const clientRef = useRef(new OllamaClient(clientOpts));

  // Abort ongoing request
  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearStream = useCallback(() => setStreamText(''), []);

  const handleError = useCallback(
    (err: unknown) => {
      const msg =
        err instanceof OllamaError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Ollama bağlantı hatası';
      setError(msg);
      onError?.(new Error(msg));
    },
    [onError],
  );

  // ── One-shot generate ─────────────────────────────────

  const generate = useCallback(
    async (prompt: string, system?: string): Promise<string> => {
      setIsLoading(true);
      setError(null);
      abortRef.current = new AbortController();
      try {
        const result = await clientRef.current.generate(model, prompt, {
          system,
          signal: abortRef.current.signal,
        });
        onComplete?.(result);
        return result;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleError(err);
        return '';
      } finally {
        setIsLoading(false);
      }
    },
    [model, onComplete, handleError],
  );

  // ── One-shot chat ─────────────────────────────────────

  const chat = useCallback(
    async (messages: OllamaChatMessage[]): Promise<string> => {
      setIsLoading(true);
      setError(null);
      abortRef.current = new AbortController();
      try {
        const result = await clientRef.current.chat(model, messages, {
          signal: abortRef.current.signal,
        });
        onComplete?.(result);
        return result;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleError(err);
        return '';
      } finally {
        setIsLoading(false);
      }
    },
    [model, onComplete, handleError],
  );

  // ── Streaming generate ────────────────────────────────

  const generateStream = useCallback(
    async (prompt: string, system?: string): Promise<void> => {
      setIsStreaming(true);
      setStreamText('');
      setError(null);
      abortRef.current = new AbortController();
      let accumulated = '';
      try {
        const gen = clientRef.current.generateStream(model, prompt, {
          system,
          signal: abortRef.current.signal,
        });
        for await (const chunk of gen) {
          accumulated += chunk;
          setStreamText(accumulated);
          onChunk?.(chunk);
        }
        onComplete?.(accumulated);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleError(err);
      } finally {
        setIsStreaming(false);
      }
    },
    [model, onChunk, onComplete, handleError],
  );

  // ── Streaming chat ────────────────────────────────────

  const chatStream = useCallback(
    async (messages: OllamaChatMessage[]): Promise<void> => {
      setIsStreaming(true);
      setStreamText('');
      setError(null);
      abortRef.current = new AbortController();
      let accumulated = '';
      try {
        const gen = clientRef.current.chatStream(model, messages, {
          signal: abortRef.current.signal,
        });
        for await (const chunk of gen) {
          accumulated += chunk;
          setStreamText(accumulated);
          onChunk?.(chunk);
        }
        onComplete?.(accumulated);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleError(err);
      } finally {
        setIsStreaming(false);
      }
    },
    [model, onChunk, onComplete, handleError],
  );

  return {
    generate,
    chat,
    generateStream,
    chatStream,
    abort,
    isLoading,
    isStreaming,
    streamText,
    error,
    clearError,
    clearStream,
  };
}
