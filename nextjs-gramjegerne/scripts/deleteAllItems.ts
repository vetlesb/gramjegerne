import {createClient} from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-01-01',
});

async function deleteAllItems() {
  try {
    // First, get all item IDs
    const items = await client.fetch('*[_type == "item"]._id');
    console.log(`Found ${items.length} items to delete`);

    // Delete items in batches of 100
    const batchSize = 100;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const transaction = client.transaction();

      batch.forEach((id: string) => {
        transaction.delete(id);
      });

      await transaction.commit();
      console.log(`Deleted items ${i + 1} to ${Math.min(i + batchSize, items.length)}`);
    }

    console.log('Successfully deleted all items');
  } catch (error) {
    console.error('Error deleting items:', error);
  }
}

// Run the function
deleteAllItems();
