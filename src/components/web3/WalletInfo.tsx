'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { formatTokenAmount } from '@/lib/utils';

export function WalletInfo() {
  const { wallet, network, error } = useWeb3();

  if (!wallet.isConnected) {
    return null;
  }

  return (
    <div className="text-sm">
      {error && (
        <p className="text-red-600 mb-2">{error}</p>
      )}
      <div className="flex items-center gap-4 text-neutral-600">
        <span>
          {formatTokenAmount(wallet.balance)} {network?.nativeCurrency.symbol || 'ETH'}
        </span>
        {network && (
          <span className="text-neutral-400">
            {network.name}
          </span>
        )}
      </div>
    </div>
  );
}
