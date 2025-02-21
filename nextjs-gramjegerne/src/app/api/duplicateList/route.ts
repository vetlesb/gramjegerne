import {client} from '@/sanity/client';
import {getUserSession} from '@/lib/auth-helpers';
import {nanoid} from 'nanoid';

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {listId} = await request.json();
    if (!listId) {
      return new Response('List ID is required', {status: 400});
    }

    // Fetch the original list and verify ownership
    const originalList = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]`,
      {listId, userId: session.user.id},
    );

    if (!originalList) {
      return new Response('List not found or unauthorized', {status: 404});
    }

    // Create a new slug
    const baseSlug = originalList.slug.current;
    const newSlug = `${baseSlug}-${nanoid(6)}`;

    // Create the new list document
    const newList = {
      _type: 'list',
      name: `${originalList.name} (kopi)`,
      slug: {
        _type: 'slug',
        current: newSlug,
      },
      days: originalList.days,
      participants: originalList.participants,
      image: originalList.image,
      items: originalList.items,
      user: {
        _type: 'reference',
        _ref: session.user.id,
      },
    };

    // Create the new list in Sanity
    const result = await client.create(newList);

    return new Response(
      JSON.stringify({
        message: 'List duplicated successfully',
        _id: result._id,
        slug: newSlug,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error duplicating list:', error);
    return new Response(JSON.stringify({message: 'Failed to duplicate list'}), {status: 500});
  }
}
