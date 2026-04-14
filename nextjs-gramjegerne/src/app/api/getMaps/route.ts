import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Fetch maps for the user
    const mapsQuery = `*[_type == "map" && user._ref == $userId] | order(_createdAt desc) {
      _id,
      _createdAt,
      _updatedAt,
      name,
      description,
      startDate,
      endDate,
      defaultTileLayer,
      "campingSpotsCount": count(campingSpots),
      "routesCount": count(routes),
      "routes": routes[]{waypoints, elevationGain},
      "campingSpots": campingSpots[]{category},
      image
    }`;

    const maps = await client.fetch(mapsQuery, {userId: user._id});

    return NextResponse.json({
      success: true,
      maps,
    });
  } catch (error) {
    console.error('Error fetching maps:', error);
    return NextResponse.json({error: 'Failed to fetch maps'}, {status: 500});
  }
}
