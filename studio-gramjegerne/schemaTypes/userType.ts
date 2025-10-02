import {defineField, defineType} from 'sanity';
import {UserIcon} from '@sanity/icons';
import {UserPreview} from '../components/UserPreview';

export const userType = defineType({
  name: 'user',
  title: 'User',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'googleId',
      title: 'Google ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Profile Image',
      type: 'string',
      description: "The URL of the user's Google profile image",
    }),
    defineField({
      name: 'sharedLists',
      title: 'Shared Lists',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'list',
              type: 'reference',
              to: [{type: 'list'}],
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'addedAt',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
            },
          ],
          preview: {
            select: {
              title: 'list.name',
              subtitle: 'list.user.name',
            },
          },
        },
      ],
      description: 'Lists shared with this user that they have saved',
    }),
    defineField({
      name: 'sharedTrips',
      title: 'Shared Trips',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'trip',
              type: 'reference',
              to: [{type: 'trip'}],
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'addedAt',
              type: 'datetime',
              initialValue: () => new Date().toISOString(),
            },
          ],
          preview: {
            select: {
              title: 'trip.name',
              subtitle: 'trip.user.name',
            },
          },
        },
      ],
      description: 'Trips shared with this user that they have saved',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'image',
    },
    prepare: UserPreview,
  },
});
