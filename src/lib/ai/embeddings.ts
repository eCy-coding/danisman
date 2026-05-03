// Phase 2: Zero-Dependency Refactor
// Decoupled from heavy @xenova/transformers library
// export class VectorEngine {
//   async init() { /* No-op in minimal mode */ }
//   async embed(text: string): Promise<number[]> {
//     // Return a placeholder vector (384 dimensions) for minimal mode compliance
//     // This preserves type compatibility without the heavy runtime cost
//     return Array(384).fill(0).map(() => Math.random() * 0.1); 
//   }
// }

export class VectorEngine {
  async init() { return; }
  
  async embed(_text: string): Promise<number[]> {
     return Array(384).fill(0).map(() => Math.random() * 0.1);
  }

  computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        const valA = vecA[i] || 0;
        const valB = vecB[i] || 0;
      dotProduct += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}



export const vectorEngine = new VectorEngine();
