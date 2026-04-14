import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {tripId, categoryId} = await request.json();

    if (!tripId) {
      return NextResponse.json({error: 'Trip ID is required'}, {status: 400});
    }

    const rawGoogleId = session.user.id.replace('google_', '');

    const user = await client.fetch(`*[_type == "user" && googleId == $googleId][0]`, {
      googleId: rawGoogleId,
    });

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    const sharedTrips = user.sharedTrips || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = sharedTrips.map((entry: any) => {
      if (entry.trip?._ref === tripId) {
        return {
          ...entry,
          category: categoryId
            ? {_type: 'reference', _ref: categoryId}
            : undefined,
        };
      }
      return entry;
    });

    await client.patch(user._id).set({sharedTrips: updated}).commit();

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error updating shared trip category:', error);
    return NextResponse.json({error: 'Internal server error'}, {status: 500});
  }
}
