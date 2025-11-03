'use client';

import { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Commitment } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Prefer env RPC, fallback to Helius devnet, finally to clusterApiUrl
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {
    // Prefer explicit devnet RPC env var if provided
    return (
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL_DEVNET ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      'https://devnet.helius-rpc.com/?api-key=1a571cec-6f5e-4cc5-be17-a50dc8c5954a' ||
      clusterApiUrl(network)
    );
  }, [network]);
  const commitment: Commitment = 'confirmed';

  // Wallets are auto-detected via Wallet Standard (no explicit adapters needed)
  // Phantom, Solflare, and other Standard Wallets will be automatically available
  const wallets = useMemo(
    () => [],
    []
  );

  // Handle wallet errors
  const onError = useCallback((error: any) => {
    console.error('Wallet error:', error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment }}>
      {/* Disable autoConnect so users can properly disconnect/change wallet from the modal */}
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

