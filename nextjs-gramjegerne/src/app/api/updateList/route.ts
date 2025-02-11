import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';

export async function PUT(request: Request) {
  try {
    const session = await getUserSession();
    console.log('User session:', session);

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {listId, items} = await request.json();
    console.log('Incoming request data:', {listId, items});

    if (!listId) {
      return NextResponse.json({error: 'List ID is required'}, {status: 400});
    }

    // Verify list belongs to user
    const list = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]`,
      {listId, userId: session.user.id},
    );

    console.log('Fetched list:', list);

    if (!list) {
      return NextResponse.json({error: 'List not found or unauthorized'}, {status: 404});
    }

    console.log('Updating list:', listId);
    console.log('With items:', items);

    // Validate input
    if (!Array.isArray(items)) {
      return NextResponse.json({success: false, error: 'Invalid input'}, {status: 400});
    }

    // Update items in the list
    const result = await client
      .patch(listId)
      .set({items}) // This will replace the items array
      .commit();

    console.log('Sanity update result:', result);

    return NextResponse.json({success: true, result});
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({success: false, error: (error as Error).message}, {status: 500});
  }
}
