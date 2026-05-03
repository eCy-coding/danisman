
import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        publishedDate: fields.date({ label: 'Published Date' }),
        category: fields.text({ label: 'Category' }),
        summary: fields.text({ label: 'Summary' }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
          images: true,
        }),
      },
    }),
    caseStudies: collection({
      label: 'Case Studies',
      slugField: 'title',
      path: 'src/content/case-studies/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        client: fields.text({ label: 'Client' }),
        industry: fields.text({ label: 'Industry' }),
        result: fields.text({ label: 'Key Result' }),
        content: fields.document({
          label: 'Case Study Details',
          formatting: true,
          dividers: true,
          links: true,
          images: true,
        }),
      },
    }),
  },
});
