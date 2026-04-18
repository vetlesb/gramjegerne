import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {handleApiError} from '@/lib/errorHandler';
import {getUserSession} from '@/lib/auth-helpers';

export async function DELETE(request: Request) {
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
      `*[_type == "item" && _id == $itemId && user._ref == $userId][0]`,
      {itemId, userId: session.user.id},
    );

    if (!item) {
      return NextResponse.json({message: 'Item not found or unauthorized'}, {status: 404});
    }

    // Find all lists that reference this item
    const lists = await client.fetch(
      `*[_type == "list" && user._ref == $userId && references($itemId)]{
        _id,
        items
      }`,
      {itemId, userId: session.user.id},
    );

    // Remove the item from all lists before deleting
    if (lists.length > 0) {
      const transaction = client.transaction();

      lists.forEach((list: {_id: string; items: Array<{item: {_ref: string}}>}) => {
        const updatedItems = list.items.filter((listItem) => listItem.item._ref !== itemId);
        transaction.patch(list._id, {
          set: {items: updatedItems},
        });
      });

      await transaction.commit();
    }

    // Now delete the item
    await client.delete(itemId);
    return NextResponse.json({message: 'Item deleted successfully'}, {status: 200});
  } catch (error: unknown) {
    return handleApiError(error, 'Error deleting item:', 'Could not delete gear.');
  }
}
