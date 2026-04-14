import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

interface SharedMapRef {
  _key: string;
  map: {
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

    // Check if the map is already in shared maps
    const existingSharedMap = user.sharedMaps?.find(
      (shared: SharedMapRef) => shared.map._ref === mapId,
    );

    if (existingSharedMap) {
      return NextResponse.json({error: 'Map already in shared maps'}, {status: 400});
    }

    // Get the map details to include user info
    const map = await client.fetch(
      `*[_type == "map" && _id == $mapId][0] {
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
      {mapId},
    );

    if (!map) {
      return NextResponse.json({error: 'Map not found'}, {status: 404});
    }

    // Add the map to shared maps with a unique key
    const sharedMapRef = {
      _type: 'object',
      _key: `shared_${mapId}_${Date.now()}`, // Generate unique key
      map: {
        _type: 'reference',
        _ref: mapId,
      },
      addedAt: new Date().toISOString(),
    };

    // Use set instead of append to ensure no duplicates
    const currentSharedMaps = user.sharedMaps || [];

    // Remove any existing references to this map (in case of duplicates)
    const filteredSharedMaps = currentSharedMaps.filter(
      (shared: SharedMapRef) => shared.map._ref !== mapId,
    );

    const updatedSharedMaps = [...filteredSharedMaps, sharedMapRef];

    const updatedUser = await client
      .patch(user._id)
      .set({sharedMaps: updatedSharedMaps})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error adding shared map:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
