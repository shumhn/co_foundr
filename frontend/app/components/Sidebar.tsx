'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../hooks/useAnchorProgram';
import { Sora } from 'next/font/google';

const premium = Sora({ subsets: ['latin'], weight: ['400', '600'] });

export default function Sidebar() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [exploreOpen, setExploreOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const refreshInFlight = useRef(false);

  const canQuery = useMemo(() => !!program && !!publicKey, [program, publicKey]);

  const isActive = (path: string) => pathname === path;

  // Load notified requests from localStorage
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

  const refreshPending = async () => {
    if (refreshInFlight.current || !program || !publicKey) return;
    refreshInFlight.current = true;
    try {
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

      const pendingReceived = received.filter((r: any) => Object.keys(r.account.status)[0] === 'pending').length;

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
      console.warn('Sidebar: Failed to refresh pending count', e);
    } finally {
      refreshInFlight.current = false;
    }
  };

  useEffect(() => {
    if (!canQuery) {
      setPendingCount(0);
      return;
    }
    refreshPending();
    const interval = setInterval(refreshPending, 60000);
    const onFocus = () => refreshPending();
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshPending(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery]);

  const navSections = [
    {
      title: 'Main',
      items: [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
      ],
    },
    {
      title: 'Explore',
      collapsible: true,
      isOpen: exploreOpen,
      toggle: () => setExploreOpen(!exploreOpen),
      items: [
        { href: '/projects', label: 'Projects' },
        { href: '/founders', label: 'Founders' },
        { href: '/requests', label: 'Requests' },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/profile', label: 'My Profile' },
      ],
    },
  ];

  const renderIcon = (href: string) => {
    const iconClass = "w-4 h-4";

    switch (href) {
      case '/':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case '/dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        );
      case '/projects':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case '/founders':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case '/requests':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case '/profile':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-(--surface) border border-(--border) text-(--text-primary) hover:bg-(--surface-hover) transition-colors"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-(--border) overflow-y-auto transition-transform duration-300 z-40 lg:z-auto lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:block`}>
        <div className="p-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 group-hover:bg-teal-500/20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-(--text-primary)">c0Foundr</h1>
              <p className="text-xs tracking-[0.2em] uppercase text-(--text-muted) font-semibold mt-0.5">Build Together</p>
            </div>
          </Link>

          {/* Navigation Sections */}
          <div className="space-y-8">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-3 px-3">
                  <h3 className="text-[13px] font-bold text-(--text-muted) tracking-[0.2em] uppercase">
                    {section.title}
                  </h3>
                  {section.collapsible && (
                    <button
                      onClick={section.toggle}
                      className="text-(--text-muted) hover:text-(--text-primary) transition-colors"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${section.isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {(!section.collapsible || section.isOpen) && (
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center gap-4 px-3 py-3 rounded-xl text-[16px] font-medium transition-all ${isActive(item.href)
                          ? 'bg-zinc-900 border border-zinc-800 text-(--text-primary)'
                          : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-zinc-900/50'
                          }`}
                      >
                        <div className={`transition-colors ${isActive(item.href) ? 'text-teal-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                          {renderIcon(item.href)}
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {item.href === '/requests' && pendingCount > 0 && (
                          <span className="h-5 px-2 flex items-center justify-center rounded-md bg-teal-500/10 text-teal-500 text-[11px] font-bold border border-teal-500/20">
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Profile / Wallet Status (Optional but clean) */}
        <div className="absolute bottom-0 left-0 right-0 p-8 border-t border-(--border) bg-zinc-950/40">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-mono">
              {publicKey ? publicKey.toBase58().slice(0, 2) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {publicKey ? publicKey.toBase58().slice(0, 4) + '...' + publicKey.toBase58().slice(-4) : 'Not Connected'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${publicKey ? 'bg-teal-500' : 'bg-red-500'}`} />
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">
                  {publicKey ? 'Live' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

