'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';

type Unit = 'imperial' | 'metric';

type UnitContextType = {
  unit: Unit;
  toggleUnit: () => void;
  setUnit: (unit: Unit) => void;
};

const UnitContext = createContext<UnitContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'unitPreference';

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>('imperial');

  useEffect(() => {
    try {
      const storedUnit = window.localStorage.getItem(
        LOCAL_STORAGE_KEY
      ) as Unit | null;
      if (
        storedUnit &&
        (storedUnit === 'imperial' || storedUnit === 'metric')
      ) {
        setUnit(storedUnit);
      }
    } catch (error) {
      console.error('Failed to parse unit preference from localStorage', error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, unit);
  }, [unit]);

  const toggleUnit = useCallback(() => {
    setUnit(prevUnit => (prevUnit === 'imperial' ? 'metric' : 'imperial'));
  }, []);

  const value = { unit, toggleUnit, setUnit };

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};
