'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [exploreOpen, setExploreOpen] = useState(true);

  const isActive = (path: string) => pathname === path;

  const navSections = [
    {
      title: 'Main',
      items: [
        { href: '/', label: 'Home' },
        { href: '/dashboard', label: 'Dashboard' },
      ],
    },
    {
      title: 'Explore',
      collapsible: true,
      isOpen: exploreOpen,
      toggle: () => setExploreOpen(!exploreOpen),
      items: [
        { href: '/projects', label: 'Projects' },
        { href: '/founders', label: 'Founders' },
        { href: '/requests', label: 'Requests' },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/profile', label: 'My Profile' },
      ],
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <Link href="/" className="block mb-8">
          <h1 className="text-2xl font-bold text-gray-900">DevCol</h1>
          <p className="text-xs text-gray-500 mt-1">Developer Collaboration</p>
        </Link>

        {/* Navigation Sections */}
        <div className="space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {section.collapsible ? (
                <button
                  onClick={section.toggle}
                  className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-3"
                >
                  <span>{section.title}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${section.isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{section.title}</h3>
              )}

              {(!section.collapsible || section.isOpen) && (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
