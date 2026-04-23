import * as dotenv from 'dotenv';
import {resolve} from 'path';
import {createClient} from '@sanity/client';
import {nanoid} from 'nanoid';

// Load environment variables from .env.local
dotenv.config({path: resolve(__dirname, '..', '.env.local')});

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

async function migrateConnectedTrips() {
  console.log('=== Migrate connectedTrip → connectedTrips ===\n');

  // Migrate lists
  const lists = await client.fetch(
    `*[_type == "list" && defined(connectedTrip)]{_id, connectedTrip}`,
  );
  console.log(`Found ${lists.length} lists with connectedTrip`);

  for (const list of lists) {
    const tripRef = list.connectedTrip._ref;
    console.log(`  Migrating list ${list._id} → connectedTrips[${tripRef}]`);
    await client
      .patch(list._id)
      .setIfMissing({connectedTrips: []})
      .append('connectedTrips', [
        {
          _key: nanoid(),
          _type: 'reference',
          _ref: tripRef,
        },
      ])
      .unset(['connectedTrip'])
      .commit();
  }

  // Migrate maps
  const maps = await client.fetch(
    `*[_type == "map" && defined(connectedTrip)]{_id, connectedTrip}`,
  );
  console.log(`Found ${maps.length} maps with connectedTrip`);

  for (const map of maps) {
    const tripRef = map.connectedTrip._ref;
    console.log(`  Migrating map ${map._id} → connectedTrips[${tripRef}]`);
    await client
      .patch(map._id)
      .setIfMissing({connectedTrips: []})
      .append('connectedTrips', [
        {
          _key: nanoid(),
          _type: 'reference',
          _ref: tripRef,
        },
      ])
      .unset(['connectedTrip'])
      .commit();
  }

  console.log('\nMigration complete!');
}

migrateConnectedTrips().catch(console.error);
