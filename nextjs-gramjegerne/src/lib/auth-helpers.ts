import {getServerSession} from 'next-auth';
import {authOptions} from '@/app/api/auth/[...nextauth]/auth';

export async function getSession() {
  return await getServerSession(authOptions);
}

export function formatUserId(id: string) {
  return id.startsWith('google_') ? id : `google_${id}`;
}

export async function getUserSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({message: 'Unauthorized'}), {
      status: 401,
    });
  }

  // Always return session with formatted user ID
  return {
    ...session,
    user: {
      ...session.user,
      id: formatUserId(session.user.id),
    },
  };
}
