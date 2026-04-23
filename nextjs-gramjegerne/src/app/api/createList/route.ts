// app/api/createList/route.ts
import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
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

    const fullUserId = session.user.id.startsWith('google_')
      ? session.user.id.slice(7) // Remove 'google_'
      : session.user.id;

    const shortUserId = fullUserId.slice(-6);

    const formData = await request.formData();

    const name = formData.get('name') as string;
    const image = formData.get('image') as File | null;
    const weight = formData.get('weight') ? parseInt(formData.get('weight') as string) : null;
    const connectedMapId = formData.get('connectedMapId') as string | null;
    const connectedTripId = formData.get('connectedTripId') as string | null;

    // Validate required fields
    if (!name) {
      return NextResponse.json({error: 'Name is required'}, {status: 400});
    }

    // Prepare slug with user ID
    const baseSlug = slugify(name);
    const uniqueSlug = `${baseSlug}-${shortUserId}`;

    // Prepare image asset if provided
    let imageAsset = null;
    if (image) {
      // Convert the File object to a Buffer
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload the image buffer to Sanity
      const imageData = await client.assets.upload('image', buffer, {
        filename: image.name,
        contentType: image.type,
      });

      imageAsset = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageData._id,
        },
      };
    }

    // Create new list document with user reference and unique slug
    const fullUserRef = session.user.id.startsWith('google_')
      ? session.user.id
      : `google_${session.user.id}`;

    const newList = {
      _type: 'list',
      _id: nanoid(),
      name,
      slug: {
        _type: 'slug',
        current: uniqueSlug,
      },
      image: imageAsset,
      weight,
      items: [],
      user: {
        _type: 'reference',
        _ref: fullUserRef,
      },
      ...(connectedMapId && {
        connectedMap: {
          _type: 'reference',
          _ref: connectedMapId,
        },
      }),
      ...(connectedTripId && {
        connectedTrips: [
          {
            _key: nanoid(),
            _type: 'reference',
            _ref: connectedTripId,
          },
        ],
      }),
    };

    await client.create(newList);
    return NextResponse.json({message: 'List created successfully'}, {status: 201});
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error creating list:', error);
    return NextResponse.json(
      {error: error instanceof Error ? error.message : 'Unknown error'},
      {status: 500},
    );
  }
}
