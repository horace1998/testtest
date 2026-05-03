import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Check, Pencil, ImagePlus, Trash2, Heart } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import FocusPicker from '@/components/FocusPicker';

export default function EditProfile({ user }) {
  const fileRef = useRef(null);
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Nickname state
  const [nickname, setNickname] = useState(user?.full_name || '');
  
  // Identity (bg & side images) state
  const [bgUrl, setBgUrl] = useState(user?.hero_bg_url || null);
  const [sideImages, setSideImages] = useState(user?.hero_side_urls || [null, null]);
  
  // Focus state
  const [group, setGroup] = useState(user?.favorite_group || '');
  const [bias, setBias] = useState(
    user?.favorite_idol && user.favorite_idol !== user.favorite_group
      ? user.favorite_idol
      : ''
  );
  
  const [isUploading, setIsUploading] = useState(false);
  
  const queryClientInstance = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data) => synkify.auth.updateMe(data),
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleFileUpload = async (file, type, index = null) => {
    setIsUploading(true);
    try {
      const { file_url } = await synkify.integrations.Core.UploadFile({ file });
      if (type === 'bg') {
        setBgUrl(file_url);
      } else if (type === 'profile') {
        // Profile image upload
        await synkify.auth.updateMe({ background_image_url: file_url });
        queryClientInstance.invalidateQueries({ queryKey: ['me'] });
      } else {
        setSideImages(prev => {
          const newArr = [...prev];
          newArr[index] = file_url;
          return newArr;
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAll = async () => {
    const updates = {
      full_name: nickname.trim() || user?.email?.split('@')[0] || 'Member',
      hero_bg_url: bgUrl,
      hero_side_urls: sideImages,
      favorite_group: group,
      favorite_idol: bias || group,
    };
    
    await updateUserMutation.mutateAsync(updates);
  };

  const image = user?.background_image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <GlassCard variant="strong" className="p-5 mb-6" animate={false}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-heading text-lg font-bold">Edit Profile</h3>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: 'rgba(0,0,0,0.5)',
            transition: 'transform 0.3s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>v</span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <div className="space-y-6" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          {/* ?? Profile Image & Nickname ?? */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-3">
              Profile
            </p>
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar / profile image */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  border: '1px solid rgba(0,0,0,0.15)',
                  background: image ? 'transparent' : 'rgba(0,0,0,0.04)',
                }}
              >
                {image ? (
                  <img src={image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-foreground/60" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={32}
                  className="w-full text-xl font-display font-medium border-b border-foreground/30 pb-1 outline-none"
                  style={{ background: 'transparent' }}
                />
                <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <GlassButton
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2 py-2 text-xs"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {image ? 'Change Photo' : 'Upload Photo'}
              </GlassButton>
              {image && (
                <GlassButton
                  variant="ghost"
                  className="flex items-center justify-center gap-2 py-2 px-4 text-xs text-foreground"
                  onClick={async () => {
                    await synkify.auth.updateMe({ background_image_url: '' });
                    queryClientInstance.invalidateQueries({ queryKey: ['me'] });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </GlassButton>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile')} />
          </div>

          {/* ?? Your Identity ?? */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-3">
              Your Identity
            </p>

            {/* Main BG upload */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-foreground/70">
                  Background & Profile Image (Black Filter Applied)
                </label>
                {bgUrl && (
                  <button
                    onClick={() => setBgUrl(null)}
                    className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {bgUrl && (
                <img src={bgUrl} alt="bg" className="w-full h-32 object-cover rounded-lg mb-2 grayscale brightness-50" />
              )}
              <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-foreground/20 rounded-lg hover:border-foreground/40 transition-colors cursor-pointer bg-foreground/2">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'bg')}
                />
                <div className="text-center">
                  <Upload className="w-5 h-5 mx-auto text-foreground/50 mb-1" />
                  <p className="text-xs text-foreground/50">Upload image</p>
                </div>
              </label>
            </div>

            {/* Side images */}
            <div>
              <label className="block text-xs font-semibold mb-2 text-foreground/70">
                Side Images (Left & Right, shows half)
              </label>
              <div className="flex gap-4">
                {[0, 1].map((idx) => (
                  <div key={idx} className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-foreground/50">{idx === 0 ? 'Left' : 'Right'}</p>
                      {sideImages[idx] && (
                        <button
                          onClick={() => setSideImages(prev => {
                            const newArr = [...prev];
                            newArr[idx] = null;
                            return newArr;
                          })}
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {sideImages[idx] && (
                      <img src={sideImages[idx]} alt={`side-${idx}`} className="w-full h-24 object-cover rounded-lg mb-2 border border-foreground/20" />
                    )}
                    <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-foreground/20 rounded-lg hover:border-foreground/40 transition-colors cursor-pointer bg-foreground/2">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'side', idx)}
                      />
                      <Upload className="w-4 h-4 text-foreground/50" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ?? My Focus (Bias & Group) ?? */}
          <div>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-3">
              My Focus
            </p>
            <FocusPicker
              group={group}
              bias={bias}
              onChange={({ group: g, bias: b }) => { setGroup(g); setBias(b); }}
            />
          </div>
        </div>

              <div className="flex gap-2 mt-6">
                <GlassButton
                  variant="ghost"
                  className="flex-1 text-foreground"
                  onClick={() => {
                    // Reset to original values
                    setNickname(user?.full_name || '');
                    setBgUrl(user?.hero_bg_url || null);
                    setSideImages(user?.hero_side_urls || [null, null]);
                    setGroup(user?.favorite_group || '');
                    setBias(user?.favorite_idol && user.favorite_idol !== user.favorite_group ? user.favorite_idol : '');
                  }}
                >
                  Reset
                </GlassButton>
                <GlassButton
                  variant="primary"
                  className="flex-1"
                  onClick={handleSaveAll}
                  disabled={isUploading || updateUserMutation.isPending}
                >
                  {isUploading || updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}