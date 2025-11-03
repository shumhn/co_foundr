'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomWalletModal({ isOpen, onClose }: CustomWalletModalProps) {
  const { wallets, select, connect, connecting } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleWalletClick = async (wallet: any) => {
    try {
      console.log('Selecting wallet:', wallet.adapter.name);
      select(wallet.adapter.name);
      
      // Small delay to ensure wallet is selected
      setTimeout(async () => {
        try {
          await connect();
          console.log('Connected successfully!');
          onClose();
        } catch (err) {
          console.error('Connection error:', err);
          alert('Failed to connect: ' + (err as any).message);
        }
      }, 100);
    } catch (err) {
      console.error('Selection error:', err);
      alert('Failed to select wallet: ' + (err as any).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Connect a wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wallet List */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {wallets.filter(w => w.readyState === 'Installed').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No wallets detected</p>
              <p className="text-sm">Please install Phantom or Solflare</p>
            </div>
          ) : (
            wallets
              .filter(wallet => wallet.readyState === 'Installed')
              .map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleWalletClick(wallet)}
                  disabled={connecting}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Wallet Icon */}
                  {wallet.adapter.icon && (
                    <img 
                      src={wallet.adapter.icon} 
                      alt={wallet.adapter.name}
                      className="w-10 h-10 rounded-lg"
                    />
                  )}
                  
                  {/* Wallet Info */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{wallet.adapter.name}</div>
                    <div className="text-sm text-gray-500">
                      {connecting ? 'Connecting...' : 'Detected'}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            By connecting, you agree to the Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
