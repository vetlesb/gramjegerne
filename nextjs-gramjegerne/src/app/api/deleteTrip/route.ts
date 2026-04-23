import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {searchParams} = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({error: 'Trip ID is required'}, {status: 400});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the trip belongs to the user
    const existingTripQuery = `*[_type == "trip" && _id == $tripId && user._ref == $userId][0]`;
    const existingTrip = await client.fetch(existingTripQuery, {
      tripId,
      userId: user._id,
    });

    if (!existingTrip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    // Disconnect any lists referencing this trip
    const connectedLists = await client.fetch(
      `*[_type == "list" && $tripId in connectedTrips[]._ref]{_id, connectedTrips}`,
      {tripId},
    );

    for (const list of connectedLists) {
      const keysToRemove = (list.connectedTrips || [])
        .filter((ref: {_ref: string; _key: string}) => ref._ref === tripId)
        .map((ref: {_key: string}) => `connectedTrips[_key=="${ref._key}"]`);
      if (keysToRemove.length > 0) {
        await client.patch(list._id).unset(keysToRemove).commit();
      }
    }

    // Disconnect any maps referencing this trip
    const connectedMaps = await client.fetch(
      `*[_type == "map" && $tripId in connectedTrips[]._ref]{_id, connectedTrips}`,
      {tripId},
    );

    for (const map of connectedMaps) {
      const keysToRemove = (map.connectedTrips || [])
        .filter((ref: {_ref: string; _key: string}) => ref._ref === tripId)
        .map((ref: {_key: string}) => `connectedTrips[_key=="${ref._key}"]`);
      if (keysToRemove.length > 0) {
        await client.patch(map._id).unset(keysToRemove).commit();
      }
    }

    // Remove from any users' sharedTrips arrays
    const usersWithShared = await client.fetch(
      `*[_type == "user" && $tripId in sharedTrips[].trip._ref]{_id, sharedTrips}`,
      {tripId},
    );

    for (const u of usersWithShared) {
      const filtered = u.sharedTrips.filter(
        (s: {trip: {_ref: string}}) => s.trip._ref !== tripId,
      );
      await client.patch(u._id).set({sharedTrips: filtered}).commit();
    }

    // Delete the trip
    await client.delete(tripId);

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({error: 'Failed to delete trip'}, {status: 500});
  }
}
