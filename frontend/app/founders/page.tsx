'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProgram, getUserPDA } from '../hooks/useAnchorProgram';
import { rpcWithRetry } from '../utils/rpcRetry';
import { getCache, setCache } from '../utils/cache';

interface FounderItem {
  wallet: string;
  username: string;
  bio?: string;
  github?: string;
  projects: number;
}

export default function FoundersPage() {
  const { program } = useAnchorProgram();
  const [founders, setFounders] = useState<FounderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const loadedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!program) return;
      if (loadedRef.current) return;
      loadedRef.current = true;
      setLoading(true);
      try {
        const cached = getCache<FounderItem[]>('founders_dir');
        if (cached) setFounders(cached);

        const all = (await rpcWithRetry(() => (program as any).account.project.all())) as any[];
        const creatorSet: string[] = Array.from(new Set(all.map((p: any) => p.account.creator.toString())));
        const pdas = creatorSet.map((w: string) => getUserPDA(new PublicKey(w))[0]);
        let infos: any[] = [];
        if (pdas.length > 0) {
          infos = (await rpcWithRetry(() => (program as any).provider.connection.getMultipleAccountsInfo(pdas, 'processed'))) as any[];
        }
        const list: FounderItem[] = creatorSet.map((w: string, i: number) => {
          let username = w.slice(0, 4) + '…' + w.slice(-4);
          let bio = '';
          let github = '';
          try {
            if (infos && infos[i]) {
              const dec = (program as any).coder.accounts.decode('User', (infos[i] as any)!.data);
              username = dec.username || username;
              bio = dec.bio || '';
              github = dec.githubLink || dec.github_link || '';
            }
          } catch {}
          const projectsCount = all.filter((p: any) => p.account.creator.toString() === w).length;
          return { wallet: w, username, bio, github, projects: projectsCount };
        });
        list.sort((a, b) => b.projects - a.projects);
        setFounders(list);
        try { setCache('founders_dir', list, 60_000); } catch {}
      } catch (e) {
        console.error('Founders load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [program]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return founders;
    return founders.filter(f =>
      f.username.toLowerCase().includes(q) ||
      (f.bio || '').toLowerCase().includes(q) ||
      f.wallet.toLowerCase().includes(q)
    );
  }, [founders, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Founders</h1>
          <p className="text-gray-400 text-sm">Discover teams building in Web3</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search founders by name, bio, or wallet"
            className="bg-gray-800 border border-gray-700 rounded-lg text-white px-3 py-2 w-72"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-800/60 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center text-gray-400">
          No founders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => (
            <Link
              key={f.wallet}
              href={`/founders/${f.wallet}`}
              className="group rounded-2xl border border-gray-800 bg-gray-900/60 hover:bg-gray-900 transition-colors p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">{f.username}</div>
                  <div className="text-xs text-gray-500">{f.wallet.slice(0,6)}…{f.wallet.slice(-4)}</div>
                </div>
                <span className="text-xs text-gray-400">{f.projects} projects</span>
              </div>
              {f.bio && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{f.bio}</p>
              )}
              {f.github && (
                <a
                  href={f.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  GitHub →
                </a>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
