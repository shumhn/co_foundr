'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
// Use client-only WalletMultiButton to avoid hydration mismatches
const WalletMultiButtonDynamic = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
);
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
const ToastContainer = dynamic(() => import('./Toast').then(m => m.ToastContainer), { ssr: false });
const NotificationProvider = dynamic(() => import('./NotificationProvider').then(m => m.NotificationProvider), { ssr: false });
import { useAnchorProgram, getUserPDA } from '../hooks/useAnchorProgram';

export default function Navbar() {
  const { publicKey } = useWallet();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const refreshPending = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      if (!program || !publicKey) return;
      // Filter by recipient (to) using memcmp to reduce data size
      const filters = [
        { memcmp: { offset: 8 + 32, bytes: publicKey.toBase58() } }, // 8 disc + 32 from = start of `to`
      ];
      const rec = await (program as any).account.collaborationRequest.all(filters);
      const pending = rec.filter((r: any) => Object.keys(r.account.status)[0] === 'pending').length;
      setPendingCount(pending);
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
    // Moderate polling (20s) + focus/visibility-triggered refresh
    const interval = setInterval(refreshPending, 60000);
    const onFocus = () => refreshPending();
    const onVisibility = () => { if (document.visibilityState === 'visible') refreshPending(); };
    try { window.addEventListener('focus', onFocus); } catch {}
    try { document.addEventListener('visibilitychange', onVisibility); } catch {}
    return () => {
      clearInterval(interval);
      try { window.removeEventListener('focus', onFocus); } catch {}
      try { document.removeEventListener('visibilitychange', onVisibility); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuery]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/founders', label: 'Founders' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <>
    <NotificationProvider />
    <ToastContainer />
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-8">
            <div className="text-xl font-bold text-gray-900">
              DevCol
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {publicKey && (
              <Link
                href="/requests"
                className={`relative text-sm font-medium transition-colors ${
                  isActive('/requests')
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Wallet */}
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButtonDynamic />
            </div>

            {/* CTA */}
            {publicKey && profileChecked && hasProfile && (
              <Link
                href="/projects/new"
                className="hidden md:block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Submit Project
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
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
          </div>
        </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-gray-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-[#00D4AA] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {publicKey && (
              <Link
                href="/requests"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/requests')
                    ? 'bg-[#00D4AA] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Requests
                {pendingCount > 0 && (
                  <span className="ml-2 inline-block bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </Link>
            )}
            
            {publicKey && profileChecked && (
              hasProfile ? (
                <Link
                  href="/projects/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg font-semibold bg-[#00D4AA] text-white"
                >
                  <span className="mr-2">🚀</span>
                  Create Project
                </Link>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg font-medium border border-gray-300 text-gray-600"
                >
                  <span className="mr-2">👤</span>
                  Create Profile First
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
