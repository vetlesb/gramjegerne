import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {searchParams} = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({message: 'Item ID is required'}, {status: 400});
    }

    // Verify item belongs to user
    const item = await client.fetch(
      `*[_type == "item" && _id == $itemId && user._ref == $userId][0]{
        _id,
        name
      }`,
      {itemId, userId: session.user.id},
    );

    if (!item) {
      return NextResponse.json({message: 'Item not found or unauthorized'}, {status: 404});
    }

    // Find all lists that reference this item
    const lists = await client.fetch(
      `*[_type == "list" && user._ref == $userId && references($itemId)]{
        _id,
        name,
        slug
      }`,
      {itemId, userId: session.user.id},
    );

    return NextResponse.json({
      itemName: item.name,
      lists: lists,
    });
  } catch (error: unknown) {
    console.error('Error checking item usage:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to check item usage',
      },
      {status: 500},
    );
  }
}

