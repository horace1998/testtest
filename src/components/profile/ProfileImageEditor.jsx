/**
 * ProfileImageEditor
 * Lets the user set a nickname AND upload a profile/idol image.
 * The same image is used as the dashboard idol image AND the profile avatar.
 * Stored on User: full_name (nickname) + background_image_url (the image).
 */
import React, { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { ImagePlus, Trash2, Check, Pencil } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export default function ProfileImageEditor({ user }) {
  const fileRef = useRef(null);
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState(user?.full_name || '');
  const [editingName, setEditingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setNickname(user?.full_name || '');
  }, [user?.full_name]);

  const image = user?.background_image_url;

  const saveNameMutation = useMutation({
    mutationFn: () => synkify.auth.updateMe({ full_name: nickname.trim() || user?.email?.split('@')[0] || 'Member' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditingName(false);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: () => synkify.auth.updateMe({ background_image_url: '' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await synkify.integrations.Core.UploadFile({ file });
    await synkify.auth.updateMe({ background_image_url: file_url });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setUploading(false);
  };

  return (
    <GlassCard variant="strong" className="p-5 mb-4" animate={false}>
      <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-3">
        Profile
      </p>

      <div className="flex items-center gap-4 mb-4">
        {/* Avatar / idol image */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
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
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {!editingName ? (
            <div className="flex items-center gap-2">
              <p className="font-display text-2xl truncate" style={{ color: '#0d1117' }}>
                {user?.full_name || 'Add nickname'}
              </p>
              <button
                onClick={() => setEditingName(true)}
                className="border border-foreground/15 rounded-full p-1.5 flex-shrink-0"
                aria-label="Edit nickname"
              >
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname"
                maxLength={32}
                className="flex-1 bg-transparent outline-none text-base font-medium border-b border-foreground/30 pb-1"
                autoFocus
              />
              <button
                onClick={() => saveNameMutation.mutate()}
                disabled={saveNameMutation.isPending}
                className="flex-shrink-0 bg-foreground text-background rounded-full p-1.5"
                aria-label="Save nickname"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <GlassButton
          variant="primary"
          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="w-3.5 h-3.5" />
          {image ? 'Change Photo' : 'Upload Photo'}
        </GlassButton>
        {image && (
          <GlassButton
            variant="ghost"
            className="flex items-center justify-center gap-2 py-2 px-4 text-xs text-foreground"
            onClick={() => removeImageMutation.mutate()}
            disabled={removeImageMutation.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </GlassButton>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </GlassCard>
  );
}