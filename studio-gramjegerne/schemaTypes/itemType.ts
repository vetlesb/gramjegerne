import {defineField, defineType} from 'sanity'

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
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'category',
      type: 'category',
    }),
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

export const categoryType = defineType({
  name: 'category',
  type: 'object',
  fields: [
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: ['food', 'clothing', 'sleeping', 'fishing', 'paddling', 'biking', 'gear', 'cooking'],
      },
    }),
  ],
})
