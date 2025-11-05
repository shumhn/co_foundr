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
      className="group relative block bg-(--surface) rounded-2xl border border-(--border) hover:border-[#00D4AA] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#00D4AA] to-[#00B894]" />
      
      <div className="p-6">
        {/* Header with logo and title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-(--surface-hover) border border-(--border) overflow-hidden shadow-sm">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-[#00D4AA] text-2xl font-bold">◎</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-(--text-primary) mb-1 group-hover:text-[#00D4AA] transition-colors truncate">
              {name}
            </h3>
            {tagline && (
              <p className="text-sm text-(--text-secondary) font-medium line-clamp-1">{tagline}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-(--text-secondary) line-clamp-2 leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Tech stack */}
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.slice(0, 4).map((t, i) => (
              <span 
                key={i} 
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-(--surface-hover) text-(--text-primary) border border-(--border)"
              >
                {t}
              </span>
            ))}
            {techStack.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-(--surface-hover) text-(--text-muted)">
                +{techStack.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover arrow indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-[#00D4AA] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
