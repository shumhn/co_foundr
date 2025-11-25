'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Space_Grotesk, Outfit } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['700'] });
const bodyFont = Outfit({ subsets: ['latin'], weight: ['400', '500', '600'] });

import { useAnchorProgram, getUserPDA } from './hooks/useAnchorProgram';
import { PublicKey } from '@solana/web3.js';
import ShowcaseCard from './components/ShowcaseCard';
import { rpcWithRetry } from './utils/rpcRetry';
import { getCache, setCache } from './utils/cache';
import { mockProjects, mockFounders } from './utils/mockData';

interface ProjectItem {
  publicKey: PublicKey;
  account: any;
}

interface FounderItem {
  wallet: string;
  username: string;
  displayName?: string;
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
      if (!program) {
        setLoading(false);
        return;
      }
      if (loadedRef.current) return;
      loadedRef.current = true;
      setLoading(true);
      try {
        const cachedProjects = getCache<any[]>('showcase_projects');
        if (cachedProjects) {
          const restored: ProjectItem[] = cachedProjects.map((p: any) => ({ publicKey: new PublicKey(p.pubkey), account: p.account }));
          setProjects(restored);
        }

        const all = (await rpcWithRetry(() => (program as any).account.project.all())) as any[];
        all.sort((a: any, b: any) => (b.account.timestamp?.toNumber() || 0) - (a.account.timestamp?.toNumber() || 0));
        setProjects(all as unknown as ProjectItem[]);
        try {
          const toCache = all.map((p: any) => ({ pubkey: p.publicKey.toString(), account: p.account }));
          setCache('showcase_projects', toCache, 60_000);
        } catch {}

        const creatorSet: string[] = Array.from(new Set((all as any[]).map((p: any) => p.account.creator.toString()))) as string[];
        const pdas = creatorSet.map((w: string) => getUserPDA(new PublicKey(w))[0]);
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
          let displayName = '';
          let bio = '';
          try {
            if (infos && infos[i]) {
              const dec = (program as any).coder.accounts.decode('User', (infos[i] as any)!.data);
              username = dec.username || username;
              displayName = dec.display_name || '';
              bio = dec.bio || '';
            }
          } catch {}
          const projectsCount = (all as any[]).filter((p: any) => p.account.creator.toString() === w).length;
          return { wallet: w, username, displayName, bio, projects: projectsCount };
        });
        list.sort((a, b) => b.projects - a.projects);
        setFounders(list);
        try {
          setCache('showcase_founders', list, 60_000);
        } catch {}
      } catch (e) {
        console.error('Showcase load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [program]);

  const featured = useMemo(() => projects.length > 0 ? projects.slice(0, 3) : [], [projects]);
  const displayProjects = featured.length > 0 ? featured : mockProjects.slice(0, 3);
  const displayFounders = founders.length > 0 ? founders.slice(0, 3) : mockFounders.slice(0, 3);

  return (
    <div className={`min-h-screen bg-(--background) ${bodyFont.className} overflow-hidden`}>
      {/* Decorative blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <section className="mb-32 pt-20 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-[100px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400 tracking-wide uppercase">Live on Solana Devnet</span>
          </div>

          <h1 className={`${display.className} text-7xl md:text-8xl font-bold mb-8 leading-tight tracking-tight`}>
            <span className="block text-gradient">Build the Next</span>
            <span className="block text-gradient-primary">Killer Project</span>
          </h1>

          <p className="text-xl md:text-2xl text-(--text-secondary) mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Connect with elite Web3 developers, form dream teams, and ship scalable dApps on Solana.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link 
              href="/projects/new" 
              className="group relative px-8 py-4 bg-(--primary) hover:bg-(--primary-hover) text-black font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_var(--primary)]"
            >
              Start Building
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
            </Link>
            <Link 
              href="/founders" 
              className="px-8 py-4 glass hover:bg-(--surface-hover) text-(--text-primary) font-bold text-lg rounded-xl transition-all hover:scale-105 border border-white/10"
            >
              Find Teammates
            </Link>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="mb-32">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className={`${display.className} text-4xl font-bold text-(--text-primary) mb-2`}>Featured Projects</h2>
              <p className="text-(--text-secondary) text-lg">Exceptional work from the community</p>
            </div>
            <Link href="/projects" className="group flex items-center gap-2 text-(--primary) font-semibold hover:text-(--primary-hover) transition-colors">
              View all 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-3xl glass animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayProjects.map((p: any) => {
                const isMock = !p.publicKey;
                const props = isMock ? {
                  href: p.projectUrl || '#',
                  name: p.name,
                  tagline: p.tagline,
                  description: p.description,
                  logoUrl: p.logoUrl,
                  techStack: p.techStack
                } : {
                  href: `/projects/${p.publicKey.toString()}`,
                  name: typeof p.account.name === 'string' ? p.account.name : (p.account.name?.value ?? ''),
                  tagline: typeof (p.account.collabIntent || p.account.collab_intent) === 'string' ? (p.account.collabIntent || p.account.collab_intent) : ((p.account.collabIntent || p.account.collab_intent)?.value ?? ''),
                  description: typeof p.account.description === 'string' ? p.account.description : (p.account.description?.value ?? ''),
                  logoUrl: (p.account.logoHash || p.account.logo_hash) ? `https://ipfs.io/ipfs/${p.account.logoHash || p.account.logo_hash}` : null,
                  techStack: (p.account.techStack || p.account.tech_stack || []).map((t: any) => typeof t === 'string' ? t : (t?.value ?? '')).filter(Boolean)
                };

                return (
                  <div key={isMock ? p.id : p.publicKey.toString()} className="group">
                    <ShowcaseCard {...props} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Founders Spotlight */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className={`${display.className} text-4xl font-bold text-(--text-primary) mb-2`}>Top Builders</h2>
              <p className="text-(--text-secondary) text-lg">The minds behind the code</p>
            </div>
            <Link href="/founders" className="group flex items-center gap-2 text-(--primary) font-semibold hover:text-(--primary-hover) transition-colors">
              View all 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl glass animate-pulse" />
              ))
            ) : (
              displayFounders.slice(0, 6).map((f: any) => {
                const isMock = !f.wallet || f.wallet.match(/^[1-9]{32}$/);
                const href = isMock ? (f.socialLink || '#') : `/profile?wallet=${f.wallet}`;
                
                return (
                  <Link
                    key={f.wallet || f.username}
                    href={href}
                    target={isMock && f.socialLink ? '_blank' : undefined}
                    rel={isMock && f.socialLink ? 'noopener noreferrer' : undefined}
                    className="glass-card p-6 rounded-2xl block group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {(() => {
                          const src = f?.profilePicture;
                          const valid = typeof src === 'string' && src.trim().length > 0;
                          return valid ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={src}
                              alt={f.name || f.username}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white/10 group-hover:border-(--primary) transition-colors"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/10 flex items-center justify-center text-2xl group-hover:border-(--primary) transition-colors">
                              👤
                            </div>
                          );
                        })()}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-(--surface) rounded-full flex items-center justify-center border border-white/10">
                          <span className="text-[10px]">🚀</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-(--text-primary) truncate group-hover:text-(--primary) transition-colors">
                          {f.name || f.displayName || f.username}
                        </h3>
                        <p className="text-sm text-(--text-secondary) font-medium mb-1">@{f.username}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-(--text-muted) border border-white/5">
                            {f.projects} {f.projects === 1 ? 'Project' : 'Projects'}
                          </span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-(--primary) group-hover:text-black transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
