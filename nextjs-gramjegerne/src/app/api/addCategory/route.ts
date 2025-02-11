import {client} from '@/sanity/client';
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({error: 'Not authenticated'}, {status: 401});
    }

    const {title} = await request.json();

    // Format the user ID consistently
    const userId = session.user.id.startsWith('google_')
      ? session.user.id
      : `google_${session.user.id}`;

    console.log('Creating category with userId:', userId);

    // Create category with formatted user reference
    const category = await client.create({
      _type: 'category',
      title,
      user: {
        _type: 'reference',
        _ref: userId,
      },
    });

    console.log('Created category:', category);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Detailed error creating category:', error);
    return NextResponse.json({error: 'Failed to create category', details: error}, {status: 500});
  }
}
