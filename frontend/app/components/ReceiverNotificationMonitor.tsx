'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '../hooks/useAnchorProgram';
import { showToast } from './Toast';

/**
 * ReceiverNotificationMonitor
 * Monitors collaboration requests RECEIVED by the user (as project owner).
 * Shows toast notifications when new requests come in.
 */
export default function ReceiverNotificationMonitor() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const lastCheckedRef = useRef<Set<string>>(new Set());
  const isCheckingRef = useRef(false);

  const checkForNewRequests = async () => {
    if (!program || !publicKey || isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    try {
      // Fetch all program accounts
      const conn = (program as any).provider.connection;
      const programId = (program as any).programId;
      const accs = await conn.getProgramAccounts(programId, { commitment: 'processed' });
      
      const receivedRequests: any[] = [];
      for (const a of accs) {
        try {
          const acct = await (program as any).account.collaborationRequest.fetchNullable(a.pubkey, 'processed');
          if (acct && acct.to?.toString?.() === publicKey.toString()) {
            receivedRequests.push({ publicKey: a.pubkey, account: acct });
          }
        } catch {
          continue;
        }
      }

      // Check for new pending requests
      for (const req of receivedRequests) {
        const reqId = req.publicKey.toString();
        const status = Object.keys(req.account.status || {})[0];
        
        // Only notify for new pending requests
        if (status === 'pending') {
          // First time seeing this request - it's new!
          if (!lastCheckedRef.current.has(reqId)) {
            lastCheckedRef.current.add(reqId);
            
            // Get sender username if available
            let senderName = 'Someone';
            try {
              const senderPubkey = req.account.from;
              const [userPda] = await (program as any).provider.connection.findProgramAddress(
                [Buffer.from('user'), senderPubkey.toBuffer()],
                programId
              );
              const userAcct = await (program as any).account.user.fetchNullable(userPda);
              if (userAcct) {
                senderName = userAcct.displayName || userAcct.username || 'Someone';
              }
            } catch {
              // Use wallet address if can't get username
              senderName = req.account.from.toBase58().slice(0, 8) + '...';
            }
            
            // Show notification with navigation
            const navigateToRequest = () => {
              router.push(`/requests?highlight=${reqId}`);
            };
            showToast('info', `📬 New collaboration request from ${senderName}. Click to view`, 7000, navigateToRequest);
            
            // Play sound if available
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
            
            console.log('New collaboration request received from:', senderName);
          }
        } else {
          // Non-pending requests should be tracked but not notified
          lastCheckedRef.current.add(reqId);
        }
      }
    } catch (err) {
      console.warn('ReceiverNotificationMonitor error:', err);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (!program || !publicKey) {
      lastCheckedRef.current.clear();
      return;
    }

    // Initial check
    checkForNewRequests();

    // Poll every 60 seconds to avoid rate limiting
    const interval = setInterval(checkForNewRequests, 60000);

    // Refresh on window focus
    const onFocus = () => checkForNewRequests();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, publicKey]);

  return null; // This component renders nothing, just runs the monitor
}
