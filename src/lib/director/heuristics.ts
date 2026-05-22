export interface Asset {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'TEXT';
  tags: string[];
  usageCount: number;
  lastUsedAt: number; // timestamp
  dimensions?: { width: number; height: number };
  fileSize: number;
}

export interface ScoringContext {
  targetTags: string[];
  preferredType?: 'IMAGE' | 'VIDEO' | 'TEXT';
  maxSize?: number;
}

export const HeuristicWeights = {
  TAG_MATCH: 10,
  TYPE_MATCH: 20,
  USAGE_PENALTY: -5, // Penalty for overused assets
  RECENCY_PENALTY: -10, // Penalty for recently used assets (variance)
  SIZE_PENALTY: -2, // Minor penalty for large files
};

export function scoreAsset(asset: Asset, context: ScoringContext): number {
  let score = 0;

  // 1. Tag Matching (High Impact)
  const matchedTags = asset.tags.filter((tag) => context.targetTags.includes(tag));
  score += matchedTags.length * HeuristicWeights.TAG_MATCH;

  // 2. Type Matching (Critical)
  if (context.preferredType && asset.type === context.preferredType) {
    score += HeuristicWeights.TYPE_MATCH;
  }

  // 3. Usage Frequency (Variance Control)
  // Fewer uses = Higher score
  score += Math.max(0, 10 - asset.usageCount) * 2;
  if (asset.usageCount > 5) {
    score += (asset.usageCount - 5) * HeuristicWeights.USAGE_PENALTY;
  }

  // 4. Recency (Don't repeat yourself too soon)
  const hoursSinceLastUse = (Date.now() - asset.lastUsedAt) / (1000 * 60 * 60);
  if (hoursSinceLastUse < 24) {
    score += HeuristicWeights.RECENCY_PENALTY;
  }

  // 5. Size Constraints
  if (context.maxSize && asset.fileSize > context.maxSize) {
    score += HeuristicWeights.SIZE_PENALTY * ((asset.fileSize - context.maxSize) / 1024 / 1024); // Penalty per MB over limit
  }

  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}
