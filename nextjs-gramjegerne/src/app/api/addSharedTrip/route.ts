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

    const {tripId, categoryId} = await request.json();

    if (!tripId) {
      return NextResponse.json({error: 'Trip ID is required'}, {status: 400});
    }

    const rawGoogleId = session.user.id.replace('google_', '');

    const user = await client.fetch(`*[_type == "user" && googleId == $googleId][0]`, {
      googleId: rawGoogleId,
    });

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Check if already shared
    const existing = user.sharedTrips?.find(
      (shared: SharedTripRef) => shared.trip._ref === tripId,
    );

    if (existing) {
      return NextResponse.json({error: 'Trip already saved'}, {status: 400});
    }

    // Verify trip exists
    const trip = await client.fetch(`*[_type == "trip" && _id == $tripId][0]{ _id }`, {tripId});

    if (!trip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sharedTripRef: any = {
      _type: 'object',
      _key: `shared_${tripId}_${Date.now()}`,
      trip: {
        _type: 'reference',
        _ref: tripId,
      },
      addedAt: new Date().toISOString(),
    };

    if (categoryId) {
      sharedTripRef.category = {
        _type: 'reference',
        _ref: categoryId,
      };
    }

    const currentSharedTrips = user.sharedTrips || [];
    const filtered = currentSharedTrips.filter(
      (shared: SharedTripRef) => shared.trip._ref !== tripId,
    );

    const updatedUser = await client
      .patch(user._id)
      .set({sharedTrips: [...filtered, sharedTripRef]})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error adding shared trip:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
