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
        source: async (doc: any, options: any) => {
          // Create a base slug from the name
          const baseName = doc.name?.toLowerCase().replace(/\s+/g, '-') || ''
          // Add user reference to make it unique
          return `${baseName}-${doc.user?._ref || 'unknown'}`
        },
        maxLength: 200,
      },
      validation: (Rule) =>
        Rule.required().custom(async (slug: any, context: any) => {
          const {document, getClient} = context
          const client = getClient({apiVersion: '2023-01-01'})

          if (!slug?.current) {
            return true // Let required validation handle this
          }

          // Check for existing documents with same slug and user
          const query = `count(*[
            _type == "list" && 
            slug.current == $slug && 
            user._ref == $userId && 
            _id != $docId
          ]) > 0`

          const params = {
            slug: slug.current,
            userId: document.user?._ref,
            docId: document._id,
          }

          const hasDoubles = await client.fetch(query, params)
          return hasDoubles ? 'A list with this name already exists for this user' : true
        }),
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
            defineField({
              name: 'categoryOverride',
              type: 'reference',
              to: [{type: 'category'}],
              title: 'Category Override',
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
  // Add document-level validation
  validation: (Rule) => [
    Rule.custom((doc: any) => {
      if (!doc?.slug?.current?.includes(doc?.user?._ref)) {
        return 'Slug must include user reference'
      }
      return true
    }).error(),
  ],
})
