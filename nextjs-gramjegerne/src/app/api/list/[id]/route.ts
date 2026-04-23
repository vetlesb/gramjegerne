import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';
import {handleApiError} from '@/lib/errorHandler';
import {nanoid} from 'nanoid';
import type {NextRequest} from 'next/server';

interface UpdateData {
  name?: string;
  weight?: number;
  image?: {
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
    };
  } | null;
  connectedMap?: {
    _type: 'reference';
    _ref: string;
  } | null;
  connectedTrips?: Array<{
    _key: string;
    _type: 'reference';
    _ref: string;
  }> | null;
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
        weight,
        image,
        "connectedMap": connectedMap->{
          _id,
          name,
          slug
        },
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
    const updateData: UpdateData = {};

    // Handle basic fields
    const name = formData.get('name');
    if (name) updateData.name = name.toString();

    const weight = formData.get('weight');
    if (weight) updateData.weight = parseFloat(weight.toString());

    // Handle connected map
    const connectedMapId = formData.get('connectedMapId');
    if (connectedMapId) {
      updateData.connectedMap = {
        _type: 'reference',
        _ref: connectedMapId.toString(),
      };
    } else if (connectedMapId === '') {
      updateData.connectedMap = null;
    }

    // Handle connected trip
    const connectedTripId = formData.get('connectedTripId');
    if (connectedTripId) {
      updateData.connectedTrips = [
        {
          _key: nanoid(),
          _type: 'reference',
          _ref: connectedTripId.toString(),
        },
      ];
    } else if (connectedTripId === '') {
      updateData.connectedTrips = null;
    }

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
