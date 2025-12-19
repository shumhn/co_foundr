'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
const InlineWalletSelector = dynamic(() => import('./SelectWalletButton'), { ssr: false });
import { Sora } from 'next/font/google';
import Logo from './Logo';
const ToastContainer = dynamic(() => import('./Toast').then(m => m.ToastContainer), { ssr: false });
const NotificationProvider = dynamic(() => import('./NotificationProvider').then(m => m.NotificationProvider), { ssr: false });
import { useAnchorProgram, getUserPDA } from '../hooks/useAnchorProgram';
import ThemeToggle from './ThemeToggle';

const premium = Sora({ subsets: ['latin'], weight: ['500', '600'] });

export default function Navbar() {
  const { publicKey } = useWallet();
  const { program, provider } = useAnchorProgram();
  const [pendingCount, setPendingCount] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const canQuery = useMemo(() => !!program && !!publicKey, [program, publicKey]);

  const checkProfile = async () => {
    if (!program || !publicKey) {
      setHasProfile(false);
      setProfileChecked(true);
      return;
    }
    try {
      const [userPda] = getUserPDA(publicKey);
      const userAcct = await (program as any).account.user.fetchNullable(userPda);
      setHasProfile(!!userAcct);
    } catch {
      setHasProfile(false);
    } finally {
      setProfileChecked(true);
    }
  };

  // Throttle refresh to avoid RPC bursts
  const refreshInFlight = useRef(false);

  // Load notified requests from localStorage (requests we've already shown notifications for)
  const getNotifiedRequests = (): Set<string> => {
    if (typeof window === 'undefined' || !publicKey) return new Set();
    try {
      const key = `notifiedRequests_${publicKey.toBase58()}`;
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  const saveNotifiedRequests = (notified: Set<string>) => {
    if (typeof window === 'undefined' || !publicKey) return;
    try {
      const key = `notifiedRequests_${publicKey.toBase58()}`;
      localStorage.setItem(key, JSON.stringify(Array.from(notified)));
    } catch { }
  };

  const refreshPending = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      if (!program || !publicKey) return;

      // Fetch all program accounts for collaboration requests
      const conn = (program as any).provider.connection;
      const programId = (program as any).programId;
      const accs = await conn.getProgramAccounts(programId, { commitment: 'processed' });

      const received: any[] = [];
      const sent: any[] = [];

      for (const a of accs) {
        try {
          const acct = await (program as any).account.collaborationRequest.fetchNullable(a.pubkey, 'processed');
          if (!acct) continue;

          if (acct.to?.toString?.() === publicKey.toString()) {
            received.push({ publicKey: a.pubkey, account: acct });
          }
          if (acct.from?.toString?.() === publicKey.toString()) {
            sent.push({ publicKey: a.pubkey, account: acct });
          }
        } catch {
          continue;
        }
      }

      // Count pending received requests
      const pendingReceived = received.filter((r: any) => Object.keys(r.account.status)[0] === 'pending').length;

      // Count sent requests with responses we haven't notified about yet
      const notifiedRequests = getNotifiedRequests();
      let unreadResponses = 0;

      for (const req of sent) {
        const reqId = req.publicKey.toString();
        const currentStatus = Object.keys(req.account.status || {})[0] || 'pending';

        // If status is not pending AND we haven't notified yet, count as unread
        if (currentStatus !== 'pending' && !notifiedRequests.has(reqId)) {
          unreadResponses++;
        }
      }

      setPendingCount(pendingReceived + unreadResponses);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh pending requests count', e);
    } finally {
      refreshInFlight.current = false;
    }
  };

  useEffect(() => {
    if (!canQuery) {
      setPendingCount(0);
      setHasProfile(false);
      setProfileChecked(false);
      return;
    }
    checkProfile();
    refreshPending();
    // Poll every 60 seconds to avoid rate limiting
    const interval = setInterval(refreshPending, 60000);
    const onFocus = () => refreshPending();
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshPending(); };
    try { window.addEventListener('focus', onFocus); } catch { }
    try { document.addEventListener('visibilitychange', onVisibility); } catch { }
    return () => {
      clearInterval(interval);
      try { window.removeEventListener('focus', onFocus); } catch { }
      try { document.removeEventListener('visibilitychange', onVisibility); } catch { }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery]);

  return (
    <>
      <NotificationProvider />
      <ToastContainer />
      <nav className="sticky top-0 z-50 bg-zinc-950/40 backdrop-blur-md border-b border-(--border)">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative flex items-center h-16">
            {/* Left Area (Empty space since logo is in sidebar) */}
            <div className="flex-1 md:hidden">
              <Logo withWordmark={false} href="/" />
            </div>

            {/* Center Message */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 shadow-sm animate-in">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-[15px] font-medium text-zinc-400">Collaborate with fellow builders</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 ml-auto">
              <ThemeToggle />

              {publicKey && (
                <Link
                  href="/requests"
                  className={`relative p-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ${pendingCount > 0 ? 'text-teal-500' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-500 border-2 border-zinc-950" />
                  )}
                </Link>
              )}

              <div className="h-8 w-px bg-zinc-800 mx-1 hidden sm:block" />

              <div className="relative">
                <InlineWalletSelector />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

