import { NetworkConfig } from '@/types';

/**
 * Network configurations for Armchain Bounty Board
 * 
 * Armchain is a post-quantum resistant blockchain using ML-DSA-44 signatures.
 * Standard smart contracts are compatible - no changes needed unless using ecrecover.
 */

export const networks: Record<number, NetworkConfig> = {
  // Armchain Mainnet
  1339: {
    chainId: 1339,
    name: 'Armchain',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.armchain.org',
    explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.armchain.io',
    nativeCurrency: {
      name: 'ARM',
      symbol: 'ARM',
      decimals: 18,
    },
  },

  // Armchain Testnet
  889: {
    chainId: 889,
    name: 'Armchain Testnet',
    rpcUrl: 'https://testnet-rpc.armchain.io',
    explorerUrl: 'https://testnet-explorer.armchain.io',
    nativeCurrency: {
      name: 'ARM',
      symbol: 'ARM',
      decimals: 18,
    },
  },
  
  // Local Development (Hardhat)
  31337: {
    chainId: 31337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Local Armchain Node
  888: {
    chainId: 888,
    name: 'Armchain Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: '',
    nativeCurrency: {
      name: 'ARM',
      symbol: 'ARM',
      decimals: 18,
    },
  },
};

/**
 * Get the default network based on environment
 */
export const getDefaultNetwork = (): NetworkConfig => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337');
  return networks[chainId] || networks[31337];
};

/**
 * Check if a chain ID is supported
 */
export const isSupportedNetwork = (chainId: number): boolean => {
  return chainId in networks;
};

/**
 * Get network by chain ID
 */
export const getNetworkByChainId = (chainId: number): NetworkConfig | null => {
  return networks[chainId] || null;
};
