'use client';

import { useState, useEffect } from 'react';

interface AvatarProps {
  /** IPFS CID or hash for the profile picture */
  ipfsHash?: string | null;
  /** Display name or username for initials fallback */
  name?: string;
  /** Wallet address for gradient seed */
  wallet?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

// Generate a consistent gradient based on wallet address or name
function getGradient(seed: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-cyan-500 to-blue-500',
  ];

  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name: string): string {
  if (!name) return '?';

  // If it looks like a wallet address (starts with alphanumeric and is long), return first 2 chars
  if (/^[A-Za-z0-9]{32,}$/.test(name)) {
    return name.slice(0, 2).toUpperCase();
  }

  // Split by spaces or special characters and get first letter of each word
  const words = name.split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({
  ipfsHash,
  name = '',
  wallet = '',
  size = 'md',
  className = ''
}: AvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Determine if we should attempt to load an image
  const hasIpfsHash = !!ipfsHash;

  const sizeClass = SIZES[size];
  const gradient = getGradient(wallet || name || 'default');
  const initials = getInitials(name || wallet);

  useEffect(() => {
    if (!hasIpfsHash) {
      return;
    }

    setImageError(false);

    // Try localStorage cache first (for images we uploaded)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`ipfs_image_${ipfsHash}`);
      if (cached) {
        setImageSrc(cached);
        return;
      }
    }

    // Try Pinata gateway
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    setImageSrc(gatewayUrl);
  }, [ipfsHash]);

  const handleImageError = () => {
    setImageError(true);
    setImageSrc(null);
  };

  // Show image if available and no error
  if (imageSrc && !imageError) {
    return (
      <img
        src={imageSrc}
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover border-2 border-white/10 ${className}`}
        onError={handleImageError}
      />
    );
  }

  // Fallback to initials with gradient
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white border-2 border-white/10 ${className}`}
    >
      {initials}
    </div>
  );
}
