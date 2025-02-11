import type {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {createOrGetUser} from '@/lib/auth';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({user, account}) {
      if (!account || account.provider !== 'google') return false;

      try {
        await createOrGetUser({
          name: user.name,
          email: user.email,
          image: user.image,
          googleId: account.providerAccountId,
        });
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({session, token}) {
      if (session?.user) {
        session.user.id = `google_${token.sub}`;
      }
      return session;
    },
    async jwt({token, account}) {
      if (account) {
        token.userId = account.providerAccountId;
      }
      return token;
    },
  },
};
