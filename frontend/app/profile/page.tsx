'use client';

import EnhancedUserProfile from '../components/EnhancedUserProfile';
import { Sora } from 'next/font/google';

const premium = Sora({ subsets: ['latin'], weight: ['400', '600'] });

export default function ProfilePage() {
  return (
    <div className={`min-h-screen bg-[#F8F9FA] ${premium.className}`}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <EnhancedUserProfile />
      </div>
    </div>
  );
}
