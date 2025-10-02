import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

interface SharedTripRef {
  _key: string;
  trip: {
    _ref: string;
  };
  addedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {tripId} = await request.json();

    if (!tripId) {
      return NextResponse.json({error: 'Trip ID is required'}, {status: 400});
    }

    // Extract the raw Google ID from session (remove "google_" prefix)
    const rawGoogleId = session.user.id.replace('google_', '');

    // Get the current user
    const user = await client.fetch(`*[_type == "user" && googleId == $googleId][0]`, {
      googleId: rawGoogleId,
    });

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Check if the trip is already in shared trips
    const existingSharedTrip = user.sharedTrips?.find(
      (shared: SharedTripRef) => shared.trip._ref === tripId,
    );

    if (existingSharedTrip) {
      return NextResponse.json({error: 'Trip already in shared trips'}, {status: 400});
    }

    // Get the trip details to include user info
    const trip = await client.fetch(
      `*[_type == "trip" && _id == $tripId][0] {
        _id,
        name,
        slug,
        shareId,
        "user": user->{
          _id,
          name,
          email
        }
      }`,
      {tripId},
    );

    if (!trip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    // Add the trip to shared trips with a unique key
    const sharedTripRef = {
      _type: 'object',
      _key: `shared_${tripId}_${Date.now()}`, // Generate unique key
      trip: {
        _type: 'reference',
        _ref: tripId,
      },
      addedAt: new Date().toISOString(),
    };

    // Use set instead of append to ensure no duplicates
    const currentSharedTrips = user.sharedTrips || [];

    // Remove any existing references to this trip (in case of duplicates)
    const filteredSharedTrips = currentSharedTrips.filter(
      (shared: SharedTripRef) => shared.trip._ref !== tripId,
    );

    const updatedSharedTrips = [...filteredSharedTrips, sharedTripRef];

    const updatedUser = await client
      .patch(user._id)
      .set({sharedTrips: updatedSharedTrips})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error adding shared trip:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
