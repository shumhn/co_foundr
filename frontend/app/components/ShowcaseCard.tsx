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
  const isExternal = href.startsWith('http');

  return (
    <Link
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="block p-8 relative group overflow-hidden h-full"
    >
      {/* Header with logo and title */}
      <div className="flex items-start gap-5 mb-6">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm group-hover:border-teal-500/50 transition-colors">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-teal-500 text-xl font-bold">◎</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-zinc-100 mb-1 group-hover:text-teal-400 transition-colors truncate">
            {name}
          </h3>
          {tagline && (
            <p className="text-[15px] text-zinc-500 font-medium line-clamp-1">{tagline}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-[15px] text-zinc-400 line-clamp-2 leading-relaxed mb-6 h-11">
          {description}
        </p>
      )}

      {/* Tech stack */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {techStack && techStack.slice(0, 3).map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-bold uppercase tracking-wider bg-zinc-900 text-zinc-500 border border-zinc-800"
          >
            {t}
          </span>
        ))}
      </div>


      {/* Hover indicator (Subtle) */}
      <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

