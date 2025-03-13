import {client} from '@/sanity/client';

interface UserData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  googleId: string;
}

interface SanityUser {
  _id: string;
  _type: 'user';
  name?: string | null;
  email?: string | null;
  image?: string | null;
  googleId: string;
}

export async function createOrGetUser(userData: UserData): Promise<SanityUser> {
  const userId = `google_${userData.googleId}`;

  // Check if user exists
  const existingUser = await client.fetch<SanityUser>(`*[_type == "user" && _id == $userId][0]`, {
    userId,
  });

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const newUser = await client.create<SanityUser>({
    _type: 'user',
    _id: userId,
    name: userData.name,
    email: userData.email,
    image: userData.image,
    googleId: userData.googleId,
  });

  // Create sample data for new users
  const categories = await Promise.all([
    client.create({
      _type: 'category',
      title: 'Klær',
      user: {_type: 'reference', _ref: userId},
    }),
    client.create({
      _type: 'category',
      title: 'Mat',
      user: {_type: 'reference', _ref: userId},
    }),
    client.create({
      _type: 'category',
      title: 'Utstyr',
      user: {_type: 'reference', _ref: userId},
    }),
  ]);

  // Create sample items
  const items = await Promise.all([
    client.create({
      _type: 'item',
      name: 'Rab Microlight Alpine Jacket',
      size: 'XL',
      weight: {weight: 200, unit: 'g'},
      category: {_type: 'reference', _ref: categories[0]._id},
      user: {_type: 'reference', _ref: userId},
    }),
    client.create({
      _type: 'item',
      name: 'Real Turmat Pasta Bolognese',
      weight: {weight: 140, unit: 'g'},
      calories: 600,
      category: {_type: 'reference', _ref: categories[1]._id},
      user: {_type: 'reference', _ref: userId},
    }),
    client.create({
      _type: 'item',
      name: 'Therm-A-Rest Lite Liggeunderlag',
      weight: {weight: 410, unit: 'g'},
      category: {_type: 'reference', _ref: categories[2]._id},
      user: {_type: 'reference', _ref: userId},
    }),
  ]);

  // Create a sample packing list
  await client.create({
    _type: 'list',
    name: 'Eksempel på pakkeliste',
    slug: {
      _type: 'slug',
      current: 'eksempel-pa-pakkeliste',
    },
    days: 2,
    participants: 1,
    user: {_type: 'reference', _ref: userId},
    items: [
      {
        _type: 'listItem',
        item: {_type: 'reference', _ref: items[0]._id},
        quantity: 1,
        onBody: true,
      },
      {
        _type: 'listItem',
        item: {_type: 'reference', _ref: items[1]._id},
        quantity: 2,
      },
      {
        _type: 'listItem',
        item: {_type: 'reference', _ref: items[2]._id},
        quantity: 1,
      },
    ],
  });

  return newUser;
}
