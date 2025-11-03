'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

export default function InlineWalletSelector() {
  const { publicKey, wallets, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<PublicKey | null>(null);
  
  // Sync with wallet adapter context
  useEffect(() => {
    setConnectedWallet(publicKey);
  }, [publicKey]);

  const handleConnect = async (wallet: any) => {
    if (!wallet || wallet.readyState !== 'Installed' || connecting) return;

    try {
      setConnecting(true);
      console.log('🔗 Connecting to:', wallet.adapter.name);
      
      // Direct adapter connection
      await wallet.adapter.connect();
      
      // Get the public key from the adapter
      const pubKey = wallet.adapter.publicKey;
      console.log('✅ Connected! Address:', pubKey?.toString());
      
      // Update local state immediately
      setConnectedWallet(pubKey);
    } catch (e: any) {
      console.error('❌ Connection error:', e);
      alert(`Failed to connect: ${e?.message || e}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setConnectedWallet(null);
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  };

  const installedWallets = wallets.filter(w => w.readyState === 'Installed');

  // Use either connectedWallet or publicKey (whichever is available)
  const displayKey = connectedWallet || publicKey;
  
  if (displayKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-white bg-purple-600 px-3 py-2 rounded-lg font-medium">
          {displayKey.toString().slice(0, 4)}...{displayKey.toString().slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {installedWallets.slice(0, 2).map((wallet) => (
        <button
          key={wallet.adapter.name}
          onClick={() => handleConnect(wallet)}
          disabled={connecting}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {connecting ? 'Connecting...' : wallet.adapter.name}
        </button>
      ))}
    </div>
  );
}