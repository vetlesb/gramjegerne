import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '../auth/[...nextauth]/auth';
import {client} from '@/sanity/client';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const contentType = request.headers.get('content-type') || '';

    let tripId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updates: any;

    if (contentType.includes('multipart/form-data')) {
      // FormData from AddTripDialog
      const formData = await request.formData();
      tripId = formData.get('tripId') as string;

      updates = {} as Record<string, unknown>;
      const name = formData.get('name') as string | null;
      if (name) updates.name = name;

      const description = formData.get('description') as string | null;
      if (description !== null) updates.description = description || undefined;

      const startDate = formData.get('startDate') as string | null;
      if (startDate !== null) updates.startDate = startDate || undefined;

      const endDate = formData.get('endDate') as string | null;
      if (endDate !== null) updates.endDate = endDate || undefined;

      const categoryId = formData.get('categoryId') as string | null;
      if (categoryId) {
        updates.category = {_type: 'reference', _ref: categoryId};
      }

      const mapsRestrictedRaw = formData.get('mapsRestrictedToOwner');
      if (mapsRestrictedRaw !== null) {
        updates.mapsRestrictedToOwner = mapsRestrictedRaw === 'true';
      }

      // Handle image
      const imageFile = formData.get('image') as File | null;
      const keepExistingImage = formData.get('keepExistingImage') === 'true';

      if (imageFile && !keepExistingImage) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imageData = await client.assets.upload('image', buffer, {
          filename: imageFile.name,
          contentType: imageFile.type,
        });
        updates.image = {
          _type: 'image',
          asset: {_type: 'reference', _ref: imageData._id},
        };
      }
    } else {
      // JSON from TripShareButton or other callers
      const body = await request.json();
      tripId = body.tripId;
      updates = body.updates;
    }

    if (!tripId) {
      return NextResponse.json({error: 'Trip ID is required'}, {status: 400});
    }

    // Get user reference from Sanity
    const userQuery = `*[_type == "user" && email == $email][0]`;
    const user = await client.fetch(userQuery, {email: session.user.email});

    if (!user) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    // Verify the trip belongs to the user
    const existingTripQuery = `*[_type == "trip" && _id == $tripId && user._ref == $userId][0]`;
    const existingTrip = await client.fetch(existingTripQuery, {
      tripId,
      userId: user._id,
    });

    if (!existingTrip) {
      return NextResponse.json({error: 'Trip not found'}, {status: 404});
    }

    // Update the trip
    const result = await client.patch(tripId).set(updates).commit();

    return NextResponse.json({
      success: true,
      trip: result,
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json({error: 'Failed to update trip'}, {status: 500});
  }
}
