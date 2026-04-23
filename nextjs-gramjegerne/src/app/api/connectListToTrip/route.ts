import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';
import {nanoid} from 'nanoid';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {listId, tripId} = body;

    if (!listId || !tripId) {
      return NextResponse.json({error: 'List ID and Trip ID are required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the list belongs to the user
    const list = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]{ _id, connectedTrips }`,
      {listId, userId: user._id},
    );

    if (!list) {
      return NextResponse.json({error: 'List not found or unauthorized'}, {status: 404});
    }

    // Check if already connected to this trip
    const alreadyConnected = list.connectedTrips?.some(
      (ref: {_ref: string}) => ref._ref === tripId,
    );
    if (alreadyConnected) {
      return NextResponse.json({success: true});
    }

    // Append trip reference to connectedTrips array
    await client
      .patch(listId)
      .setIfMissing({connectedTrips: []})
      .append('connectedTrips', [
        {
          _key: nanoid(),
          _type: 'reference',
          _ref: tripId,
        },
      ])
      .commit();

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error connecting list to trip:', error);
    return NextResponse.json({error: 'Failed to connect list to trip'}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {listId, tripId} = body;

    if (!listId || !tripId) {
      return NextResponse.json({error: 'List ID and Trip ID are required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the list belongs to the user
    const list = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]{ _id, connectedTrips }`,
      {listId, userId: user._id},
    );

    if (!list) {
      return NextResponse.json({error: 'List not found or unauthorized'}, {status: 404});
    }

    // Remove the specific trip reference from the array
    const keysToRemove = (list.connectedTrips || [])
      .filter((ref: {_ref: string; _key: string}) => ref._ref === tripId)
      .map((ref: {_key: string}) => `connectedTrips[_key=="${ref._key}"]`);

    if (keysToRemove.length > 0) {
      await client.patch(listId).unset(keysToRemove).commit();
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error disconnecting list from trip:', error);
    return NextResponse.json({error: 'Failed to disconnect list from trip'}, {status: 500});
  }
}
