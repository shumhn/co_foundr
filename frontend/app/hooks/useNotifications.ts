'use client';

import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from './useAnchorProgram';
import { showToast } from '../components/Toast';

export function useNotifications() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [lastCheckedFrom, setLastCheckedFrom] = useState<Record<string, string>>({});
  const [lastCheckedTo, setLastCheckedTo] = useState<Record<string, string>>({});
  const checkInProgress = useRef(false);

  // Helper to check if we've already notified about this incoming request
  const hasBeenNotified = (reqId: string): boolean => {
    if (typeof window === 'undefined' || !publicKey) return false;
    try {
      const key = `notifiedIncoming_${publicKey.toBase58()}`;
      const stored = localStorage.getItem(key);
      if (!stored) return false;
      const notified = new Set(JSON.parse(stored));
      return notified.has(reqId);
    } catch {
      return false;
    }
  };

  // Helper to mark an outgoing request's response as notified (applicant side)
  const markResponseNotified = (reqId: string) => {
    if (typeof window === 'undefined' || !publicKey) return;
    try {
      const key = `notifiedRequests_${publicKey.toBase58()}`;
      const stored = localStorage.getItem(key);
      const notified = stored ? new Set(JSON.parse(stored)) : new Set();
      notified.add(reqId);
      localStorage.setItem(key, JSON.stringify(Array.from(notified)));
    } catch {}
  };

  // Helper to mark an incoming request as notified
  const markAsNotified = (reqId: string) => {
    if (typeof window === 'undefined' || !publicKey) return;
    try {
      const key = `notifiedIncoming_${publicKey.toBase58()}`;
      const stored = localStorage.getItem(key);
      const notified = stored ? new Set(JSON.parse(stored)) : new Set();
      notified.add(reqId);
      localStorage.setItem(key, JSON.stringify(Array.from(notified)));
    } catch {}
  };

  useEffect(() => {
    if (!program || !publicKey) return;

    const checkForUpdates = async () => {
      if (checkInProgress.current) return;
      checkInProgress.current = true;

      try {
        // Fetch all requests sent BY this user (applicant notifications)
        const sentFilters = [
          { memcmp: { offset: 8, bytes: publicKey.toBase58() } }, // 8 disc = start of `from`
        ];
        const sent = await (program as any).account.collaborationRequest.all(sentFilters);

        sent.forEach((req: any) => {
          const key = req.publicKey.toString();
          const status = Object.keys(req.account.status)[0];
          const prevStatus = lastCheckedFrom[key];
          const roleKey = req.account.desiredRole ? Object.keys(req.account.desiredRole)[0] : '';
          const rolePretty = roleKey ? roleKey.replace(/^[a-z]/, (c: string) => c.toUpperCase()) : 'Role';
          const projectShort = `${req.account.project.toString().slice(0,4)}…${req.account.project.toString().slice(-4)}`;

          // Notify applicant on status change
          if (prevStatus && prevStatus !== status) {
            if (status === 'underReview') {
              showToast('info', `🔍 Under review for ${rolePretty} on project ${projectShort}`, 6000);
              // Mark response as notified so navbar badge clears
              markResponseNotified(key);
            } else if (status === 'accepted') {
              showToast('success', `🎉 Accepted for ${rolePretty} on project ${projectShort}`, 8000);
              markResponseNotified(key);
            } else if (status === 'rejected') {
              showToast('error', `❌ Rejected for ${rolePretty} on project ${projectShort}`, 8000);
              markResponseNotified(key);
            }
          }

          setLastCheckedFrom(prev => ({ ...prev, [key]: status }));
        });

        // Fetch all requests received BY this user (owner notifications)
        const recvFilters = [
          { memcmp: { offset: 8 + 32, bytes: publicKey.toBase58() } }, // 8 disc + 32 from = start of `to`
        ];
        const received = await (program as any).account.collaborationRequest.all(recvFilters);

        received.forEach((req: any) => {
          const key = req.publicKey.toString();
          const status = Object.keys(req.account.status)[0];
          const prevStatus = lastCheckedTo[key];

          // Notify owner when a new pending request arrives
          // BUT only if we haven't already notified about it (check localStorage)
          if (!prevStatus && status === 'pending' && !hasBeenNotified(key)) {
            showToast('info', '✉️ New collaboration request received', 6000);
            // Mark as notified so we don't show it again
            markAsNotified(key);
          }

          setLastCheckedTo(prev => ({ ...prev, [key]: status }));
        });
      } catch (e) {
        console.warn('Notification check failed:', e);
      } finally {
        checkInProgress.current = false;
      }
    };

    // Initial check
    checkForUpdates();

    // Poll every 30s
    const interval = setInterval(checkForUpdates, 30000);

    // Check on focus/visibility
    const onFocus = () => checkForUpdates();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    };

    try {
      window.addEventListener('focus', onFocus);
    } catch {}
    try {
      document.addEventListener('visibilitychange', onVisibility);
    } catch {}

    return () => {
      clearInterval(interval);
      try {
        window.removeEventListener('focus', onFocus);
      } catch {}
      try {
        document.removeEventListener('visibilitychange', onVisibility);
      } catch {}
    };
  }, [program, publicKey]);
}
