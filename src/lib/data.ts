import { BlogPostListSchema, BlogPost } from '../schemas/blog';
import { ServiceListSchema, Service } from '../schemas/service';
import blogPostsRaw from '../data/blog-posts.json';
import { SERVICES as servicesRaw } from '../data/services';

export const getBlogPosts = (): BlogPost[] => {
  // Validate at runtime
  const result = BlogPostListSchema.safeParse(blogPostsRaw);
  
  if (!result.success) {
    console.error('CRITICAL: Blog Data Validation Failed', result.error);
    // In production, we might want to return empty array or throw, 
    // but for now we log and fallback to empty to prevent crash
    return [];
  }
  
  return result.data;
};

export const getServices = (): Service[] => {
  // Validate at runtime (even though it's TS, ensures structure matches schema)
  const result = ServiceListSchema.safeParse(servicesRaw);
  
  if (!result.success) {
     console.error('CRITICAL: Service Data Validation Failed', result.error);
     return [];
  }
  
  return result.data;
};
