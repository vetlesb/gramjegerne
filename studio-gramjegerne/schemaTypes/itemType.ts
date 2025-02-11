import { ReferenceRule } from '@sanity/types';
import { defineField, defineType } from 'sanity';

export const itemType = defineType({
  name: 'item',
  title: 'Item',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
    }),
    defineField({
      title: 'slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 200,
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    },
    defineField({
      name: 'size',
      type: 'string',
    }),
    defineField({
      name: 'weight',
      type: 'weight',
    }),
    defineField({
      name: 'quantity',
      type: 'number',
    }),
    defineField({
      name: 'calories',
      type: 'number',
    }),
    defineField({
      name: 'user',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (rule: ReferenceRule) => rule.required(),
    }),
  ],
})

export const weightType = defineType({
  name: 'weight',
  type: 'object',
  fields: [
    defineField({
      name: 'weight',
      type: 'number',
    }),
    defineField({
      name: 'unit',
      type: 'string',
      options: {
        list: ['g', 'kg'],
      },
    }),
  ],
})
