'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProgram, getUserPDA } from '../../hooks/useAnchorProgram';
import { rpcWithRetry } from '../../utils/rpcRetry';
import ShowcaseCard from '../../components/ShowcaseCard';

export default function FounderProfilePage() {
  const params = useParams();
  const walletParam = params?.wallet as string | undefined;
  const { program } = useAnchorProgram();

  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-4)}`;

  useEffect(() => {
    const run = async () => {
      if (!program || !walletParam) return;
      setLoading(true);
      try {
        const wallet = new PublicKey(walletParam);
        // Fetch profile
        const [userPda] = getUserPDA(wallet);
        const info = (await rpcWithRetry(() => (program as any).provider.connection.getAccountInfo(userPda, 'processed')));
        let user: any = null;
        try {
          if (info && (info as any).data) user = (program as any).coder.accounts.decode('User', (info as any).data);
        } catch {}
        setProfile(user);

        // Fetch all projects then filter by creator
        const all = (await rpcWithRetry(() => (program as any).account.project.all())) as any[];
        const mine = all.filter((p: any) => p.account.creator.toString() === wallet.toString());
        setProjects(mine);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Founder profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [program, walletParam]);

  const username = useMemo(() => profile?.username || (walletParam ? short(walletParam) : 'Founder'), [profile, walletParam]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/founders" className="text-blue-400 hover:underline inline-block mb-4">← Back to Founders</Link>

      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{username}</h1>
            <div className="text-sm text-gray-400 mt-1">{walletParam && short(walletParam)}</div>
            {profile?.bio && <p className="text-gray-300 mt-3 max-w-2xl whitespace-pre-wrap">{profile.bio}</p>}
            {profile?.githubLink && (
              <a href={profile.githubLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm">GitHub →</a>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold text-white">{projects.length}</div>
            <div className="text-xs text-gray-400">projects</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Projects by {username}</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-800/60 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center text-gray-400">
          No projects yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => {
            const logoHash = p.account.logoHash || p.account.logo_hash || p.account.logoIpfsHash || null;
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
    </div>
  );
}
