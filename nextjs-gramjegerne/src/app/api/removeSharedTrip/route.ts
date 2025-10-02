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

export async function DELETE(request: NextRequest) {
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

    // Find the index of the shared trip to remove
    const sharedTripIndex = user.sharedTrips?.findIndex(
      (shared: SharedTripRef) => shared.trip._ref === tripId,
    );

    if (sharedTripIndex === -1 || sharedTripIndex === undefined) {
      return NextResponse.json({error: 'Shared trip not found'}, {status: 404});
    }

    // Remove the trip from shared trips using filter
    const updatedSharedTrips = user.sharedTrips.filter(
      (shared: SharedTripRef) => shared.trip._ref !== tripId,
    );

    const updatedUser = await client
      .patch(user._id)
      .set({sharedTrips: updatedSharedTrips})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error removing shared trip:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
