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

    // Fetch trips for the user
    const tripsQuery = `*[_type == "trip" && user._ref == $userId] | order(_createdAt desc) {
      _id,
      _createdAt,
      _updatedAt,
      name,
      description,
      startDate,
      endDate,
      "campingSpotsCount": count(campingSpots),
      "routesCount": count(routes),
      "routes": routes[]{waypoints},
      "campingSpots": campingSpots[]{category},
      image
    }`;

    const trips = await client.fetch(tripsQuery, {userId: user._id});

    return NextResponse.json({
      success: true,
      trips,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({error: 'Failed to fetch trips'}, {status: 500});
  }
}
