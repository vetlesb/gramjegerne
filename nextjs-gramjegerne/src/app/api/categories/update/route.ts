import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {client} from '@/sanity/client';
import {authOptions} from '@/app/api/auth/[...nextauth]/auth';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', {status: 401});
    }

    const {categoryId, title} = await request.json();

    const updatedCategory = await client.patch(categoryId).set({title}).commit();

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return new NextResponse('Failed to update category', {status: 500});
  }
}
