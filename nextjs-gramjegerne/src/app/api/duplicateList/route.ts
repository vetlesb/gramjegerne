import {client} from '@/sanity/client';
import {getUserSession} from '@/lib/auth-helpers';
import {nanoid} from 'nanoid';
import {slugify} from '@/utils/slugify';

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {listId, name} = await request.json();
    if (!listId) {
      return new Response('List ID is required', {status: 400});
    }
    if (!name || !name.trim()) {
      return new Response('Name is required', {status: 400});
    }

    // Fetch the original list and verify ownership
    const originalList = await client.fetch(
      `*[_type == "list" && _id == $listId && user._ref == $userId][0]`,
      {listId, userId: session.user.id},
    );

    if (!originalList) {
      return new Response('List not found or unauthorized', {status: 404});
    }

    // Generate slug following the same pattern as createList
    const fullUserId = session.user.id.startsWith('google_')
      ? session.user.id.slice(7) // Remove 'google_'
      : session.user.id;

    const shortUserId = fullUserId.slice(-6);
    const baseSlug = slugify(name.trim());
    let newSlug = `${baseSlug}-${shortUserId}`;

    // Check if slug already exists for this user and append nanoid if needed
    const existingList = await client.fetch(
      `*[_type == "list" && slug.current == $slug && user._ref == $userId][0]`,
      {slug: newSlug, userId: session.user.id},
    );

    if (existingList) {
      // Append nanoid to ensure uniqueness
      newSlug = `${newSlug}-${nanoid(6)}`;
    }

    // Create the new list document
    const newList = {
      _type: 'list',
      name: name.trim(),
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
