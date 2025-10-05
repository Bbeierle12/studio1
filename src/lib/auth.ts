import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { prisma } from '@/lib/data';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' }, // login or signup
        name: { label: 'Name', type: 'text' }, // for signup
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password, action, name } = credentials;

        try {
          if (action === 'signup') {
            // Registration is now handled by the /api/register endpoint
            // This branch should not be used anymore
            throw new Error('Please use the registration form');
          } else {
            // Login existing user
            const user = await prisma.user.findUnique({
              where: { email: email.toLowerCase().trim() },
            });

            if (!user) {
              return null;
            }

            const isPasswordValid = await compare(password, user.password);
            if (!isPasswordValid) {
              return null;
            }

            // Check if user is active
            if (!user.isActive) {
              throw new Error('Account is suspended');
            }

            // Update last login
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isActive: user.isActive,
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role || 'USER';
        token.isActive = (user as any).isActive !== false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).role = token.role || 'USER';
        (session.user as any).isActive = token.isActive !== false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { userId: user.id, email: user.email });
    },
    async signOut({ token }) {
      console.log('User signed out:', { userId: token?.id });
    },
  },
};
