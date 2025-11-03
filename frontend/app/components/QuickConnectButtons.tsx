'use client';

import { useWallet } from '@solana/wallet-adapter-react';

export default function QuickConnectButtons() {
  const { select, connect, disconnect, publicKey, wallets } = useWallet();

  const connectWallet = async (name: string) => {
    try {
      const target = wallets.find(
        (w) => w.adapter.name.toLowerCase() === name.toLowerCase() && w.readyState === 'Installed'
      );
      if (!target) {
        alert(`${name} wallet not detected in your browser.`);
        return;
      }

      // If already connected, disconnect first
      if (publicKey) await disconnect();

      // Select the wallet, then give React context a tick to update before connecting
      select(target.adapter.name as any);
      await new Promise((r) => setTimeout(r, 100));
      await connect();
    } catch (e: any) {
      console.error(`Connect ${name} error:`, e);
      alert(`Failed to connect ${name}: ${e?.message || e}`);
    }
  };

  const hasWallet = (name: string) =>
    wallets.some(w => w.adapter.name.toLowerCase() === name.toLowerCase() && w.readyState === 'Installed');

  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
      <span>Or connect:</span>
      <button
        onClick={() => connectWallet('Phantom')}
        disabled={!hasWallet('Phantom')}
        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        title={hasWallet('Phantom') ? 'Connect Phantom' : 'Phantom not installed'}
      >
        Phantom
      </button>
      <button
        onClick={() => connectWallet('Solflare')}
        disabled={!hasWallet('Solflare')}
        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        title={hasWallet('Solflare') ? 'Connect Solflare' : 'Solflare not installed'}
      >
        Solflare
      </button>
    </div>
  );
}
