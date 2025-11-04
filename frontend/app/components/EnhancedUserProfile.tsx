'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram, getUserPDA } from '../hooks/useAnchorProgram';
import { SystemProgram } from '@solana/web3.js';
import { uploadImageToIPFS, uploadMetadataToIPFS, fetchMetadataFromIPFS, createDefaultMetadata } from '../utils/ipfs';
import { Space_Grotesk, Sora } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['700'] });
const premium = Sora({ subsets: ['latin'], weight: ['400', '600'] });

const ROLES = ['Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'Smart Contract Developer', 'Designer', 'DevOps', 'Product Manager', 'Other'];
const TECH_STACKS = ['Solana', 'Anchor', 'React', 'Next.js', 'TypeScript', 'Rust', 'Node.js', 'Python', 'Go', 'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Other'];
const TECH_EMOJI: Record<string, string> = {
  'React': '⚛️',
  'Next.js': '⚡',
  'TypeScript': '🔷',
  'Node.js': '🟢',
  'Solana': '◎',
  'Anchor': '⚓',
  'Rust': '🦀',
  'PostgreSQL': '🐘',
  'MongoDB': '🍃',
  'GraphQL': '🌐',
  'Docker': '🐳',
  'Kubernetes': '☸️',
  'AWS': '☁️',
  'Python': '🐍',
  'Go': '🐹',
};

export default function EnhancedUserProfile() {
  const { publicKey } = useWallet();
  const { program } = useAnchorProgram();
  const [user, setUser] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profilePicPreview, setProfilePicPreview] = useState<string>('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  type ProfileForm = { username: string; displayName: string; role: string; country: string; bio: string; githubUrl: string; twitterUrl: string };
  type ProfileErrors = { username: string; role: string; techStack: string; githubUrl: string; twitterUrl: string; displayName?: string };

  const [formData, setFormData] = useState<ProfileForm>({
    username: '',
    displayName: '',
    role: '',
    country: '',
    bio: '',
    githubUrl: '',
    twitterUrl: '',
  });
  // Multi-select tech stacks (saved to IPFS metadata)
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState<string>('');

  const [errors, setErrors] = useState<ProfileErrors>({
    username: '',
    role: '',
    techStack: '',
    githubUrl: '',
    twitterUrl: '',
  });

  useEffect(() => {
    if (publicKey && program) {
      fetchUser();
    }
  }, [publicKey, program]);

  const fetchUser = async () => {
    if (!publicKey || !program) return;
    try {
      const [userPDA] = getUserPDA(publicKey);
      const userAccount = await (program as any).account.user.fetch(userPDA);
      setUser(userAccount);
      if (userAccount.ipfsMetadataHash) {
        const ipfsData = await fetchMetadataFromIPFS(userAccount.ipfsMetadataHash);
        setMetadata(ipfsData);
      }
    } catch (error) {
      console.log('User not found');
      setUser(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: ProfileErrors = {
      username: '',
      role: '',
      techStack: '',
      githubUrl: '',
      twitterUrl: '',
    };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
      isValid = false;
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
      isValid = false;
    }

    if (techStacks.length === 0) {
      newErrors.techStack = 'Tech stack is required';
      isValid = false;
    }

    if (!formData.githubUrl.trim()) {
      newErrors.githubUrl = 'GitHub profile URL is required';
      isValid = false;
    } else if (!formData.githubUrl.match(/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/)) {
      newErrors.githubUrl = 'Please enter a valid GitHub profile URL';
      isValid = false;
    }

    if (!formData.twitterUrl.trim()) {
      newErrors.twitterUrl = 'Twitter profile URL is required';
      isValid = false;
    } else if (!formData.twitterUrl.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/[a-zA-Z0-9_]+\/?$/)) {
      newErrors.twitterUrl = 'Please enter a valid Twitter/X profile URL';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }
    if (!publicKey || !program) {
      alert('⚠️ Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Creating/updating profile with publicKey:', publicKey.toString());
      let profilePicHash = '';
      if (profilePicFile) {
        profilePicHash = await uploadImageToIPFS(profilePicFile);
      }

      const metadataObj = {
        profile_picture: profilePicHash,
        social_links: { twitter: formData.twitterUrl, github: formData.githubUrl },
        display_name: formData.displayName || undefined,
        tech_stack: techStacks.length ? techStacks : undefined,
        country: formData.country || undefined,
      };
      const metadataHash = await uploadMetadataToIPFS(metadataObj);

      const [userPDA] = getUserPDA(publicKey);
      console.log('🔑 User PDA:', userPDA.toString());
      console.log('👤 PublicKey:', publicKey.toString());

      if (isEditing && user) {
        await (program as any).methods
          // IDL: update_user(display_name?, role?, location?, bio?, github_link?, ipfs_metadata_hash?, open_to_collab?, profile_visibility?)
          .updateUser(
            formData.displayName ? formData.displayName : null, // display_name
            formData.role ? formData.role : null, // role
            formData.country ? formData.country : null, // location
            formData.bio ? formData.bio : null, // bio
            formData.githubUrl ? formData.githubUrl : null, // github_link
            metadataHash ? metadataHash : null, // ipfs_metadata_hash
            null, // open_to_collab
            null // profile_visibility
          )
          .accounts({ 
            user: userPDA,
            signer: publicKey,
            wallet: publicKey,
          })
          .rpc();
        alert('Profile updated successfully!');
      } else {
        console.log('🆕 Creating new profile...');
        console.log('  - Username:', formData.username);
        console.log('  - User PDA:', userPDA.toString());
        console.log('  - Authority:', publicKey.toString());
        
        if (!publicKey) {
          throw new Error('PublicKey is null - wallet may have disconnected');
        }
        
        const { SystemProgram } = await import('@solana/web3.js');
        
        await (program as any).methods
          .createUser(
            formData.username,
            formData.displayName || formData.username, // display_name
            formData.role,
            formData.country || '', // location
            formData.bio,
            formData.githubUrl,
            metadataHash
          )
          .accounts({ 
            user: userPDA, 
            signer: publicKey,  // Changed from 'authority' to 'signer'
            systemProgram: SystemProgram.programId 
          })
          .rpc();
        
        console.log('✅ Profile created successfully!');
        alert('Profile created successfully!');
      }

      await fetchUser();
      setShowCreateForm(false);
      setIsEditing(false);
      setFormData({ username: '', displayName: '', role: '', country: '', bio: '', githubUrl: '', twitterUrl: '' });
      setTechStacks([]);
      setCustomTech('');
      setProfilePicFile(null);
      setProfilePicPreview('');
    } catch (error: any) {
      console.error('❌ Profile save error:', error);
      console.error('Error details:', {
        message: error.message,
        logs: error.logs,
        code: error.code
      });
      
      let errorMsg = 'Failed to save profile';
      if (error.message?.includes('Account `user` not provided')) {
        errorMsg = 'Wallet connection issue. Please disconnect and reconnect your wallet, then try again.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
        <h2 className={`${display.className} text-2xl font-bold text-gray-900 mb-2`}>Connect Your Wallet</h2>
        <p className="text-gray-600">Connect your Phantom wallet to create your developer profile</p>
      </div>
    );
  }

  // Show existing profile
  if (user && !showCreateForm && !isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="h-32 bg-linear-to-r from-[#00D4AA] to-[#00B894]"></div>

        <div className="relative px-8 pb-8">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-8">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
              {metadata?.profile_picture ? (
                <img 
                  src={typeof window !== 'undefined' ? localStorage.getItem(`ipfs_image_${metadata.profile_picture}`) || '' : ''} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-4xl text-gray-400">?</span>
              )}
            </div>
          </div>

          <div className="pt-20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className={`${display.className} text-3xl font-bold text-gray-900 mb-1`}>
                  {user.display_name || user.username}
                </h2>
                <p className="text-[#00D4AA] font-semibold">@{user.username}</p>
                <p className="text-gray-600 mt-1">{user.role}</p>
              </div>

              {/* Country display */}
              {(formData.country || (metadata as any)?.country || (user as any)?.location) && (
                <div className="mt-4">
                  <h3 className="text-gray-900 font-bold mb-1">Country</h3>
                  <p className="text-gray-700">{(metadata as any)?.country || (user as any)?.location}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setFormData({
                    username: user.username,
                    displayName: (metadata as any)?.display_name || '',
                    role: user.role,
                    country: (metadata as any)?.country || (user as any)?.location || '',
                    bio: user.bio,
                    githubUrl: user.githubLink,
                    twitterUrl: metadata?.social_links?.twitter || '',
                  });
                  const existingTech = (metadata as any)?.tech_stack;
                  if (Array.isArray(existingTech)) {
                    setTechStacks(existingTech as string[]);
                  } else if (typeof existingTech === 'string' && existingTech) {
                    setTechStacks([existingTech]);
                  } else {
                    setTechStacks([]);
                  }
                  setProfilePicPreview(metadata?.profile_picture || '');
                  setIsEditing(true);
                }}
                className="px-5 py-3 bg-[#00D4AA] hover:bg-[#00B894] text-gray-900 font-bold rounded-lg"
              >
                Edit Profile
              </button>
            </div>

            <div className="space-y-6">
              {user.bio && (
                <div>
                  <h3 className="text-gray-900 font-bold mb-2">Bio</h3>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {user.githubLink && (
                  <a
                    href={user.githubLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg text-sm"
                    aria-label="GitHub"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.85 3.14 8.96 7.49 10.41.55.1.75-.24.75-.53 0-.26-.01-1.12-.02-2.03-3.05.66-3.69-1.3-3.69-1.3-.5-1.27-1.22-1.6-1.22-1.6-.99-.68.08-.66.08-.66 1.09.08 1.66 1.12 1.66 1.12.98 1.67 2.57 1.19 3.2.91.1-.71.38-1.19.69-1.46-2.44-.28-5-1.22-5-5.42 0-1.2.43-2.17 1.12-2.94-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.04 1.12.88-.25 1.83-.37 2.78-.38.94.01 1.9.13 2.78.38 2.1-1.42 3.03-1.12 3.03-1.12.61 1.53.23 2.66.12 2.94.7.77 1.12 1.74 1.12 2.94 0 4.21-2.57 5.14-5.01 5.41.39.34.73 1.01.73 2.03 0 1.47-.01 2.66-.01 3.02 0 .29.2.64.76.53 4.35-1.45 7.48-5.56 7.48-10.41C23.02 5.24 18.27.5 12 .5z" clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">GitHub</span>
                  </a>
                )}
                {metadata?.social_links?.twitter && (
                  <a
                    href={metadata.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg text-sm"
                    aria-label="Twitter / X"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M18.244 2H21l-6.5 7.43L22 22h-6.158l-4.81-6.243L5.5 22H2l7.02-8.02L2 2h6.342l4.41 5.817L18.244 2zm-1.077 18h1.71L8.92 4H7.14l10.027 16z" />
                    </svg>
                    <span className="sr-only">Twitter / X</span>
                  </a>
                )}
              </div>

              {/* Tech Stack display */}
              {Array.isArray((metadata as any)?.tech_stack) && (metadata as any).tech_stack.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-gray-900 font-bold mb-2">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {((metadata as any).tech_stack as string[]).map((t, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-800 text-sm rounded-full">
                        <span className="mr-1">{TECH_EMOJI[t] || '🔧'}</span>{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Form
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className={`${display.className} text-3xl font-bold text-gray-900 mb-6`}>
        {isEditing ? 'Edit Your Profile' : 'Create Your Developer Profile'}
      </h2>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div>
          <label className="block text-gray-700 font-semibold mb-3">Profile Picture</label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-400">?</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
              />
              <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Username <span className="text-xs text-gray-500">(max 32 chars)</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
            maxLength={32}
            disabled={isEditing}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="yourhandle"
          />
          {errors.username && <p className="text-red-600 text-sm mt-1">{errors.username}</p>}
          {isEditing && <p className="text-xs text-gray-500 mt-1">Username cannot be changed after creation</p>}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Display Name <span className="text-xs text-gray-500">(optional)</span></label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            maxLength={50}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
            placeholder="Your public display name"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
          >
            <option value="">Select your role...</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
        </div>

        {/* Custom Role Input (if Other selected) */}
        {formData.role === 'Other' && (
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Specify Role <span className="text-xs text-gray-500">(max 30 chars)</span></label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              maxLength={30}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
              placeholder="Your role"
            />
          </div>
        )}

        {/* Tech Stacks (multi-select) */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Add your tech stack</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {TECH_STACKS.map((t) => {
              const selected = techStacks.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTechStacks((prev) => selected ? prev.filter(x => x !== t) : [...prev, t]);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm ${selected ? 'bg-[#00D4AA] border-[#00D4AA] text-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-1">{TECH_EMOJI[t] || '🔧'}</span>{t}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTech}
              onChange={(e) => setCustomTech(e.target.value)}
              maxLength={24}
              placeholder="Add custom tech"
              className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
            />
            <button
              type="button"
              onClick={() => {
                const v = customTech.trim();
                if (!v) return;
                if (v.length > 24) return;
                setTechStacks((prev) => (prev.includes(v) ? prev : [...prev, v]));
                setCustomTech('');
              }}
              className="px-4 py-2 rounded-lg bg-[#00D4AA] hover:bg-[#00B894] text-gray-900 font-bold"
            >
              + Add
            </button>
          </div>
          {techStacks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {techStacks.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-300 text-sm text-gray-800">
                  {tag}
                  <button type="button" onClick={() => setTechStacks(techStacks.filter(t => t !== tag))} className="text-gray-500 hover:text-gray-800" aria-label={`Remove ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.techStack && <p className="text-red-600 text-sm mt-1">{errors.techStack}</p>}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Bio <span className="text-xs text-gray-500">(max 200 chars)</span></label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            maxLength={200}
            rows={4}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
            placeholder="Tell us about yourself..."
          />
          <div className="text-xs text-gray-500 mt-1">{formData.bio.length}/200</div>
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">GitHub Profile URL</label>
          <input
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
            placeholder="https://github.com/yourhandle"
          />
          {errors.githubUrl && <p className="text-red-600 text-sm mt-1">{errors.githubUrl}</p>}
        </div>

        {/* Twitter URL */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Twitter/X Profile URL</label>
          <input
            type="url"
            value={formData.twitterUrl}
            onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"
            placeholder="https://x.com/yourhandle"
          />
          {errors.twitterUrl && <p className="text-red-600 text-sm mt-1">{errors.twitterUrl}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {(showCreateForm || isEditing) && (
            <button
              onClick={() => {
                setShowCreateForm(false);
                setIsEditing(false);
                setFormData({ username: '', displayName: '', role: '', country: '', bio: '', githubUrl: '', twitterUrl: '' });
                setTechStacks([]);
                setCustomTech('');
                setProfilePicFile(null);
                setProfilePicPreview('');
              }}
              className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#00D4AA] hover:bg-[#00B894] text-gray-900 px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
