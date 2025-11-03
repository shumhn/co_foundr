'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

export default function ClickTestPage() {
  const { wallets, publicKey, disconnect, select } = useWallet();
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    setConnected(!!publicKey);
  }, [publicKey]);

  const handleConnect = async (wallet: any) => {
    console.log('Button clicked!', wallet.adapter.name);
    try {
      // Connect directly
      await wallet.adapter.connect();
      console.log('Connected!');
      
      // Sync with wallet adapter context
      select(wallet.adapter.name);
      
      // Force state update
      setTimeout(() => {
        setConnected(true);
      }, 100);
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const installedWallets = wallets.filter(w => w.readyState === 'Installed');

  return (
    <div style={{ 
      padding: '40px', 
      background: 'white', 
      minHeight: '100vh',
      position: 'relative',
      zIndex: 999999 
    }}>
      <h1 style={{ marginBottom: '20px' }}>Click Test Page</h1>
      
      {publicKey ? (
        <div>
          <p>Connected: {publicKey.toString()}</p>
          <button
            onClick={() => disconnect()}
            style={{
              padding: '12px 24px',
              background: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', maxWidth: '300px' }}>
          {installedWallets.map((wallet) => (
            <button
              key={wallet.adapter.name}
              onClick={() => handleConnect(wallet)}
              style={{
                padding: '12px 24px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Connect {wallet.adapter.name}
            </button>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>Test Results:</h2>
        <p>• If buttons work here but not in navbar = navbar has overlay issue</p>
        <p>• If buttons don't work here = app-wide layout issue</p>
        <p>• Open console (F12) to see "Button clicked!" when clicking</p>
      </div>
    </div>
  );
}
