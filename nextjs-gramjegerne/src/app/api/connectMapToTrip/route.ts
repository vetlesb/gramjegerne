import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';
import {nanoid} from 'nanoid';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {mapId, tripId} = body;

    if (!mapId || !tripId) {
      return NextResponse.json({error: 'Map ID and Trip ID are required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the map belongs to the user
    const map = await client.fetch(
      `*[_type == "map" && _id == $mapId && user._ref == $userId][0]{ _id, connectedTrips }`,
      {mapId, userId: user._id},
    );

    if (!map) {
      return NextResponse.json({error: 'Map not found or unauthorized'}, {status: 404});
    }

    // Check if trip owner restricts maps
    const trip = await client.fetch(
      `*[_type == "trip" && _id == $tripId][0]{ _id, user, mapsRestrictedToOwner, mainMap }`,
      {tripId},
    );

    if (!trip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    if (trip.mapsRestrictedToOwner && trip.user?._ref !== user._id) {
      return NextResponse.json({error: 'Only the trip owner can add maps'}, {status: 403});
    }

    // Check if already connected to this trip
    const alreadyConnected = map.connectedTrips?.some(
      (ref: {_ref: string}) => ref._ref === tripId,
    );
    if (alreadyConnected) {
      return NextResponse.json({success: true});
    }

    // Append trip reference to connectedTrips array
    await client
      .patch(mapId)
      .setIfMissing({connectedTrips: []})
      .append('connectedTrips', [
        {
          _key: nanoid(),
          _type: 'reference',
          _ref: tripId,
        },
      ])
      .commit();

    // Auto-set as main map if the trip doesn't have one yet
    if (!trip.mainMap) {
      await client
        .patch(tripId)
        .set({
          mainMap: {
            _type: 'reference',
            _ref: mapId,
          },
        })
        .commit();
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error connecting map to trip:', error);
    return NextResponse.json({error: 'Failed to connect map to trip'}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {mapId, tripId} = body;

    if (!mapId || !tripId) {
      return NextResponse.json({error: 'Map ID and Trip ID are required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the map belongs to the user
    const map = await client.fetch(
      `*[_type == "map" && _id == $mapId && user._ref == $userId][0]{ _id, connectedTrips }`,
      {mapId, userId: user._id},
    );

    if (!map) {
      return NextResponse.json({error: 'Map not found or unauthorized'}, {status: 404});
    }

    // Remove the specific trip reference from the array
    const keysToRemove = (map.connectedTrips || [])
      .filter((ref: {_ref: string; _key: string}) => ref._ref === tripId)
      .map((ref: {_key: string}) => `connectedTrips[_key=="${ref._key}"]`);

    if (keysToRemove.length > 0) {
      await client.patch(mapId).unset(keysToRemove).commit();
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error disconnecting map from trip:', error);
    return NextResponse.json({error: 'Failed to disconnect map from trip'}, {status: 500});
  }
}
