import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export default function IdentityEditor({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bgUrl, setBgUrl] = useState(user?.hero_bg_url || null);
  const [sideImages, setSideImages] = useState(user?.hero_side_urls || [null, null]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: (data) => synkify.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsEditing(false);
    },
  });

  const handleFileUpload = async (file, type, index = null) => {
    setIsUploading(true);
    try {
      const { file_url } = await synkify.integrations.Core.UploadFile({ file });
      if (type === 'bg') {
        setBgUrl(file_url);
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

  const handleSaveDecorations = async () => {
    await updateUserMutation.mutateAsync({
      hero_bg_url: bgUrl,
      hero_side_urls: sideImages,
    });
  };

  if (!isEditing) {
    return (
      <GlassCard variant="strong" className="p-4 mb-6">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full text-left flex items-center justify-between"
        >
          <span className="text-xs font-semibold text-foreground/70">Your Identity</span>
          <span className="text-xs text-primary">Edit</span>
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="strong" className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-bold">Your Identity</h3>
        <button
          onClick={() => {
            setIsEditing(false);
            setBgUrl(user?.hero_bg_url || null);
            setSideImages(user?.hero_side_urls || [null, null]);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Main BG upload */}
        <div>
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

      <div className="flex gap-2 mt-6">
        <GlassButton
          variant="ghost"
          className="flex-1 text-foreground"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          className="flex-1"
          onClick={handleSaveDecorations}
          disabled={isUploading || updateUserMutation.isPending}
        >
          {isUploading || updateUserMutation.isPending ? 'Saving...' : 'Save'}
        </GlassButton>
      </div>
    </GlassCard>
  );
}