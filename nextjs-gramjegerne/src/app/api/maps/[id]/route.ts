import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {id} = await params;

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Fetch the specific map with full details
    const mapQuery = `*[_type == "map" && _id == $mapId && user._ref == $userId][0] {
      _id,
      _createdAt,
      _updatedAt,
      name,
      description,
      startDate,
      endDate,
      campingSpots,
      routes,
      image,
      user
    }`;

    const map = await client.fetch(mapQuery, {
      mapId: id,
      userId: user._id,
    });

    if (!map) {
      return NextResponse.json({error: 'Map not found'}, {status: 404});
    }

    return NextResponse.json({
      success: true,
      map,
    });
  } catch (error) {
    console.error('Error fetching map:', error);
    return NextResponse.json({error: 'Failed to fetch map'}, {status: 500});
  }
}
