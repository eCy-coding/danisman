export interface BlogPost {
  id: string;
  title: Record<string, string>;
  category: Record<string, string>;
  date: Record<string, string>;
  readTime: Record<string, string>;
  excerpt: Record<string, string>;
  content: string;
  image: string;
  slug: string;
}

export interface CaseStudy {
  id: string;
  client: string;
  sector: Record<string, string>;
  challenge: Record<string, string>;
  solution: Record<string, string>;
  result: Record<string, string>;
  description: Record<string, string>;
  category: Record<string, string>;
  image: string;
  slug: string;
}
