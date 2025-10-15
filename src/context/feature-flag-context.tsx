'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';

interface FeatureFlagContextValue {
  flags: Record<string, boolean>;
  isEnabled: (flagName: string) => boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [user]);

  const isEnabled = (flagName: string): boolean => {
    return flags[flagName] || false;
  };

  const refresh = async () => {
    setLoading(true);
    await fetchFlags();
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isEnabled, loading, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

// Convenience hook for checking a single flag
export function useFeatureFlag(flagName: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagName);
}