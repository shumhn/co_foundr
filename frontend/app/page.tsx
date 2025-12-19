'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Space_Grotesk, Outfit } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className={`min-h-screen bg-[#09090b] ${bodyFont.className} overflow-x-hidden selection:bg-teal-500/30 selection:text-white`}>
      {/* Precision Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

        {/* Subtle Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-teal-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="max-w-7xl mx-auto px-8 relative z-10 pt-24">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-24 text-center relative"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-teal-500/10 bg-teal-500/5 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-xs font-bold text-teal-500/80 tracking-[0.2em] uppercase font-mono">
              Solana Devnet
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`${display.className} text-6xl md:text-7xl font-bold mb-10 leading-[1.1] tracking-tight max-w-5xl mx-auto`}
          >
            The Premier Network for
            <span className="block text-teal-500">
              Solana's Most Ambitious Founders.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Find your co-founder, share your vision, and scale your protocol on Solana. No fluff, just code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              href="/projects/new"
              className="px-8 py-3.5 bg-zinc-50 text-zinc-950 font-bold text-sm rounded-lg hover:bg-white transition-all hover:scale-[1.05] active:scale-95 shadow-lg shadow-white/10"
            >
              Initialize Project
            </Link>
            <Link
              href="/founders"
              className="px-8 py-3.5 bg-transparent text-zinc-100 font-bold text-sm rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all active:scale-95"
            >
              Locate Allies
            </Link>
          </motion.div>
        </motion.section>

        {/* Tech Marquee / Stats Bar */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-24 border-y border-zinc-900 py-10 relative overflow-hidden backdrop-blur-[2px]"
        >
          <div className="flex justify-around items-center gap-12 text-zinc-500 select-none">
            {['Solana', 'Rust', 'Anchor', 'IPFS', 'Next.js', 'TypeScript'].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 0.5, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default scale-110"
              >
                <span className="text-xl font-bold tracking-tighter uppercase font-mono">{tech}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Featured Projects */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="mb-24"
        >
          <div className="flex items-end justify-between mb-10">
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
              <p className="text-[13px] font-bold text-teal-500 tracking-[0.2em] uppercase mb-2">Curated Gallery</p>
              <h2 className={`${display.className} text-4xl font-bold text-white tracking-tight`}>
                Latest Projects
              </h2>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <Link href="/projects" className="text-base font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group">
                View Database <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
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
                  <motion.div
                    key={isMock ? p.id : p.publicKey.toString()}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="relative group">
                      <div className="border-beam opacity-0 group-hover:opacity-100 transition-opacity" />
                      <NeonCard>
                        <ShowcaseCard {...cardProps} />
                      </NeonCard>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Founders Spotlight */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="mb-32"
        >
          <div className="flex items-end justify-between mb-10">
            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}>
              <p className="text-[13px] font-bold text-indigo-500 tracking-[0.2em] uppercase mb-2">Verified Founders</p>
              <h2 className={`${display.className} text-4xl font-bold text-white tracking-tight`}>
                Top Builders
              </h2>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}>
              <Link href="/founders" className="text-base font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group">
                Access Directory <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))
            ) : (
              displayFounders.slice(0, 6).map((f: any) => {
                const isMock = !f.wallet || f.wallet.match(/^[1-9]{32}$/);
                const href = isMock ? (f.socialLink || '#') : `/profile?wallet=${f.wallet}`;

                return (
                  <motion.div
                    key={f.wallet || f.username}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95 },
                      show: { opacity: 1, scale: 1 }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={href}
                      target={isMock && f.socialLink ? '_blank' : undefined}
                      rel={isMock && f.socialLink ? 'noopener noreferrer' : undefined}
                      className="group relative block"
                    >
                      <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all shadow-sm shadow-black/20">
                        <div className="border-beam opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4">
                          <Avatar
                            ipfsHash={f.profilePicture || f.ipfsMetadataHash}
                            name={f.displayName || f.username}
                            wallet={f.wallet}
                            size="lg"
                            className="shrink-0 ring-1 ring-zinc-800 group-hover:ring-teal-500/50 transition-all"
                          />

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl text-zinc-100 group-hover:text-teal-400 truncate transition-colors font-mono">
                              {f.displayName || f.username}
                            </h3>
                            <p className="text-[13px] text-zinc-500 truncate mt-0.5">@{f.username}</p>
                            <div className="flex gap-2 mt-2">
                              {f.role && (
                                <span className="text-[13px] uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
                                  {f.role}
                                </span>
                              )}
                              <span className="text-[13px] uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded text-teal-500 border border-teal-500/20">
                                {f.projects} Projects
                              </span>
                            </div>
                          </div>

                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300 transition-all opacity-0 group-hover:opacity-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
}

