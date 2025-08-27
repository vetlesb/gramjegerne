import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {name, description, startDate, endDate} = body;

    if (!name) {
      return NextResponse.json({error: 'Name is required'}, {status: 400});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Create the trip document
    const tripDoc = {
      _type: 'trip',
      name,
      description,
      startDate,
      endDate,
      campingSpots: [],
      routes: [],
      user: {
        _type: 'reference',
        _ref: user._id,
      },
    };

    const result = await client.create(tripDoc);

    return NextResponse.json({
      success: true,
      trip: result,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({error: 'Failed to create trip'}, {status: 500});
  }
}
