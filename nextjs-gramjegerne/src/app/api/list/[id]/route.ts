import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';
import {handleApiError} from '@/lib/errorHandler';
import type {NextRequest} from 'next/server';

interface UpdateData {
  name?: string;
  days?: number;
  participants?: number;
  weight?: number;
  image?: {
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
    };
  } | null;
  completed: boolean;
  [key: string]: unknown;
}

export async function PATCH(request: NextRequest) {
  let listId: string | undefined;
  let userId: string | undefined;

  try {
    const session = await getUserSession();
    userId = session?.user?.id;

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {pathname} = request.nextUrl;
    listId = pathname.split('/').pop();

    if (!listId) {
      return NextResponse.json({message: 'Invalid or missing list ID.'}, {status: 400});
    }

    // Use a transaction for better performance
    const transaction = client.transaction();

    // Verify list belongs to user and get current state
    const list = await client.fetch(
      `*[_type == "list" && _id == $id && user._ref == $userId][0]{
        _id,
        _type,
        name,
        days,
        participants,
        weight,
        image,
        completed,
        items
      }`,
      {
        id: listId,
        userId: userId,
      },
    );

    if (!list) {
      return NextResponse.json({message: 'List not found or unauthorized'}, {status: 404});
    }

    const formData = await request.formData();
    const updateData: UpdateData = {
      completed: formData.get('completed') === 'true',
    };

    // Handle basic fields
    const name = formData.get('name');
    if (name) updateData.name = name.toString();

    const days = formData.get('days');
    if (days) updateData.days = parseInt(days.toString(), 10);

    const participants = formData.get('participants');
    if (participants) updateData.participants = parseInt(participants.toString(), 10);

    const weight = formData.get('weight');
    if (weight) updateData.weight = parseFloat(weight.toString());

    // Handle image upload
    const image = formData.get('image');
    const keepExistingImage = formData.get('keepExistingImage') === 'true';

    if (image && !keepExistingImage) {
      const arrayBuffer = await (image as File).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const imageData = await client.assets.upload('image', buffer, {
        filename: (image as File).name,
        contentType: (image as File).type,
      });

      updateData.image = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageData._id,
        },
      };
    } else if (keepExistingImage) {
      updateData.image = list.image;
    }

    // Update the document using the transaction
    transaction.patch(listId, {
      set: updateData,
    });

    // Commit the transaction
    await transaction.commit();

    return NextResponse.json({message: 'List updated successfully'});
  } catch (error) {
    return handleApiError(error, 'Error updating list', `List ID: ${listId}, User ID: ${userId}`);
  }
}
