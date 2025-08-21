import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

interface SharedListRef {
  _key: string;
  list: {
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

    const {listId} = await request.json();

    if (!listId) {
      return NextResponse.json({error: 'List ID is required'}, {status: 400});
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

    // Check if the list is already in shared lists
    const existingSharedList = user.sharedLists?.find(
      (shared: SharedListRef) => shared.list._ref === listId,
    );

    if (existingSharedList) {
      return NextResponse.json({error: 'List already in shared lists'}, {status: 400});
    }

    // Get the list details to include user info
    const list = await client.fetch(
      `*[_type == "list" && _id == $listId][0] {
        _id,
        name,
        slug,
        "user": user->{
          _id,
          name,
          email
        }
      }`,
      {listId},
    );

    if (!list) {
      return NextResponse.json({error: 'List not found'}, {status: 404});
    }

    // Add the list to shared lists with a unique key
    const sharedListRef = {
      _type: 'object',
      _key: `shared_${listId}_${Date.now()}`, // Generate unique key
      list: {
        _type: 'reference',
        _ref: listId,
      },
      addedAt: new Date().toISOString(),
    };

    // Use set instead of append to ensure no duplicates
    const currentSharedLists = user.sharedLists || [];

    // Remove any existing references to this list (in case of duplicates)
    const filteredSharedLists = currentSharedLists.filter(
      (shared: SharedListRef) => shared.list._ref !== listId,
    );

    const updatedSharedLists = [...filteredSharedLists, sharedListRef];

    const updatedUser = await client
      .patch(user._id)
      .set({sharedLists: updatedSharedLists})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error adding shared list:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
