'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { formatAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ConnectWalletButtonProps {
  className?: string;
}

export function ConnectWalletButton({ className }: ConnectWalletButtonProps) {
  const { wallet, connect, disconnect, isConnecting, error } = useWeb3();

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-700 hidden sm:inline px-4 py-2">
          {formatAddress(wallet.address)}
        </span>
        <button
          onClick={disconnect}
          className={cn(
            'text-sm px-4 py-2 h-10 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-100 hover:shadow-md hover:border-neutral-400 active:bg-neutral-200 active:scale-95 transition-all font-semibold',
            className
          )}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className={cn(
        'text-sm px-4 py-2 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg active:bg-blue-800 active:scale-95 transition-all shadow-sm font-semibold',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
