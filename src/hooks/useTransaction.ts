'use client';

import { useState, useCallback } from 'react';
import { ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';

interface TransactionState {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  hash: string | null;
  error: string | null;
}

export function useTransaction() {
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    hash: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ status: 'idle', hash: null, error: null });
  }, []);

  const execute = useCallback(
    async (
      txFn: () => Promise<ContractTransactionResponse>
    ): Promise<ContractTransactionReceipt | null> => {
      setState({ status: 'pending', hash: null, error: null });

      try {
        const tx = await txFn();
        setState({ status: 'confirming', hash: tx.hash, error: null });

        const receipt = await tx.wait();
        setState({ status: 'success', hash: tx.hash, error: null });

        return receipt;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setState({ status: 'error', hash: null, error: message });
        return null;
      }
    },
    []
  );

  return {
    ...state,
    execute,
    reset,
    isPending: state.status === 'pending' || state.status === 'confirming',
  };
}
