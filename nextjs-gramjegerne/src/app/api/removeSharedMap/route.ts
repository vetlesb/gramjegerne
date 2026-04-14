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

export async function DELETE(request: NextRequest) {
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

    // Find the index of the shared map to remove
    const sharedMapIndex = user.sharedMaps?.findIndex(
      (shared: SharedMapRef) => shared.map._ref === mapId,
    );

    if (sharedMapIndex === -1 || sharedMapIndex === undefined) {
      return NextResponse.json({error: 'Shared map not found'}, {status: 404});
    }

    // Remove the map from shared maps using filter
    const updatedSharedMaps = user.sharedMaps.filter(
      (shared: SharedMapRef) => shared.map._ref !== mapId,
    );

    const updatedUser = await client
      .patch(user._id)
      .set({sharedMaps: updatedSharedMaps})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error removing shared map:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
