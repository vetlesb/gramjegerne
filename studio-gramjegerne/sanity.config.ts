import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Gramjegerne',

  projectId: 'wlgnd2w5',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'list') {
        return prev.filter(
          (action) =>
            action.action && !['unpublish', 'delete', 'duplicate'].includes(action.action),
        )
      }
      return prev
    },
  },
})
