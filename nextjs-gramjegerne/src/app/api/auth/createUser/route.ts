import {client} from '@/sanity/client';
import {NextResponse} from 'next/server';
import {formatUserId} from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const {name, email, id} = await request.json();
    const formattedId = formatUserId(id);

    const newUser = await client.create({
      _type: 'user',
      _id: formattedId,
      name,
      email,
      googleId: id.replace('google_', ''), // Store the raw Google ID
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error in createUser:', error);
    return NextResponse.json({error: 'Failed to create user', details: error}, {status: 500});
  }
}
