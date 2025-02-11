import {client} from '@/sanity/client';

interface UserData {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  googleId: string;
}

export async function createOrGetUser(userData: UserData) {
  const userId = `google_${userData.googleId}`;

  // Check if user exists
  const existingUser = await client.fetch(`*[_type == "user" && _id == $userId][0]`, {userId});

  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const newUser = await client.create({
    _type: 'user',
    _id: userId,
    name: userData.name,
    email: userData.email,
    image: userData.image,
    googleId: userData.googleId,
  });

  return newUser;
}
