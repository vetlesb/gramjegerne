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
    defineField({
      name: 'items',
      type: 'array',
      title: 'Items',
      of: [
        {
          type: 'object',
          name: 'listItem',
          title: 'List Item',
          fields: [
            defineField({
              name: 'item',
              type: 'reference',
              to: [{type: 'item'}],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'quantity',
              type: 'number',
              title: 'Quantity',
              initialValue: 1,
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              title: 'item.name',
              quantity: 'quantity',
              media: 'item.image',
            },
            prepare({title, quantity, media}) {
              return {
                title: `${title || 'Unnamed Item'} (${quantity || 1}x)`,
                media: media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'user',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (rule: ReferenceRule) => rule.required(),
    }),
  ],
})
