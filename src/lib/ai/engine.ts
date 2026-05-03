import { Logger } from "../logger";

// Standard Minimal Mode Response
const MOCK_RESPONSE = "AI capabilities are currently optimized for minimal dependency mode.";

export interface AIResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

class AIEngine {
  private isReady = false;

  async init(onProgress?: (status: { text: string }) => void): Promise<void> {
    Logger.info('[The Muse] Initializing Neural Engine (Minimal Mode)...');
    // Simulate lightweight initialization
    this.isReady = true;
    if (onProgress) {
        onProgress({ text: "Engine Ready (Minimal)" });
    }
    Logger.success('[The Muse] Engine Ready.');
  }

  async generate(_prompt: string, _systemPrompt?: string): Promise<AIResponse> {
    if (!this.isReady) {
      throw new Error("AI Engine not initialized. Call init() first.");
    }

    return {
      text: MOCK_RESPONSE,
      usage: {
        prompt_tokens: 10,
        completion_tokens: 10
      }
    };
  }
  
  // Streaming support for real-time UI
  async *stream(_prompt: string, _systemPrompt?: string) {
    if (!this.isReady) {
       throw new Error("AI Engine not initialized.");
    }
    
    const words = MOCK_RESPONSE.split(" ");
    for (const word of words) {
        yield word + " ";
        await new Promise(r => setTimeout(r, 20)); 
    }
  }

  isEngineReady() {
    return this.isReady;
  }
}

export const aiEngine = new AIEngine();
