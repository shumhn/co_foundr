'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../hooks/useAnchorProgram';
import { PublicKey } from '@solana/web3.js';
import { showToast } from './Toast';

/**
 * RequestStatusMonitor
 * Monitors collaboration requests sent by the user and detects status changes.
 * Shows toast notifications when project owners respond (accept, reject, under review).
 */
export default function RequestStatusMonitor() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const lastCheckedRef = useRef<Record<string, string>>({});
  const isCheckingRef = useRef(false);

  // Save to localStorage when we notify about a request
  const markAsNotified = (reqId: string) => {
    if (typeof window === 'undefined' || !publicKey) return;
    try {
      const key = `notifiedRequests_${publicKey.toBase58()}`;
      const stored = localStorage.getItem(key);
      const notified = stored ? new Set(JSON.parse(stored)) : new Set();
      notified.add(reqId);
      localStorage.setItem(key, JSON.stringify(Array.from(notified)));
    } catch {}
  };

  const checkForUpdates = async () => {
    if (!program || !publicKey || isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    try {
      // Fetch all program accounts (projects and collaboration requests)
      const conn = (program as any).provider.connection;
      const programId = (program as any).programId;
      const accs = await conn.getProgramAccounts(programId, { commitment: 'processed' });
      
      const sentRequests: any[] = [];
      for (const a of accs) {
        try {
          const acct = await (program as any).account.collaborationRequest.fetchNullable(a.pubkey, 'processed');
          if (acct && acct.from?.toString?.() === publicKey.toString()) {
            sentRequests.push({ publicKey: a.pubkey, account: acct });
          }
        } catch {
          continue;
        }
      }

      // Check for status changes
      for (const req of sentRequests) {
        const reqId = req.publicKey.toString();
        const currentStatus = Object.keys(req.account.status || {})[0] || 'pending';
        const lastStatus = lastCheckedRef.current[reqId];

        // First time seeing this request - just store it, don't notify
        if (!lastStatus) {
          lastCheckedRef.current[reqId] = currentStatus;
          continue;
        }

        // Status changed - notify user!
        if (lastStatus !== currentStatus) {
          console.log(`Status changed for ${reqId}: ${lastStatus} → ${currentStatus}`);
          lastCheckedRef.current[reqId] = currentStatus;
          
          // Only notify if changing FROM pending (owner is responding)
          if (lastStatus === 'pending') {
            const navigateToRequest = () => {
              router.push(`/requests?highlight=${reqId}`);
            };
            
            if (currentStatus === 'accepted') {
              showToast('success', '🎉 Your collaboration request was accepted! Click to view', 8000, navigateToRequest);
              // Play sound if available
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {});
              } catch {}
            } else if (currentStatus === 'rejected') {
              showToast('error', '❌ Your collaboration request was declined. Click to view', 6000, navigateToRequest);
            } else if (currentStatus === 'underReview') {
              showToast('info', '👀 Your request is now under review. Click to view', 6000, navigateToRequest);
            }
            
            // Mark as notified so badge updates
            markAsNotified(reqId);
          }
        }

        // Also check for reply messages (owner_reply)
        if (req.account.ownerReply && req.account.ownerReplyTimestamp) {
          const replyKey = `${reqId}-reply`;
          const lastReplyTime = lastCheckedRef.current[replyKey];
          const currentReplyTime = String(req.account.ownerReplyTimestamp);
          
          if (lastReplyTime && lastReplyTime !== currentReplyTime) {
            const navigateToRequest = () => {
              router.push(`/requests?highlight=${reqId}`);
            };
            showToast('info', '💬 Project owner sent you a message. Click to view', 7000, navigateToRequest);
            lastCheckedRef.current[replyKey] = currentReplyTime;
          } else if (!lastReplyTime) {
            lastCheckedRef.current[replyKey] = currentReplyTime;
          }
        }
      }
    } catch (err) {
      console.warn('RequestStatusMonitor error:', err);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!program || !publicKey) {
      lastCheckedRef.current = {};
      return;
    }

    // Initial check
    checkForUpdates();

    // Poll every 60 seconds to avoid rate limiting
    const interval = setInterval(checkForUpdates, 60000);

    // Refresh on window focus
    const onFocus = () => checkForUpdates();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, publicKey]);

  return null; // This component renders nothing, just runs the monitor
}
