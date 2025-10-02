import {client} from '@/sanity/client';
import {getUserSession} from '@/lib/auth-helpers';
import {nanoid} from 'nanoid';

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {tripId} = await request.json();
    if (!tripId) {
      return new Response('Trip ID is required', {status: 400});
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
      return new Response('Trip not found', {status: 404});
    }

    // Create a new slug
    const baseSlug = originalTrip.slug.current;
    const newSlug = `${baseSlug}-${nanoid(6)}`;

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
        _ref: session.user.id,
      },
      // Don't copy sharing properties - new trip starts as private
      shareId: undefined,
      isShared: false,
    };

    // Create the new trip in Sanity
    const result = await client.create(newTrip);

    return new Response(
      JSON.stringify({
        message: 'Trip duplicated successfully',
        trip: {
          _id: result._id,
          name: newTrip.name,
          slug: {current: newSlug},
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error duplicating trip:', error);
    return new Response(JSON.stringify({message: 'Failed to duplicate trip'}), {status: 500});
  }
}
