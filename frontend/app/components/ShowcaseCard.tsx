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
      className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-[#00D4AA] bg-white hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start gap-4 p-5">
        <div className="shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-[#00D4AA] text-base">◎</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-gray-900 font-bold truncate">{name}</h3>
          </div>
          {tagline ? (
            <p className="text-sm text-gray-600 line-clamp-1">{tagline}</p>
          ) : (
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
          {techStack && techStack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {techStack.slice(0, 5).map((t, i) => (
                <span key={i} className="text-[10px] text-gray-600 bg-gray-100 rounded px-2 py-0.5 font-medium">
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

    </Link>
  );
}
