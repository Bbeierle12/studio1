import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { prisma } from '@/lib/data';
import { 
  checkLoginAnomaly, 
  logLoginAttempt, 
  shouldLockAccount 
} from '@/lib/login-anomaly';
import { logLoginAnomaly, logAccountLocked } from '@/lib/security-webhooks';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' }, // login or signup
        name: { label: 'Name', type: 'text' }, // for signup
        ipAddress: { label: 'IP Address', type: 'text' },
        userAgent: { label: 'User Agent', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { email, password, action, name, ipAddress, userAgent } = credentials;

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
              // Log failed attempt
              await logLoginAttempt({
                email: email.toLowerCase().trim(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                successful: false,
                failureReason: 'user_not_found',
              });
              return null;
            }

            // Check if account should be locked
            const isLocked = await shouldLockAccount(email.toLowerCase().trim());
            if (isLocked) {
              await logAccountLocked(
                user.id,
                'Too many failed login attempts',
                ipAddress
              );
              throw new Error('Account temporarily locked due to too many failed login attempts');
            }

            const isPasswordValid = await compare(password, user.password);
            if (!isPasswordValid) {
              // Log failed attempt
              await logLoginAttempt({
                email: email.toLowerCase().trim(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                successful: false,
                userId: user.id,
                failureReason: 'invalid_password',
              });
              return null;
            }

            // Check if user is active
            if (!user.isActive) {
              await logLoginAttempt({
                email: email.toLowerCase().trim(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                successful: false,
                userId: user.id,
                failureReason: 'account_suspended',
              });
              throw new Error('Account is suspended');
            }

            // Check for login anomalies
            const anomalyCheck = await checkLoginAnomaly(
              email.toLowerCase().trim(),
              ipAddress || 'unknown',
              userAgent || 'unknown'
            );

            if (anomalyCheck.isAnomalous) {
              // Log anomaly event
              await logLoginAnomaly(
                user.id,
                anomalyCheck.reasons,
                anomalyCheck.riskScore,
                ipAddress,
                userAgent
              );

              // Block if high risk
              if (anomalyCheck.shouldBlock) {
                await logLoginAttempt({
                  email: email.toLowerCase().trim(),
                  ipAddress: ipAddress || 'unknown',
                  userAgent: userAgent || 'unknown',
                  successful: false,
                  userId: user.id,
                  failureReason: 'high_risk_anomaly',
                });
                throw new Error('Suspicious login detected. Please verify your identity.');
              }
            }

            // Update last login
            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            });

            // Log successful login
            await logLoginAttempt({
              email: email.toLowerCase().trim(),
              ipAddress: ipAddress || 'unknown',
              userAgent: userAgent || 'unknown',
              successful: true,
              userId: user.id,
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
