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
      className="glass-card block rounded-2xl p-6 relative group overflow-hidden h-full"
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-(--primary) to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header with logo and title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-sm group-hover:border-(--primary) transition-colors">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-(--primary) text-2xl font-bold">◎</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-(--text-primary) mb-1 group-hover:text-(--primary) transition-colors truncate">
            {name}
          </h3>
          {tagline && (
            <p className="text-sm text-(--text-secondary) font-medium line-clamp-1">{tagline}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-(--text-secondary) line-clamp-2 leading-relaxed mb-6 h-10">
          {description}
        </p>
      )}

      {/* Tech stack */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {techStack && techStack.slice(0, 3).map((t, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-(--text-muted) border border-white/5"
          >
            {t}
          </span>
        ))}
        {techStack && techStack.length > 3 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-(--text-muted)">
            +{techStack.length - 3}
          </span>
        )}
      </div>

      {/* Hover arrow indicator */}
      <div className="absolute bottom-4 right-4 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <div className="w-8 h-8 rounded-full bg-(--primary) flex items-center justify-center shadow-lg shadow-(--primary-glow)">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
