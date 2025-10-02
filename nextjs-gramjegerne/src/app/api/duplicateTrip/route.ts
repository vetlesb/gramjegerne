import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function POST(request: NextRequest) {
  try {
    console.log('Duplicate trip API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id ? 'authenticated' : 'not authenticated');
    
    if (!session?.user?.id) {
      console.log('Unauthorized - no session');
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {tripId} = await request.json();
    console.log('Trip ID:', tripId);
    
    if (!tripId) {
      console.log('No trip ID provided');
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

    // Fetch the original trip (no ownership check - we want to allow duplicating shared trips)
    const originalTrip = await client.fetch(
      `*[_type == "trip" && _id == $tripId][0] {
        _id,
        name,
        description,
        slug,
        image,
        startDate,
        endDate,
        campingSpots,
        routes
      }`,
      {tripId},
    );

    if (!originalTrip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    // Create a new slug
    const baseSlug = originalTrip.slug.current;
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${baseSlug}-copy-${timestamp}-${randomSuffix}`;

    // Create the new trip document
    const newTrip = {
      _type: 'trip',
      name: `${originalTrip.name} (copy)`,
      description: originalTrip.description,
      slug: {
        _type: 'slug',
        current: newSlug,
      },
      image: originalTrip.image,
      startDate: originalTrip.startDate,
      endDate: originalTrip.endDate,
      campingSpots: originalTrip.campingSpots || [],
      routes: originalTrip.routes || [],
      user: {
        _type: 'reference',
        _ref: user._id,
      },
      // Don't copy sharing properties - new trip starts as private
      shareId: undefined,
      isShared: false,
    };

    // Create the new trip in Sanity
    const result = await client.create(newTrip);

    return NextResponse.json({
      success: true,
      message: 'Trip duplicated successfully',
      trip: {
        _id: result._id,
        name: newTrip.name,
        slug: {current: newSlug},
      },
    });
  } catch (error) {
    console.error('Error duplicating trip:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
