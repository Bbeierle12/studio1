'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { User } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const user: User | null = session?.user
    ? {
        id: (session.user as any).id,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        avatarUrl:
          session.user.image ||
          `https://i.pravatar.cc/150?u=${session.user.email}`,
        role: (session.user as any).role || 'USER',
        isActive: (session.user as any).isActive !== false,
        lastLogin: (session.user as any).lastLogin ? new Date((session.user as any).lastLogin) : undefined,
      }
    : null;

  const loading = status === 'loading';

  const updateProfile = async (data: Partial<User>) => {
    // Trigger session refresh to get updated user data
    await update();
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
