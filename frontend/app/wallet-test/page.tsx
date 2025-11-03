'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

export default function WalletTestPage() {
  const { publicKey, wallets, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Wallet Test</h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            {publicKey ? (
              <p className="text-green-600">Connected: {publicKey.toString().slice(0, 8)}...</p>
            ) : (
              <p className="text-red-600">Not connected</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Detected Wallets</h2>
            <ul className="space-y-1">
              {wallets.map((wallet) => (
                <li key={wallet.adapter.name} className="text-sm">
                  {wallet.adapter.name}: {wallet.readyState}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setVisible(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Wallet (Modal)
            </button>

            {publicKey && (
              <button
                onClick={() => disconnect()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
