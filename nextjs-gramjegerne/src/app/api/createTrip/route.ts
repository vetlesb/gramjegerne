import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;
    const categoryId = formData.get('categoryId') as string | null;
    const imageFile = formData.get('image') as File | null;
    const mapsRestrictedToOwner = formData.get('mapsRestrictedToOwner') === 'true';

    if (!name) {
      return NextResponse.json({error: 'Name is required'}, {status: 400});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = `${baseSlug}-${user._id}`;

    // Handle image upload
    let imageAsset = null;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageData = await client.assets.upload('image', buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      imageAsset = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: imageData._id,
        },
      };
    }

    // Create the trip document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tripDoc: any = {
      _type: 'trip',
      name,
      slug: {_type: 'slug', current: slug},
      description: description || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      image: imageAsset || undefined,
      user: {
        _type: 'reference',
        _ref: user._id,
      },
      isShared: false,
      mapsRestrictedToOwner,
    };

    if (categoryId) {
      tripDoc.category = {_type: 'reference', _ref: categoryId};
    }

    const result = await client.create(tripDoc);

    return NextResponse.json({
      success: true,
      trip: result,
    });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json({error: 'Failed to create trip'}, {status: 500});
  }
}
