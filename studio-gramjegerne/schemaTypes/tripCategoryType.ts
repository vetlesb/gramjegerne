import {defineField, defineType} from 'sanity';

export const tripCategoryType = defineType({
  name: 'tripCategory',
  title: 'Trip Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(50),
      description: 'Name of the trip category',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[æå]/g, 'a')
            .replace(/[ø]/g, 'o')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 96),
      },
      validation: (rule) => rule.required(),
      description: 'Unique URL-friendly version of the category name',
    }),
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (rule) => rule.required(),
      description: 'User who owns this trip category',
    }),
  ],
  orderings: [
    {
      title: 'Title, A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
});
