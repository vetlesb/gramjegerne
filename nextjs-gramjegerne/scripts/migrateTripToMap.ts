import * as dotenv from 'dotenv';
import {resolve} from 'path';
import {createClient} from '@sanity/client';

// Load environment variables from .env.local
dotenv.config({path: resolve(__dirname, '..', '.env.local')});

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

async function migrateTripToMap() {
  console.log('=== Trip -> Map Migration ===\n');

  // Step 1: Build ID mapping (old trip ID -> new map ID)
  const trips = await client.fetch(`*[_type == "trip"]`);
  console.log(`Found ${trips.length} trip documents`);

  // Check which map_ documents already exist from previous run
  const existingMaps = await client.fetch(`*[_type == "map"]._id`);
  const existingMapSet = new Set(existingMaps);

  const idMap: Record<string, string> = {};

  // Step 2: Create map documents (skip if already exists)
  for (const trip of trips) {
    const newId = `map_${trip._id}`;
    idMap[trip._id] = newId;

    if (existingMapSet.has(newId)) {
      console.log(`Map already exists: ${newId} (skipping)`);
      continue;
    }

    const {_id, _type, _rev, _createdAt, _updatedAt, ...rest} = trip;

    try {
      await client.create({
        ...rest,
        _id: newId,
        _type: 'map',
      });
      console.log(`Created map: ${newId}`);
    } catch (error: any) {
      console.error(`Failed to create map ${newId}: ${error.message}`);
    }
  }

  // Step 3: Update user sharedMaps to point to new IDs
  const users = await client.fetch(`*[_type == "user" && (defined(sharedTrips) || defined(sharedMaps))]`);
  console.log(`\nFound ${users.length} users to check`);

  for (const user of users) {
    const patches: Record<string, any> = {};
    const unsets: string[] = [];

    // Migrate sharedTrips -> sharedMaps with new IDs
    if (user.sharedTrips && user.sharedTrips.length > 0) {
      const newSharedMaps = user.sharedTrips.map((shared: any) => ({
        _type: 'object',
        _key: shared._key,
        map: {
          _type: 'reference',
          _ref: idMap[shared.trip?._ref] || shared.trip?._ref,
        },
        addedAt: shared.addedAt,
      }));

      // Merge with any existing sharedMaps
      const existing = user.sharedMaps || [];
      patches.sharedMaps = [...existing, ...newSharedMaps];
      unsets.push('sharedTrips');
    }

    // Update existing sharedMaps references to new IDs
    if (user.sharedMaps && user.sharedMaps.length > 0) {
      const updated = user.sharedMaps.map((shared: any) => {
        const ref = shared.map?._ref;
        if (ref && idMap[ref]) {
          return {
            ...shared,
            map: { _type: 'reference', _ref: idMap[ref] },
          };
        }
        return shared;
      });
      patches.sharedMaps = updated;
    }

    if (Object.keys(patches).length > 0 || unsets.length > 0) {
      try {
        let patch = client.patch(user._id);
        if (Object.keys(patches).length > 0) patch = patch.set(patches);
        if (unsets.length > 0) patch = patch.unset(unsets);
        await patch.commit();
        console.log(`Updated user: ${user._id}`);
      } catch (error: any) {
        console.error(`Failed to update user ${user._id}: ${error.message}`);
      }
    }
  }

  // Step 4: Update list connectedMap references to new IDs
  const lists = await client.fetch(`*[_type == "list" && (defined(connectedTrip) || defined(connectedMap))]`);
  console.log(`\nFound ${lists.length} lists to check`);

  for (const list of lists) {
    const patches: Record<string, any> = {};
    const unsets: string[] = [];

    // Migrate connectedTrip -> connectedMap with new ID
    if (list.connectedTrip) {
      const ref = list.connectedTrip._ref;
      patches.connectedMap = {
        _type: 'reference',
        _ref: idMap[ref] || ref,
      };
      unsets.push('connectedTrip');
    }

    // Update existing connectedMap reference to new ID
    if (list.connectedMap) {
      const ref = list.connectedMap._ref;
      if (ref && idMap[ref]) {
        patches.connectedMap = {
          _type: 'reference',
          _ref: idMap[ref],
        };
      }
    }

    if (Object.keys(patches).length > 0 || unsets.length > 0) {
      try {
        let patch = client.patch(list._id);
        if (Object.keys(patches).length > 0) patch = patch.set(patches);
        if (unsets.length > 0) patch = patch.unset(unsets);
        await patch.commit();
        console.log(`Updated list: ${list._id}`);
      } catch (error: any) {
        console.error(`Failed to update list ${list._id}: ${error.message}`);
      }
    }
  }

  // Step 5: Delete old trip documents (now that references are updated)
  console.log(`\nDeleting ${trips.length} old trip documents...`);
  for (const trip of trips) {
    try {
      await client.delete(trip._id);
      console.log(`Deleted old trip: ${trip._id}`);
    } catch (error: any) {
      console.error(`Failed to delete trip ${trip._id}: ${error.message}`);
    }
  }

  console.log('\n=== Migration complete! ===');
}

migrateTripToMap().catch(console.error);
