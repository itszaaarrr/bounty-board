'use client';

import { ReactNode } from 'react';
import { Web3Provider } from '@/contexts/Web3Context';
import { ContractProvider } from '@/contexts/ContractContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <ContractProvider>{children}</ContractProvider>
    </Web3Provider>
  );
}
