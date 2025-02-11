// src/app/api/items/route.ts

import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession, formatUserId} from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const userId = formatUserId(session.user.id);

    // Fetch items for the authenticated user
    const items = await client.fetch(
      `*[_type == "item" && user._ref == $userId]{
        _id,
        name,
        slug,
        image{
          asset->{
            _ref,
            url
          }
        },
        "category": category->{_id, title},
        size,
        weight,
        quantity,
        calories
      }`,
      {userId},
    );

    return NextResponse.json(items, {status: 200});
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error fetching items:', error);
    return NextResponse.json({message: 'Failed to fetch items.'}, {status: 500});
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession();

    if (!session || !session.user) {
      return new Response(JSON.stringify({message: 'Unauthorized'}), {
        status: 401,
      });
    }

    const userId = formatUserId(session.user.id);

    const formData = await request.formData();

    const name = formData.get('name') as string;
    const slug =
      (formData.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-').slice(0, 200);
    const imageFile = formData.get('image') as File | null;
    const categoryId = formData.get('category') as string;
    const size = formData.get('size') as string;
    const weight_weight = formData.get('weight.weight') as string;
    const weight_unit = formData.get('weight.unit') as string;
    const quantity = formData.get('quantity') as string;
    const calories = formData.get('calories') as string;

    if (!name || !slug) {
      return NextResponse.json({message: 'Navn og slug er obligatorisk.'}, {status: 400});
    }

    // Verify category exists
    const category = await client.fetch(`*[_type == "category" && _id == $categoryId][0]`, {
      categoryId,
    });

    if (!category) {
      return NextResponse.json({message: 'Invalid category.'}, {status: 400});
    }

    let imageAsset: string | undefined = undefined;
    if (imageFile) {
      const imageResponse = await client.assets.upload('image', imageFile, {
        filename: imageFile.name,
      });
      imageAsset = imageResponse._id;
    }

    const newItem = {
      _type: 'item',
      name,
      slug: {_type: 'slug', current: slug},
      ...(imageAsset && {
        image: {_type: 'image', asset: {_ref: imageAsset}},
      }),
      category: {_type: 'reference', _ref: categoryId},
      user: {_type: 'reference', _ref: userId},
      size,
      weight: {
        weight: Number(weight_weight),
        unit: weight_unit,
      },
      quantity: Number(quantity),
      calories: Number(calories),
    };

    const createdItem = await client.create(newItem);
    return NextResponse.json(createdItem, {status: 201});
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error creating item:', error);
    return NextResponse.json({message: 'Failed to create item.'}, {status: 500});
  }
}
