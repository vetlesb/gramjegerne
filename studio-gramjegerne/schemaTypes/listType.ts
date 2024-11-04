import {defineField, defineType} from 'sanity'

export const listType = defineType({
  name: 'list',
  title: 'list',
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
        maxLength: 200, // will be ignored if slugify is set
        slugify: (input) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'days',
      type: 'number',
    }),
    defineField({
      name: 'weight',
      type: 'number',
    }),
    defineField({
      name: 'participants',
      type: 'number',
    }),
  ],
})
