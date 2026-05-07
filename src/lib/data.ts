import { BlogPostListSchema, BlogPost } from '../schemas/blog';
import { ServiceListSchema, Service } from '../schemas/service';
import blogPostsRaw from '../data/blog-posts.json';
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

export const getServices = (): Service[] => {
  const result = ServiceListSchema.safeParse(servicesRaw);

  if (!result.success) {
    Logger.error('CRITICAL: Service Data Validation Failed', result.error);
    return [];
  }

  return result.data;
};
