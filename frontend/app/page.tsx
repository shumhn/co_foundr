'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAnchorProgram, getUserPDA } from './hooks/useAnchorProgram';
import { PublicKey } from '@solana/web3.js';
import ShowcaseCard from './components/ShowcaseCard';
import { rpcWithRetry } from './utils/rpcRetry';
import { getCache, setCache } from './utils/cache';

interface ProjectItem {
  publicKey: PublicKey;
  account: any;
}

interface FounderItem {
  wallet: string;
  username: string;
  bio?: string;
  projects: number;
}

export default function Home() {
  const { program } = useAnchorProgram();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [founders, setFounders] = useState<FounderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!program) return;
      if (loadedRef.current) return; // prevent double-fetch in React strict/dev
      loadedRef.current = true;
      setLoading(true);
      try {
        // Try cache first for instant paint
        const cachedProjects = getCache<any[]>('showcase_projects');
        if (cachedProjects) {
          const restored: ProjectItem[] = cachedProjects.map((p: any) => ({ publicKey: new PublicKey(p.pubkey), account: p.account }));
          setProjects(restored);
        }

        // Fetch with retry
        const all = (await rpcWithRetry(() => (program as any).account.project.all())) as any[];
        setProjects(all as unknown as ProjectItem[]);
        try {
          const toCache = all.map((p: any) => ({ pubkey: p.publicKey.toString(), account: p.account }));
          setCache('showcase_projects', toCache, 60_000);
        } catch {}

        // Derive founders from projects
        const creatorSet: string[] = Array.from(new Set((all as any[]).map((p: any) => p.account.creator.toString()))) as string[];
        // Fetch user accounts in batch
        const pdas = creatorSet.map((w: string) => getUserPDA(new PublicKey(w))[0]);
        // Use cache if present
        const cachedFounders = getCache<FounderItem[]>('showcase_founders');
        if (cachedFounders) {
          setFounders(cachedFounders);
        }
        let infos: any[] = [];
        if (pdas.length > 0) {
          infos = (await rpcWithRetry(() => (program as any).provider.connection.getMultipleAccountsInfo(pdas, 'processed'))) as any[];
        }
        const list: FounderItem[] = creatorSet.map((w: string, i: number) => {
          let username = w.slice(0, 4) + '…' + w.slice(-4);
          let bio = '';
          try {
            if (infos && infos[i]) {
              const dec = (program as any).coder.accounts.decode('User', (infos[i] as any)!.data);
              username = dec.username || username;
              bio = dec.bio || '';
            }
          } catch {}
          const projectsCount = (all as any[]).filter((p: any) => p.account.creator.toString() === w).length;
          return { wallet: w, username, bio, projects: projectsCount };
        });
        // Sort founders by #projects desc
        list.sort((a, b) => b.projects - a.projects);
        setFounders(list);
        try {
          setCache('showcase_founders', list, 60_000);
        } catch {}
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Showcase load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [program]);

  const featured = useMemo(() => projects.slice(0, 6), [projects]);

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <section className="text-center mb-16 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-purple-500/30 text-purple-300 text-xs font-medium mb-6 animate-pulse">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            <span>Built on Solana</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6" style={{fontFamily: "'Space Grotesk', sans-serif"}}>
            <span className="gradient-text">Showcase</span> your Web3 project.
            <br />
            <span className="text-white">Connect with builders.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            The premier platform for Web3 founders to showcase their projects, share their vision, and discover like-minded teams building the future.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/projects/new" className="group px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
              <span className="flex items-center gap-2">
                Submit Project
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link href="/projects" className="px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold border border-white/10 hover:border-white/20 transition-all">
              Explore Projects
            </Link>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white" style={{fontFamily: "'Space Grotesk', sans-serif"}}>Featured Projects</h2>
              <p className="text-gray-500 text-sm mt-1">Discover what builders are creating</p>
            </div>
            <Link href="/projects" className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl glass animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="rounded-2xl glass p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🚀</div>
              <p className="text-gray-400">No projects yet. Be the first to showcase your work.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((p: any) => {
                const logoHash = p.account.logoHash || p.account.logo_hash || null;
                const logoUrl = logoHash ? `https://ipfs.io/ipfs/${logoHash}` : null;
                const tech = p.account.techStack || p.account.tech_stack || [];
                return (
                  <ShowcaseCard
                    key={p.publicKey.toString()}
                    href={`/projects/${p.publicKey.toString()}`}
                    name={p.account.name}
                    tagline={p.account.collabIntent || p.account.collab_intent}
                    description={p.account.description}
                    logoUrl={logoUrl}
                    techStack={tech}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Founders Spotlight */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white" style={{fontFamily: "'Space Grotesk', sans-serif"}}>Founders Spotlight</h2>
              <p className="text-gray-500 text-sm mt-1">Meet the teams behind the projects</p>
            </div>
            <Link href="/founders" className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl glass animate-pulse" />
              ))}
            </div>
          ) : founders.length === 0 ? (
            <div className="rounded-2xl glass p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">👤</div>
              <p className="text-gray-400">No founders yet. Create a profile and submit a project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {founders.slice(0, 6).map((f) => (
                <Link
                  key={f.wallet}
                  href={`/profile?wallet=${f.wallet}`}
                  className="group rounded-2xl glass hover:glass-strong transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-semibold group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">{f.username}</div>
                    <span className="text-xs glass-strong px-2 py-0.5 rounded-full border border-white/10">{f.projects}</span>
                  </div>
                  {f.bio && (
                    <p className="text-sm text-gray-400 line-clamp-2">{f.bio}</p>
                  )}
                  {!f.bio && (
                    <p className="text-sm text-gray-500">{f.wallet.slice(0, 6)}…{f.wallet.slice(-4)}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
