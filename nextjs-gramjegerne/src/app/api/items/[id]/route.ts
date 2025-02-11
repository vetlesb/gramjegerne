import {NextResponse} from 'next/server';
import {handleApiError} from '@/lib/errorHandler';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';
import type {NextRequest} from 'next/server';

// Define interfaces for type safety
interface UpdateData {
  name: string | null;
  slug: string | null;
  category?: {
    _type: 'reference';
    _ref: string;
  };
  size?: string;
  weight?: {
    weight: number;
    unit: string;
  };
  calories?: number;
  image?: {
    _type: 'image';
    asset: {
      _type: 'reference';
      _ref: string;
    };
  };
  [key: string]: unknown;
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const {pathname} = request.nextUrl;
    const id = pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({message: 'Invalid or missing item ID.'}, {status: 400});
    }

    const userId = session.user.id;

    // Verify item belongs to user
    const item = await client.fetch(`*[_type == "item" && _id == $id && user._ref == $userId][0]`, {
      id,
      userId,
    });

    if (!item) {
      return NextResponse.json({message: 'Item not found or unauthorized'}, {status: 404});
    }

    const formData = await request.formData();
    const updateData: UpdateData = {
      name: formData.get('name')?.toString() ?? null,
      slug: formData.get('slug')?.toString() ?? null,
    };

    // Handle categories
    const category = formData.get('category');
    if (category) {
      updateData.category = {
        _type: 'reference',
        _ref: category.toString(),
      };
    }

    // Handle optional fields
    const size = formData.get('size');
    if (size) updateData.size = size.toString();

    const weightValue = formData.get('weight.weight');
    const weightUnit = formData.get('weight.unit');
    if (weightValue && weightUnit) {
      updateData.weight = {
        weight: parseFloat(weightValue.toString()),
        unit: weightUnit.toString(),
      };
    }

    const calories = formData.get('calories');
    if (calories) updateData.calories = parseInt(calories.toString(), 10);

    // Handle image upload
    const image = formData.get('image');
    if (image instanceof File) {
      try {
        const imageBuffer = Buffer.from(await image.arrayBuffer());
        const imageAsset = await client.assets.upload('image', imageBuffer, {
          filename: image.name,
          contentType: image.type,
        });

        updateData.image = {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id,
          },
        };
      } catch (imageError) {
        console.error('Error uploading image:', imageError);
      }
    }

    const updatedItem = await client.patch(id).set(updateData).commit();
    return NextResponse.json(updatedItem, {status: 200});
  } catch (error: unknown) {
    return handleApiError(error, 'Error updating item:', 'Kunne ikke oppdatere utstyr.');
  }
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession();

    const id = request.url.split('/').pop();

    if (!session?.user?.id) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    if (!id) {
      return NextResponse.json({message: 'Invalid or missing item ID.'}, {status: 400});
    }

    // Fetch item with user verification, using the formatted userId
    const item = await client.fetch(`*[_type == "item" && _id == $id && user._ref == $userId][0]`, {
      id,
      userId: session.user.id, // getUserSession already formats this
    });

    if (!item) {
      return NextResponse.json({message: 'Item not found or unauthorized'}, {status: 404});
    }

    return NextResponse.json(item, {status: 200});
  } catch (error: unknown) {
    return handleApiError(error, 'Error fetching item:', 'Kunne ikke hente utstyr.');
  }
}
