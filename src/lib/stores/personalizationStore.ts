import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InterestProfile {
  scores: Record<string, number>; // e.g., 'strategy': 10, 'ai': 5
  history: string[]; // List of visited page IDs/Slugs
  totalVisits: number;
}

interface PersonalizationActions {
  trackVisit: (tags: string[], pageId: string) => void;
  getTopInterest: () => string | null;
  reset: () => void;
}

const SCORING_WEIGHTS = {
  VISIT: 1,
  // Future: TIME_SPENT: 0.1 per second
  // Future: CLICK_CTA: 5
};

export const usePersonalizationStore = create<InterestProfile & PersonalizationActions>()(
  persist(
    (set, get) => ({
      scores: {},
      history: [],
      totalVisits: 0,

      trackVisit: (tags, pageId) => {
        const { scores, history, totalVisits } = get();
        
        // Prevent duplicate scoring for same session reload? 
        // For simplicity (Zen), we just allow it but maybe limit history length.
        if (history.includes(pageId)) {
          // Maybe score less if already visited?
          // For now, simple standard scoring.
        }

        const newScores = { ...scores };
        tags.forEach(tag => {
            newScores[tag] = (newScores[tag] || 0) + SCORING_WEIGHTS.VISIT;
        });

        set({
          scores: newScores,
          history: [...history, pageId].slice(-50), // Keep last 50
          totalVisits: totalVisits + 1
        });
      },

      getTopInterest: () => {
        const { scores } = get();
        let topTag = null;
        let maxScore = -1;

        Object.entries(scores).forEach(([tag, score]) => {
          if (score > maxScore) {
            maxScore = score;
            topTag = tag;
          }
        });

        // Threshold? Maybe need at least score > 2
        return maxScore > 2 ? topTag : null;
      },

      reset: () => set({ scores: {}, history: [], totalVisits: 0 })
    }),
    {
      name: 'ecypro-brain', // unique name in localStorage
    }
  )
);
