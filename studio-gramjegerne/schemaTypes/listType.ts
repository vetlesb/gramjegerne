import {defineField, defineType} from 'sanity'
import {ReferenceDefinition, ReferenceRule} from '@sanity/types'

export const listType = defineType({
  name: 'list',
  title: 'List',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: 'name',
        maxLength: 200,
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Image',
    }),
    defineField({
      name: 'days',
      type: 'number',
      title: 'Days',
    }),
    defineField({
      name: 'weight',
      type: 'number',
      title: 'Weight',
    }),
    defineField({
      name: 'participants',
      type: 'number',
      title: 'Participants',
    }),
    // Added 'items' field to store references to item documents
    defineField({
      name: 'items',
      type: 'array',
      title: 'Items',
      of: [{type: 'reference', to: [{type: 'item'}]}],
    }),
    defineField({
      name: 'user',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (rule: ReferenceRule) => rule.required(),
    }),
  ],
})
