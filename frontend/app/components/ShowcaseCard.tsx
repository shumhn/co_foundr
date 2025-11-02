'use client';

import Link from 'next/link';

interface ShowcaseCardProps {
  href: string;
  name: string;
  tagline?: string;
  description?: string;
  logoUrl?: string | null;
  techStack?: string[];
}

export default function ShowcaseCard({ href, name, tagline, description, logoUrl, techStack = [] }: ShowcaseCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl glass hover:glass-strong transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
    >
      <div className="flex items-start gap-4 p-5">
        <div className="shrink-0 w-14 h-14 rounded-xl glass-strong border border-white/10 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-purple-400 text-lg">🧩</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all">{name}</h3>
          </div>
          {tagline ? (
            <p className="text-sm text-gray-300 line-clamp-1">{tagline}</p>
          ) : (
            <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
          )}
          {techStack && techStack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {techStack.slice(0, 5).map((t, i) => (
                <span key={i} className="text-[10px] glass-strong text-gray-200 border border-white/10 rounded px-2 py-0.5">
                  {t}
                </span>
              ))}
              {techStack.length > 5 && (
                <span className="text-[10px] text-gray-400">+{techStack.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </Link>
  );
}
