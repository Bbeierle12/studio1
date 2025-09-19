import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' }, // login or signup
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password, action } = credentials;

        try {
          if (action === 'signup') {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
              where: { email },
            });

            if (existingUser) {
              throw new Error('User already exists');
            }

            // Create new user
            const hashedPassword = await hash(password, 12);
            const user = await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                name: email.split('@')[0], // Use email prefix as default name
              },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } else {
            // Login existing user
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              return null;
            }

            const isPasswordValid = await compare(password, user.password);
            if (!isPasswordValid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
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
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
};
