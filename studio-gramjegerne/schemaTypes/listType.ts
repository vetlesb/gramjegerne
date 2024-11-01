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
