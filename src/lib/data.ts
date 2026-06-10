import { BlogPostListSchema, BlogPost } from '../schemas/blog';
import { ServiceListSchema, Service } from '../schemas/service';
import { CaseStudyListSchema } from '../schemas/caseStudy';
import type { CaseStudy } from '../components/features/case-studies/CaseStudyCard';
import blogPostsRaw from '../data/blog-posts.json';
import caseStudiesRaw from '../data/case-studies.json';
import { CASE_STUDIES as MOCK_CASE_STUDIES } from '../data/mockCaseStudies';
import { SERVICES as servicesRaw } from '../data/services';
import { Logger } from './logger';

export const getBlogPosts = (): BlogPost[] => {
  const result = BlogPostListSchema.safeParse(blogPostsRaw);

  if (!result.success) {
    Logger.error('CRITICAL: Blog Data Validation Failed', result.error);
    return [];
  }

  return result.data;
};

/**
 * Case studies: real, editor-authored content (src/content/case-studies/*,
 * compiled to src/data/case-studies.json by gen:case-studies) merged over the
 * legacy mock. Real entries win by slug; mock fills slugs not yet migrated so
 * the showcase never renders empty. Replace mock entries by authoring real
 * .mdoc documents (Keystatic `caseStudies` collection) — no code change needed.
 */
export const getCaseStudies = (): CaseStudy[] => {
  const result = CaseStudyListSchema.safeParse(caseStudiesRaw);
  if (!result.success) {
    Logger.error('CRITICAL: Case Study Data Validation Failed', result.error);
  }
  const real: CaseStudy[] = result.success ? result.data : [];
  const realSlugs = new Set(real.map((c) => c.slug));
  const fallback = MOCK_CASE_STUDIES.filter((c) => !realSlugs.has(c.slug));
  return [...real, ...fallback];
};

export const getServices = (): Service[] => {
  const result = ServiceListSchema.safeParse(servicesRaw);

  if (!result.success) {
    Logger.error('CRITICAL: Service Data Validation Failed', result.error);
    return [];
  }

  return result.data;
};
