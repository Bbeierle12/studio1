'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type PrintContextType = {
  isPrintOpen: boolean;
  setPrintOpen: (isOpen: boolean) => void;
  printContent: string;
  triggerPrint: (content: string) => void;
};

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [isPrintOpen, setPrintOpen] = useState(false);
  const [printContent, setPrintContent] = useState('');

  const triggerPrint = (content: string) => {
    setPrintContent(content);
    setPrintOpen(true);
  };

  return (
    <PrintContext.Provider value={{ isPrintOpen, setPrintOpen, printContent, triggerPrint }}>
      {children}
    </PrintContext.Provider>
  );
}

export const usePrint = () => {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
};
