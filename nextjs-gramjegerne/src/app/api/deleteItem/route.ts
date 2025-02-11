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

    // Check for references
    const references = await client.fetch(`*[references($itemId)]`, {itemId});

    if (references.length > 0) {
      return NextResponse.json(
        {
          message:
            'Dette utstyret er i bruk i en eller flere lister. Fjern utstyret fra listene før du sletter det.',
          references: references,
        },
        {status: 409},
      );
    }

    await client.delete(itemId);
    return NextResponse.json({message: 'Item deleted successfully'}, {status: 200});
  } catch (error: unknown) {
    return handleApiError(error, 'Error deleting item:', 'Kunne ikke slette utstyr.');
  }
}
