import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/data';
import { 
  checkLoginAnomaly, 
  logLoginAttempt, 
  shouldLockAccount 
} from '@/lib/login-anomaly';
import { logLoginAnomaly, logAccountLocked, createSecurityEvent } from '@/lib/security-webhooks';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      // Do NOT auto-link Google logins to an existing password account by email.
      // Auto-linking means anyone able to present a Google identity for an
      // address inherits the pre-existing local account and its role. Linking
      // should be an explicit, already-authenticated action.
      allowDangerousEmailAccountLinking: false,
    }),
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
            throw new Error('Please use the registration form');
          } else {
            // Login existing user
            const user = await prisma.user.findUnique({
              where: { email: email.toLowerCase().trim() },
            });

            if (!user) {
              await logLoginAttempt({
                email: email.toLowerCase().trim(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                successful: false,
                failureReason: 'user_not_found',
              });
              return null;
            }

            const isLocked = await shouldLockAccount(email.toLowerCase().trim());
            if (isLocked) {
              await logAccountLocked(
                user.id,
                'Too many failed login attempts',
                ipAddress
              );
              throw new Error('Account temporarily locked due to too many failed login attempts');
            }

            // We must verify the password exists before comparing.
            // OAuth-only users might not have a password.
            if (!user.password) {
               await logLoginAttempt({
                email: email.toLowerCase().trim(),
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                successful: false,
                userId: user.id,
                failureReason: 'invalid_password_oauth_user',
              });
              throw new Error('Please sign in with Google or reset your password.');
            }

            const isPasswordValid = await compare(password, user.password);
            if (!isPasswordValid) {
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

            const anomalyCheck = await checkLoginAnomaly(
              email.toLowerCase().trim(),
              ipAddress || 'unknown',
              userAgent || 'unknown'
            );

            if (anomalyCheck.isAnomalous) {
              await logLoginAnomaly(
                user.id,
                anomalyCheck.reasons,
                anomalyCheck.riskScore,
                ipAddress,
                userAgent
              );

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

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLogin: new Date() },
            });

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
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === 'google') {
        const userEmail = user.email?.toLowerCase().trim();
        if (!userEmail) return false;

        // Perform anomaly detection for Google Sign In. 
        // We do not have direct ipAddress/userAgent here from the standard callback easily.
        // We pass "google-oauth" to satisfy the DB logging requirements.
        const anomalyCheck = await checkLoginAnomaly(
          userEmail,
          'google-oauth',
          'google-oauth'
        );

        if (anomalyCheck.isAnomalous && anomalyCheck.shouldBlock) {
          await logLoginAttempt({
            email: userEmail,
            ipAddress: 'google-oauth',
            userAgent: 'google-oauth',
            successful: false,
            failureReason: 'high_risk_anomaly',
          });
          return false; // Block sign-in
        }

        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role || 'USER';
        token.isActive = (user as any).isActive !== false;
        return token;
      }

      // On subsequent requests (no `user`), re-read role and active status from
      // the database so privilege/suspension changes take effect immediately
      // rather than being cached in the JWT for the 30-day session lifetime.
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isActive: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error('Failed to refresh token from database:', error);
        }
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
    async linkAccount({ user, account, profile }) {
      if (account.provider === 'google') {
         await createSecurityEvent({
            userId: user.id,
            eventType: 'suspicious_activity', // Or 'login_success', mapped to available enums
            severity: 'low',
            description: `Google account linked to profile successfully`,
            metadata: { provider: account.provider },
            ipAddress: 'google-oauth',
            userAgent: 'google-oauth'
         });
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      // Log the user id only
      console.log('User signed in:', { userId: user.id, provider: account?.provider });
      
      // Update lastLogin for OAuth users here
      if (account?.provider === 'google') {
         try {
           await prisma.user.update({
             where: { id: user.id },
             data: { lastLogin: new Date() }
           });
           await logLoginAttempt({
             email: user.email || 'unknown',
             ipAddress: 'google-oauth',
             userAgent: 'google-oauth',
             successful: true,
             userId: user.id,
           });
         } catch(e) {
           console.error("Failed to update OAuth user last login", e);
         }
      }
    },
    async signOut({ token }) {
      console.log('User signed out:', { userId: token?.id });
    },
  },
};
