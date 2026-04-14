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
    const mapId = searchParams.get('mapId');

    if (!mapId) {
      return NextResponse.json({error: 'Map ID is required'}, {status: 400});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the map belongs to the user
    const existingMapQuery = `*[_type == "map" && _id == $mapId && user._ref == $userId][0]`;
    const existingMap = await client.fetch(existingMapQuery, {
      mapId,
      userId: user._id,
    });

    if (!existingMap) {
      return NextResponse.json({error: 'Map not found'}, {status: 404});
    }

    // Delete the map
    await client.delete(mapId);

    return NextResponse.json({
      success: true,
      message: 'Map deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting map:', error);
    return NextResponse.json({error: 'Failed to delete map'}, {status: 500});
  }
}
