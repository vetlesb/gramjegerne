import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {mapId} = await request.json();

    if (!mapId) {
      return NextResponse.json({error: 'Map ID is required'}, {status: 400});
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

    // Fetch the original map (no ownership check - we want to allow duplicating shared maps)
    const originalMap = await client.fetch(
      `*[_type == "map" && _id == $mapId][0] {
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
      {mapId},
    );

    if (!originalMap) {
      return NextResponse.json({error: 'Map not found'}, {status: 404});
    }

    // Create a new slug
    const baseSlug = originalMap.slug?.current || originalMap.name?.toLowerCase().replace(/\s+/g, '-') || 'map';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newSlug = `${baseSlug}-copy-${timestamp}-${randomSuffix}`;

    // Create the new map document
    const newMap = {
      _type: 'map',
      name: `${originalMap.name} (copy)`,
      description: originalMap.description,
      slug: {
        _type: 'slug',
        current: newSlug,
      },
      image: originalMap.image,
      startDate: originalMap.startDate,
      endDate: originalMap.endDate,
      campingSpots: originalMap.campingSpots || [],
      routes: originalMap.routes || [],
      user: {
        _type: 'reference',
        _ref: user._id,
      },
      // Don't copy sharing properties - new map starts as private
      shareId: undefined,
      isShared: false,
    };

    // Create the new map in Sanity
    const result = await client.create(newMap);

    return NextResponse.json({
      success: true,
      message: 'Map duplicated successfully',
      map: {
        _id: result._id,
        name: newMap.name,
        slug: {current: newSlug},
      },
    });
  } catch (error) {
    console.error('Error duplicating map:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
