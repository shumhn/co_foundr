'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Space_Grotesk, Outfit } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['700'] });
const bodyFont = Outfit({ subsets: ['latin'], weight: ['400', '500', '600'] });

import { useAnchorProgram, getUserPDA } from './hooks/useAnchorProgram';
import { PublicKey } from '@solana/web3.js';
import ShowcaseCard from './components/ShowcaseCard';
import NeonCard from './components/NeonCard';
import GlitchText from './components/GlitchText';
import Avatar from './components/Avatar';
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
  profilePicture?: string;
  ipfsMetadataHash?: string;
  role?: string;
  socialLink?: string;
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
        } catch { }

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
          let profilePicture = '';
          let ipfsMetadataHash = '';
          let role = '';

          try {
            if (infos && infos[i]) {
              const dec = (program as any).coder.accounts.decode('User', (infos[i] as any)!.data);
              username = dec.username || username;
              displayName = dec.display_name || '';
              bio = dec.bio || '';
              ipfsMetadataHash = dec.ipfs_metadata_hash || '';
              role = dec.role ? Object.keys(dec.role)[0] : '';
            }
          } catch { }
          const projectsCount = (all as any[]).filter((p: any) => p.account.creator.toString() === w).length;
          return { wallet: w, username, displayName, bio, projects: projectsCount, ipfsMetadataHash, role };
        });
        list.sort((a, b) => b.projects - a.projects);
        setFounders(list);
        try {
          setCache('showcase_founders', list, 60_000);
        } catch { }
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
    <div className={`min-h-screen bg-[#030712] ${bodyFont.className} overflow-x-hidden selection:bg-[#00D4AA] selection:text-black`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

        {/* Animated Aurora */}
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] animate-[aurora-move_20s_linear_infinite] opacity-30 blur-[100px] mix-blend-screen bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_60deg,var(--secondary)_120deg,transparent_180deg)]" />

        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-float-y delay-1000" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D4AA]/20 rounded-full blur-[128px] animate-float-y delay-75" />
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <section className="mb-32 pt-32 text-center relative perspective-[1000px]">

          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 mb-12 backdrop-blur-md animate-pulse-neon">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
            </span>
            <span className="text-sm font-bold text-[var(--primary)] tracking-widest uppercase font-mono">System Online: Solana Devnet</span>
          </div>

          <h1 className={`${display.className} text-7xl md:text-[8rem] font-black mb-12 leading-none tracking-tighter mix-blend-lighten`}>
            <span className="block hover:scale-[1.02] transition-transform duration-300">
              <GlitchText text="BUILD THE" />
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] drop-shadow-[0_0_30px_rgba(0,212,170,0.5)]">
              <GlitchText text="IMPOSSIBLE" className="animate-pulse" />
            </span>
          </h1>

          <p className="text-xl md:text-3xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed font-light border-l-4 border-[var(--primary)] pl-6 text-left">
            Construct decentralized realities. Unite with elite architects. <span className="text-white font-bold">Ship software that eats the world.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-8">
            <Link
              href="/projects/new"
              className="group relative px-10 py-5 bg-[var(--primary)] text-black font-black text-xl rounded-sm skew-x-[-10deg] hover:skew-x-0 transition-all hover:scale-110 hover:shadow-[0_0_60px_-15px_var(--primary)]"
            >
              <span className="block skew-x-[10deg] group-hover:skew-x-0">INITIALIZE PROJECT_</span>
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
            </Link>

            <Link
              href="/founders"
              className="group px-10 py-5 border border-[var(--primary)] text-[var(--primary)] font-bold text-xl rounded-sm skew-x-[-10deg] hover:skew-x-0 hover:bg-[var(--primary)]/10 transition-all hover:scale-105 backdrop-blur-sm"
            >
              <span className="block skew-x-[10deg] group-hover:skew-x-0 tracking-widest">LOCATE_ALLIES //</span>
            </Link>
          </div>
        </section>

        {/* Tech Marquee */}
        <section className="mb-40 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030712] to-transparent z-20" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030712] to-transparent z-20" />

          <div className="flex gap-16 animate-[aurora-move_20s_linear_infinite] w-max opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['SOLANA', 'RUST', 'REACT', 'IPFS', 'ANCHOR', 'NEXT.JS', 'TYPESCRIPT', 'TAILWIND', 'SOLANA', 'RUST'].map((tech, i) => (
              <span key={i} className={`${display.className} text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10`}>
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Featured Projects */}
        <section className="mb-40">
          <div className="flex items-end justify-between mb-16 border-b border-gray-800 pb-4">
            <div>
              <h2 className={`${display.className} text-5xl font-black text-white mb-2 tracking-tighter`}>
                <span className="text-[var(--primary)]">//</span> FEATURED_PROJECTS
              </h2>
            </div>
            <Link href="/projects" className="font-mono text-[var(--primary)] hover:text-white transition-colors tracking-widest">
              VIEW_DATABASE [→]
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-[2000px]">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[400px] rounded-3xl bg-[var(--surface)] animate-pulse border border-[var(--border)]" />
              ))
            ) : (
              displayProjects.map((p: any, i) => {
                const isMock = !p.publicKey || p.publicKey.toString().length < 10;

                const cardProps = isMock ? {
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
                    <NeonCard>
                      <ShowcaseCard {...cardProps} />
                    </NeonCard>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Founders Spotlight */}
        <section className="mb-20">
          <div className="flex items-end justify-between mb-16 border-b border-gray-800 pb-4">
            <div>
              <h2 className={`${display.className} text-5xl font-black text-white mb-2 tracking-tighter`}>
                <span className="text-[#6366f1]">//</span> TOP_BUILDERS
              </h2>
            </div>
            <Link href="/founders" className="font-mono text-[#6366f1] hover:text-white transition-colors tracking-widest">
              ACCESS_DIRECTORY [→]
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                      <div className="h-5 bg-white/10 rounded-full w-20" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10" />
                  </div>
                </div>
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
                    className="group relative block"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
                    <div className="relative bg-[#0f172a] p-6 rounded-2xl border border-white/5 hover:border-transparent transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar
                          ipfsHash={f.profilePicture || f.ipfsMetadataHash}
                          name={f.displayName || f.username}
                          wallet={f.wallet}
                          size="lg"
                          className="shrink-0 ring-2 ring-white/10 group-hover:ring-[var(--primary)] transition-all"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-white group-hover:text-[var(--primary)] truncate transition-colors font-mono">
                            {f.displayName || f.username}
                          </h3>
                          <p className="text-sm text-gray-400 truncate">@{f.username}</p>
                          <div className="flex gap-2 mt-2">
                            {f.role && (
                              <span className="text-[10px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded text-gray-300 border border-white/5">
                                {f.role}
                              </span>
                            )}
                            <span className="text-[10px] uppercase tracking-wider bg-[var(--primary)]/10 px-2 py-0.5 rounded text-[var(--primary)] border border-[var(--primary)]/20">
                              {f.projects} PROJ
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-black transition-all">
                          →
                        </div>
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
