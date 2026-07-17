'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { networks } from '@/config/networks';

export function NetworkSwitcher() {
  const { wallet, network, switchNetwork } = useWeb3();

  if (!wallet.isConnected) {
    return null;
  }

  return (
    <select
      value={network?.chainId || ''}
      onChange={(e) => switchNetwork(Number(e.target.value))}
      className="text-sm px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-all font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {Object.values(networks).map((net) => (
        <option key={net.chainId} value={net.chainId}>
          {net.name}
        </option>
      ))}
    </select>
  );
}
