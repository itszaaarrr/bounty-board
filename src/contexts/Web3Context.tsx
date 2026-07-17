'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { WalletState, NetworkConfig } from '@/types';
import { getNetworkByChainId, getDefaultNetwork, isSupportedNetwork } from '@/config/networks';

interface Web3ContextType {
  // State
  wallet: WalletState;
  network: NetworkConfig | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  
  // Status
  isConnecting: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balance: BigInt(0),
};

export function Web3Provider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [network, setNetwork] = useState<NetworkConfig | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is available
  const getEthereum = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return window.ethereum;
    }
    return null;
  }, []);

  // Update wallet balance
  const updateBalance = useCallback(async (provider: BrowserProvider, address: string) => {
    try {
      const balance = await provider.getBalance(address);
      setWallet((prev) => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to get balance:', err);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    
    if (!ethereum) {
      setError('Please install MetaMask to connect your wallet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);
      const signer = await browserProvider.getSigner();
      const balance = await browserProvider.getBalance(address);

      const networkConfig = getNetworkByChainId(chainId);

      setProvider(browserProvider);
      setSigner(signer);
      setNetwork(networkConfig);
      setWallet({
        isConnected: true,
        address,
        chainId,
        balance,
      });

      // Warn if not on supported network
      if (!isSupportedNetwork(chainId)) {
        setError('Please switch to Armchain network');
      }
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [getEthereum]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet(initialWalletState);
    setNetwork(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    const ethereum = getEthereum();
    
    if (!ethereum) {
      setError('MetaMask not found');
      return;
    }

    const targetNetwork = getNetworkByChainId(chainId);
    if (!targetNetwork) {
      setError('Unsupported network');
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Chain not added, try to add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: targetNetwork.name,
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: targetNetwork.explorerUrl ? [targetNetwork.explorerUrl] : [],
                nativeCurrency: targetNetwork.nativeCurrency,
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError('Failed to add network');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        setError('Failed to switch network');
      }
    }
  }, [getEthereum]);

  // Listen for account and chain changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (wallet.isConnected) {
        setWallet((prev) => ({ ...prev, address: accounts[0] }));
        if (provider) {
          updateBalance(provider, accounts[0]);
        }
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const networkConfig = getNetworkByChainId(chainId);
      setNetwork(networkConfig);
      setWallet((prev) => ({ ...prev, chainId }));
      
      if (!isSupportedNetwork(chainId)) {
        setError('Please switch to Armchain network');
      } else {
        setError(null);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [getEthereum, wallet.isConnected, provider, disconnect, updateBalance]);

  // Auto-connect if previously connected
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        connect();
      }
    });
  }, [getEthereum, connect]);

  return (
    <Web3Context.Provider
      value={{
        wallet,
        network,
        provider,
        signer,
        connect,
        disconnect,
        switchNetwork,
        isConnecting,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
