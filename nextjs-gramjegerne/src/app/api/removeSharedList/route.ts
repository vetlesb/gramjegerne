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

export async function DELETE(request: NextRequest) {
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

    // Find the index of the shared list to remove
    const sharedListIndex = user.sharedLists?.findIndex(
      (shared: SharedListRef) => shared.list._ref === listId,
    );

    if (sharedListIndex === -1 || sharedListIndex === undefined) {
      return NextResponse.json({error: 'Shared list not found'}, {status: 404});
    }

    // Remove the list from shared lists using replace
    const updatedSharedLists = user.sharedLists.filter(
      (shared: SharedListRef) => shared.list._ref !== listId,
    );

    const updatedUser = await client
      .patch(user._id)
      .set({sharedLists: updatedSharedLists})
      .commit();

    return NextResponse.json({success: true, user: updatedUser});
  } catch (error) {
    console.error('Error removing shared list:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
