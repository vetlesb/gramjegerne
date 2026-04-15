import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    const categoriesQuery = `*[_type == "tripCategory" && user._ref == $userId] | order(title asc) {
      _id,
      title,
      slug
    }`;

    const categories = await client.fetch(categoriesQuery, {userId: user._id});

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching trip categories:', error);
    return NextResponse.json({error: 'Failed to fetch trip categories'}, {status: 500});
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {categoryId, title} = await request.json();

    if (!categoryId || !title) {
      return NextResponse.json({error: 'Category ID and title are required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify category belongs to user
    const category = await client.fetch(
      `*[_type == "tripCategory" && _id == $categoryId && user._ref == $userId][0]{_id}`,
      {categoryId, userId: user._id},
    );

    if (!category) {
      return NextResponse.json({error: 'Category not found'}, {status: 404});
    }

    await client.patch(categoryId).set({title}).commit();

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error updating trip category:', error);
    return NextResponse.json({error: 'Failed to update trip category'}, {status: 500});
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {searchParams} = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({error: 'Category ID is required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify category belongs to user
    const category = await client.fetch(
      `*[_type == "tripCategory" && _id == $categoryId && user._ref == $userId][0]{_id}`,
      {categoryId, userId: user._id},
    );

    if (!category) {
      return NextResponse.json({error: 'Category not found'}, {status: 404});
    }

    // Unset category references on trips that use this category
    const tripsUsing = await client.fetch(
      `*[_type == "trip" && category._ref == $categoryId]._id`,
      {categoryId},
    );
    for (const tripId of tripsUsing) {
      await client.patch(tripId).unset(['category']).commit();
    }

    // Unset category references in users' sharedTrips entries
    const usersWithShared = await client.fetch(
      `*[_type == "user" && count(sharedTrips[category._ref == $categoryId]) > 0]{_id, sharedTrips}`,
      {categoryId},
    );
    for (const u of usersWithShared) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = (u.sharedTrips || []).map((entry: any) => {
        if (entry.category?._ref === categoryId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {category, ...rest} = entry;
          return rest;
        }
        return entry;
      });
      await client.patch(u._id).set({sharedTrips: updated}).commit();
    }

    await client.delete(categoryId);

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error deleting trip category:', error);
    return NextResponse.json({error: 'Failed to delete trip category'}, {status: 500});
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {title} = body;

    if (!title) {
      return NextResponse.json({error: 'Title is required'}, {status: 400});
    }

    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[æå]/g, 'a')
      .replace(/[ø]/g, 'o')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 96);

    const categoryDoc = {
      _type: 'tripCategory',
      title,
      slug: {_type: 'slug', current: slug},
      user: {
        _type: 'reference',
        _ref: user._id,
      },
    };

    const result = await client.create(categoryDoc);

    return NextResponse.json({
      _id: result._id,
      title,
      slug: {current: slug},
    });
  } catch (error) {
    console.error('Error creating trip category:', error);
    return NextResponse.json({error: 'Failed to create trip category'}, {status: 500});
  }
}
