import {defineField, defineType} from 'sanity';

export const tripType = defineType({
  name: 'trip',
  title: 'Trip',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: {
        source: async (doc: any) => {
          const baseName = doc.name?.toLowerCase().replace(/\s+/g, '-') || '';
          const userRef = doc.user?._ref || 'unknown';
          return `${baseName}-${userRef}` || 'untitled-trip';
        },
        maxLength: 200,
      },
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Image',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{type: 'tripCategory'}],
      title: 'Category',
    }),
    defineField({
      name: 'startDate',
      type: 'date',
      title: 'Start Date',
    }),
    defineField({
      name: 'endDate',
      type: 'date',
      title: 'End Date',
    }),
    defineField({
      name: 'user',
      type: 'reference',
      to: [{type: 'user'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'shareId',
      type: 'string',
      title: 'Share ID',
      description: 'Unique identifier for sharing this trip',
      readOnly: true,
    }),
    defineField({
      name: 'isShared',
      type: 'boolean',
      title: 'Is Shared',
      description: 'Whether this trip is publicly shareable',
      initialValue: false,
    }),
  ],
});
