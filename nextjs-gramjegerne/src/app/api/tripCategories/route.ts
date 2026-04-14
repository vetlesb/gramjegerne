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
