import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        date: fields.date({ label: 'Published Date' }),
        author: fields.text({ label: 'Author' }),
        category: fields.text({ label: 'Category' }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value ?? 'Tag',
        }),
        coverImage: fields.text({ label: 'Cover Image URL' }),
        readingTime: fields.text({ label: 'Reading Time' }),
        lang: fields.select({
          label: 'Language',
          options: [
            { label: 'Turkish', value: 'tr' },
            { label: 'English', value: 'en' },
          ],
          defaultValue: 'tr',
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
          ],
          defaultValue: 'draft',
        }),
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
