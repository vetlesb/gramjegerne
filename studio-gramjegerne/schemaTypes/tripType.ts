import {ReferenceRule} from '@sanity/types';
import {defineField, defineType} from 'sanity';

const campingSpotFields = [
  defineField({
    name: 'name',
    type: 'string',
    title: 'Name',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'description',
    type: 'text',
    title: 'Description',
  }),
  defineField({
    name: 'coordinates',
    type: 'object',
    title: 'Coordinates',
    fields: [
      defineField({
        name: 'lat',
        type: 'number',
        title: 'Latitude',
        validation: (Rule) => Rule.required().min(-90).max(90),
      }),
      defineField({
        name: 'lng',
        type: 'number',
        title: 'Longitude',
        validation: (Rule) => Rule.required().min(-180).max(180),
      }),
    ],
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'image',
    type: 'image',
    title: 'Image',
  }),
];

const routeFields = [
  defineField({
    name: 'name',
    type: 'string',
    title: 'Name',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'description',
    type: 'text',
    title: 'Description',
  }),
  defineField({
    name: 'waypoints',
    type: 'array',
    title: 'Waypoints',
    of: [
      {
        type: 'object',
        name: 'waypoint',
        title: 'Waypoint',
        fields: [
          defineField({
            name: 'lat',
            type: 'number',
            title: 'Latitude',
            validation: (Rule) => Rule.required().min(-90).max(90),
          }),
          defineField({
            name: 'lng',
            type: 'number',
            title: 'Longitude',
            validation: (Rule) => Rule.required().min(-180).max(180),
          }),
        ],
      },
    ],
    validation: (Rule) => Rule.required().min(2),
  }),
  defineField({
    name: 'color',
    type: 'string',
    title: 'Route Color',
    initialValue: '#FF0000',
    validation: (Rule) => Rule.required(),
  }),
  defineField({
    name: 'elevationGain',
    type: 'number',
    title: 'Elevation Gain (meters)',
    description: 'Total elevation gain for this route in meters',
  }),
  defineField({
    name: 'elevationProfile',
    type: 'object',
    title: 'Elevation Profile',
    fields: [
      defineField({
        name: 'totalAscent',
        type: 'number',
        title: 'Total Ascent (m)',
      }),
      defineField({
        name: 'totalDescent',
        type: 'number',
        title: 'Total Descent (m)',
      }),
      defineField({
        name: 'minElevation',
        type: 'number',
        title: 'Minimum Elevation (m)',
      }),
      defineField({
        name: 'maxElevation',
        type: 'number',
        title: 'Maximum Elevation (m)',
      }),
    ],
  }),
];

const fields = [
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
    description: 'Optional - will be auto-generated from name',
    options: {
      source: async (doc: any) => {
        // Create a base slug from the name
        const baseName = doc.name?.toLowerCase().replace(/\s+/g, '-') || '';
        return baseName || 'untitled-trip';
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
    name: 'campingSpots',
    type: 'array',
    title: 'Camping Spots',
    of: [
      {
        type: 'object',
        name: 'campingSpot',
        title: 'Camping Spot',
        fields: campingSpotFields,
        preview: {
          select: {
            title: 'name',
            coordinates: 'coordinates',
            media: 'image',
          },
          prepare({title, coordinates, media}) {
            return {
              title: title || 'Unnamed Spot',
              subtitle: coordinates
                ? `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                : 'No coordinates',
              media: media,
            };
          },
        },
      },
    ],
  }),
  defineField({
    name: 'routes',
    type: 'array',
    title: 'Routes',
    of: [
      {
        type: 'object',
        name: 'route',
        title: 'Route',
        fields: routeFields,
        preview: {
          select: {
            title: 'name',
            waypointCount: 'waypoints',
            color: 'color',
          },
          prepare({title, waypointCount, color}) {
            return {
              title: title || 'Unnamed Route',
              subtitle: waypointCount ? `${waypointCount.length} waypoints` : 'No waypoints',
              media: undefined, // Remove the JSX media function
            };
          },
        },
      },
    ],
  }),
  defineField({
    name: 'user',
    type: 'reference',
    to: [{type: 'user'}],
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
];

export const tripType = defineType({
  name: 'trip',
  title: 'Trip',
  type: 'document',
  fields: fields,
});
