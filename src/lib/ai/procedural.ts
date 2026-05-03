// The Artisan - Zero Dependency Procedural Generation

type MarkovChain = Record<string, string[]>;

export class MarkovGenerator {
  private chain: MarkovChain = {};
  private startWords: string[] = [];

  constructor(corpus?: string[]) {
    if (corpus) {
      this.train(corpus);
    }
  }

  train(corpus: string[]) {
    corpus.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      if (words.length === 0) return;

      if (words.length > 0 && words[0]) {
           this.startWords.push(words[0]);
      }
  
      for (let i = 0; i < words.length - 1; i++) {
        const word = words[i];
        const nextWord = words[i + 1];
        
        if (!word || !nextWord) continue;

        if (!this.chain[word]) {
          this.chain[word] = [];
        }
        this.chain[word].push(nextWord);
      }
    });
  }

  generate(minLength: number = 5, maxLength: number = 15): string {
    if (this.startWords.length === 0) return "";

    let currentWord = this.startWords[Math.floor(Math.random() * this.startWords.length)];
    const result = [currentWord];

    while (result.length < maxLength) {
      if (!currentWord) break;
      const nextOptions = this.chain[currentWord] || [];
      if (nextOptions.length === 0) break;
  
      const nextWord = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      result.push(nextWord);
      currentWord = nextWord; // Update current word

      if (result.length >= minLength && currentWord && currentWord.endsWith('.')) break;
    }

    return result.join(' ');
  }
}

// Simple seeded random for consistent synthetic data
export class SyntheticData {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  private random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  generateTimeSeries(points: number, min: number, max: number): { time: string, value: number }[] {
    const data = [];
    let currentValue = (min + max) / 2;
    const now = new Date();

    for (let i = 0; i < points; i++) {
      const change = (this.random() - 0.5) * ((max - min) * 0.1);
      currentValue += change;
      currentValue = Math.max(min, Math.min(max, currentValue));
      
      const date = new Date(now.getTime() - (points - i) * 24 * 60 * 60 * 1000);
      data.push({
        time: ((date || new Date()).toISOString().split('T')[0]) as string,
        value: Math.round(currentValue)
      });
    }
    return data;
  }

  generateCategoryDistribution(categories: string[]): { name: string, value: number }[] {
    let remaining = 100;
    return categories.map((cat, index) => {
      if (index === categories.length - 1) return { name: cat, value: remaining };
      const val = Math.floor(this.random() * remaining * 0.6);
      remaining -= val;
      return { name: cat, value: val };
    });
  }
}
