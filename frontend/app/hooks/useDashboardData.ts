'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram, getUserPDA } from './useAnchorProgram';
import { PublicKey } from '@solana/web3.js';

export interface DashboardData {
  profile: any | null;
  ownedProjects: any[];
  applications: any[];
  receivedRequests: any[];
  activeCollaborations: any[];
  stats: {
    projectsCreated: number;
    pendingReviews: number;
    activeCollabs: number;
    totalApplications: number;
  };
  loading: boolean;
  error: string | null;
}

export function useDashboardData() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [data, setData] = useState<DashboardData>({
    profile: null,
    ownedProjects: [],
    applications: [],
    receivedRequests: [],
    activeCollaborations: [],
    stats: {
      projectsCreated: 0,
      pendingReviews: 0,
      activeCollabs: 0,
      totalApplications: 0,
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!program || !publicKey) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchDashboardData = async () => {
      setData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Import cache and retry utilities
        const { getCache, setCache } = await import('../utils/cache');
        const { rpcWithRetry } = await import('../utils/rpcRetry');
        
        // Check cache first for instant display
        const cachedDashboard = getCache<any>('dashboard_data');
        if (cachedDashboard) {
          setData({
            ...cachedDashboard,
            loading: false,
            error: null,
          });
        }
        
        // Fetch user profile - check both PDA and legacy address
        const [userPda] = getUserPDA(publicKey);
        let profile = null;
        
        try {
          profile = await (program as any).account.user.fetch(userPda);
        } catch (e) {
          // If not found at PDA, try legacy address
          try {
            const oldAddress = new PublicKey('FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP');
            profile = await (program as any).account.user.fetch(oldAddress);
          } catch (e2) {
            // Profile doesn't exist at either address
            profile = null;
          }
        }

        // Parallel fetch with retry: projects, sent requests, received requests
        let allProjects: any[] = [];
        let sentRequests: any[] = [];
        let receivedRequests: any[] = [];
        
        try {
          [allProjects, sentRequests, receivedRequests] = await Promise.all([
            rpcWithRetry(() => (program as any).account.project.all()).catch(() => []),
            rpcWithRetry(() => (program as any).account.collaborationRequest.all([
              { memcmp: { offset: 8, bytes: publicKey.toBase58() } }, // from = publicKey
            ])).catch(() => []),
            rpcWithRetry(() => (program as any).account.collaborationRequest.all([
              { memcmp: { offset: 8 + 32, bytes: publicKey.toBase58() } }, // to = publicKey
            ])).catch(() => []),
          ]) as [any[], any[], any[]];
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          // Continue with empty arrays
        }

        // Filter owned projects
        const ownedProjects = allProjects.filter(
          (p: any) => p.account.creator.toString() === publicKey.toString()
        );

        // Find active collaborations (projects where user is accepted)
        const acceptedRequests = sentRequests.filter(
          (r: any) => Object.keys(r.account.status)[0] === 'accepted'
        );
        const activeCollabProjectKeys = new Set(
          acceptedRequests.map((r: any) => r.account.project.toString())
        );
        const activeCollaborations = allProjects.filter((p: any) =>
          activeCollabProjectKeys.has(p.publicKey.toString())
        );

        // Count pending reviews (requests to your projects that are pending)
        const pendingReviews = receivedRequests.filter(
          (r: any) => Object.keys(r.account.status)[0] === 'pending'
        ).length;

        const newData = {
          profile,
          ownedProjects,
          applications: sentRequests,
          receivedRequests,
          activeCollaborations,
          stats: {
            projectsCreated: ownedProjects.length,
            pendingReviews,
            activeCollabs: activeCollaborations.length,
            totalApplications: sentRequests.length,
          },
          loading: false,
          error: null,
        };
        
        // Cache dashboard data for faster subsequent loads
        try {
          const { setCache } = await import('../utils/cache');
          setCache('dashboard_data', newData, 30_000); // 30 second cache
        } catch {}

        setData(newData);
      } catch (e) {
        console.error('Dashboard data fetch error:', e);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data',
        }));
      }
    };

    fetchDashboardData();

    // Optional: Refresh every 2 minutes (less aggressive with caching)
    // Removed auto-refresh to reduce blockchain API calls - user can manually refresh page
    // const interval = setInterval(fetchDashboardData, 120000);
    // return () => clearInterval(interval);
  }, [program, publicKey]);

  return data;
}
