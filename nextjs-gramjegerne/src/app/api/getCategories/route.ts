// src/app/api/getCategories/route.ts

import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session?.user?.id) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }

    const categories = await client.fetch(
      `*[_type == "category" && user._ref == $userId]{
        _id,
        title,
        slug
      }`,
      {userId: session.user.id},
    );

    return NextResponse.json(categories, {status: 200});
  } catch (error: unknown) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error fetching categories:', error);
    return NextResponse.json({message: 'Failed to fetch categories.'}, {status: 500});
  }
}
