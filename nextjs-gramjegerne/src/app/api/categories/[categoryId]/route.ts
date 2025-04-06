import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {client} from '@/sanity/client';
import {authOptions} from '@/app/api/auth/[...nextauth]/auth';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const categoryId = request.nextUrl.pathname.split('/').pop();
    if (!categoryId) {
      return NextResponse.json({error: 'Missing categoryId'}, {status: 400});
    }

    const {title} = await request.json();

    const userId = session.user.id.startsWith('google_')
      ? session.user.id
      : `google_${session.user.id}`;

    // Verify category belongs to user
    const categoryCheck = await client.fetch(
      `*[_type == "category" && _id == $categoryId && user._ref == $userId][0]._id`,
      {categoryId, userId},
    );

    if (!categoryCheck) {
      return NextResponse.json({error: 'Category not found or unauthorized'}, {status: 404});
    }

    const updatedCategory = await client.patch(categoryId).set({title}).commit();

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({error: 'Failed to update category'}, {status: 500});
  }
}
