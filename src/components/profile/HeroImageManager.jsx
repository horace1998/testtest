import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { ImagePlus, Trash2, Sliders } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import HeroEditor from './HeroEditor';

/**
 * HeroImageManager - Profile section for uploading / editing / removing
 * the dashboard hero image. Opens the full HeroEditor for live preview.
 */
export default function HeroImageManager({ user }) {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ['heroAssets'],
    queryFn: () => synkify.entities.HeroAsset.list('order'),
  });

  const hero = assets.find(a => a.role === 'hero');

  const deleteMutation = useMutation({
    mutationFn: () => synkify.entities.HeroAsset.delete(hero.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroAssets'] }),
  });

  return (
    <>
      <GlassCard variant="strong" className="p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-foreground/15 flex items-center justify-center bg-foreground/5">
            {hero ? (
              <img src={hero.image_url} alt="hero" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="w-5 h-5 text-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-1">
              Hero Image
            </p>
            <p className="font-heading text-sm font-semibold">
              {hero ? 'Your dashboard idol' : 'No image set'}
            </p>
            <p className="text-xs text-muted-foreground">
              Edit with live preview before saving.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <GlassButton
            variant="primary"
            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs"
            onClick={() => setShowEditor(true)}
          >
            <Sliders className="w-3.5 h-3.5" />
            {hero ? 'Edit & Preview' : 'Upload'}
          </GlassButton>
          {hero && (
            <GlassButton
              variant="ghost"
              className="flex items-center justify-center gap-2 py-2 px-4 text-xs text-foreground"
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </GlassButton>
          )}
        </div>
      </GlassCard>

      <HeroEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        hero={hero}
        user={user}
      />
    </>
  );
}
