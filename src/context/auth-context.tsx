'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { createSession, clearSession } from '@/app/actions';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: FirebaseUser | null | undefined;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
        if (user) {
            const idToken = await user.getIdToken();
            await createSession(idToken);
        } else if (!loading) {
            await clearSession();
        }
    }
    
    // Only run this logic on the client
    if (typeof window !== 'undefined') {
        handleAuth();
    }
  }, [user, loading]);

  useEffect(() => {
    if (error) {
        console.error("Auth Error:", error);
    }
  }, [error])

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
