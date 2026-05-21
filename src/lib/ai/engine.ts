import { Logger } from '../logger';
import { OllamaClient, OllamaError, type OllamaChatMessage } from '../ollama-client';

export interface AIResponse {
  text: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export type AIEngineMode = 'ollama' | 'mock';

class AIEngine {
  private isReady = false;
  private mode: AIEngineMode = 'mock';
  private ollama: OllamaClient | null = null;
  private defaultModel: string;

  constructor() {
    this.defaultModel =
      (import.meta.env.VITE_OLLAMA_DEFAULT_MODEL as string | undefined) ?? 'qwen2.5-coder:14b';
  }

  async init(onProgress?: (status: { text: string }) => void): Promise<void> {
    Logger.info('[The Muse] Initializing Neural Engine...');
    onProgress?.({ text: 'Connecting to Ollama...' });

    const client = new OllamaClient();
    const healthy = await client.isHealthy();

    if (healthy) {
      this.ollama = client;
      this.mode = 'ollama';
      this.isReady = true;
      onProgress?.({ text: `Engine Ready (Ollama — ${this.defaultModel})` });
      Logger.success(`[The Muse] Ollama engine ready. Model: ${this.defaultModel}`);
    } else {
      this.mode = 'mock';
      this.isReady = true;
      onProgress?.({ text: 'Engine Ready (Mock — Ollama offline)' });
      Logger.info('[The Muse] Ollama unavailable → Mock mode active.');
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.isReady) throw new Error('AI Engine not initialized. Call init() first.');

    if (this.mode === 'ollama' && this.ollama) {
      try {
        const text = await this.ollama.generate(this.defaultModel, prompt, {
          system: systemPrompt,
        });
        return { text, model: this.defaultModel };
      } catch (err) {
        if (err instanceof OllamaError) {
          Logger.info(`[The Muse] Ollama error: ${err.message} → fallback mock`);
        }
        return { text: this.mockResponse(prompt), model: 'mock' };
      }
    }
    return { text: this.mockResponse(prompt), model: 'mock' };
  }

  async chat(messages: OllamaChatMessage[]): Promise<AIResponse> {
    if (!this.isReady) throw new Error('AI Engine not initialized.');
    if (this.mode === 'ollama' && this.ollama) {
      try {
        const text = await this.ollama.chat(this.defaultModel, messages);
        return { text, model: this.defaultModel };
      } catch (err) {
        if (err instanceof OllamaError) Logger.info(`[The Muse] Chat error: ${err.message}`);
        return { text: this.mockResponse(messages.at(-1)?.content ?? ''), model: 'mock' };
      }
    }
    return { text: this.mockResponse(messages.at(-1)?.content ?? ''), model: 'mock' };
  }

  async *stream(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
    if (!this.isReady) throw new Error('AI Engine not initialized.');

    if (this.mode === 'ollama' && this.ollama) {
      try {
        yield* this.ollama.generateStream(this.defaultModel, prompt, { system: systemPrompt });
        return;
      } catch (err) {
        if (err instanceof OllamaError) Logger.info(`[The Muse] Stream error: ${err.message}`);
      }
    }
    // Mock fallback: word-by-word
    const words = this.mockResponse(prompt).split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise((r) => setTimeout(r, 30));
    }
  }

  async *chatStream(messages: OllamaChatMessage[]): AsyncGenerator<string> {
    if (!this.isReady) throw new Error('AI Engine not initialized.');
    if (this.mode === 'ollama' && this.ollama) {
      try {
        yield* this.ollama.chatStream(this.defaultModel, messages);
        return;
      } catch (err) {
        if (err instanceof OllamaError) Logger.info(`[The Muse] ChatStream error: ${err.message}`);
      }
    }
    const words = this.mockResponse(messages.at(-1)?.content ?? '').split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise((r) => setTimeout(r, 30));
    }
  }

  setModel(model: string): void {
    this.defaultModel = model;
  }

  getMode(): AIEngineMode {
    return this.mode;
  }
  getModel(): string {
    return this.defaultModel;
  }
  isEngineReady(): boolean {
    return this.isReady;
  }

  private mockResponse(prompt: string): string {
    return `[eCyPro AI — Mock Mode] Received: "${prompt.slice(0, 60)}...". Connect Ollama for live inference.`;
  }
}

export const aiEngine = new AIEngine();
