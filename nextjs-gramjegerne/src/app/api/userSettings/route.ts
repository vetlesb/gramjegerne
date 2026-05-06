import {NextResponse} from 'next/server';
import {client} from '@/lib/sanity';
import {getUserSession} from '@/lib/auth-helpers';

const emptySettings = {
  theme: null,
  language: null,
  currency: null,
  gearImagesEnabled: null,
  packingListImagesEnabled: null,
};

export async function GET() {
  try {
    const session = await getUserSession();

    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{theme, language, currency, gearImagesEnabled, packingListImagesEnabled}`,
      {userId: session.user.id},
    );

    return NextResponse.json({
      theme: user?.theme || null,
      language: user?.language || null,
      currency: user?.currency || null,
      gearImagesEnabled: user?.gearImagesEnabled ?? null,
      packingListImagesEnabled: user?.packingListImagesEnabled ?? null,
    });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json(emptySettings);
    }
    console.error('Error fetching user settings:', error);
    return NextResponse.json(emptySettings);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getUserSession();
    const body = await request.json();

    const updates: Record<string, string | boolean> = {};
    if (body.theme !== undefined) updates.theme = body.theme;
    if (body.language !== undefined) updates.language = body.language;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.gearImagesEnabled !== undefined)
      updates.gearImagesEnabled = !!body.gearImagesEnabled;
    if (body.packingListImagesEnabled !== undefined)
      updates.packingListImagesEnabled = !!body.packingListImagesEnabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({message: 'No settings to update'}, {status: 400});
    }

    await client.patch(session.user.id).set(updates).commit();

    return NextResponse.json({success: true});
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      return NextResponse.json({message: 'Unauthorized'}, {status: 401});
    }
    console.error('Error saving user settings:', error);
    return NextResponse.json({message: 'Failed to save settings'}, {status: 500});
  }
}
