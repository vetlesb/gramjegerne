import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  token: 'your-token',
  apiVersion: '2023-05-03',
  useCdn: false,
})

const fixListKeys = async () => {
  console.log('Starting to fix list keys...')

  try {
    const lists = await client.fetch(`*[_type == "list" && defined(items)] {
      "listId": _id,
      "items": items[] {
        _ref,
        _type,
        "_hasKey": defined(_key)
      }
    }`)

    console.log(`Found ${lists.length} lists to check`)

    for (const list of lists) {
      const {listId, items} = list
      console.log(`Checking list ${listId} with ${items.length} items`)

      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        if (!item._hasKey) {
          console.log(`Fixing item at index ${index} in list ${listId}`)
          await client
            .patch(listId)
            .set({[`items[${index}]._key`]: uuidv4()})
            .commit()
          console.log(`Fixed item at index ${index}`)
        }
      }
    }

    console.log('Finished fixing list keys')
  } catch (error) {
    console.error('Error fixing list keys:', error)
  }
}

fixListKeys()
