import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ModalPortal from '@/components/ui/ModalPortal';
import { synkify } from '@/api/synkifyClient';
import { X, Upload, ImageIcon, Check } from 'lucide-react';
import { assetTypeFromFile, createCircleMilestonePost } from '@/lib/circleFeed';

const ASSET_TYPES = ['badge', 'fanart', 'photo', 'video', 'sticker'];

export default function MilestoneUploadModal({ isOpen, onClose, onSaved, goal, user }) {
  const [assetUrl, setAssetUrl] = useState(null);
  const [assetType, setAssetType] = useState('badge');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await synkify.integrations.Core.UploadFile({ file });
    setAssetUrl(file_url);
    setAssetType(assetTypeFromFile(file));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await synkify.entities.Milestone.create({
      goal_id: goal?.id || '',
      goal_title: goal?.title || '',
      idol_name: goal?.idol_name || '',
      idol_group: goal?.idol_group || '',
      asset_url: assetUrl,
      asset_type: assetType,
      caption: caption.trim(),
      timeline_value: goal?.timeline_value,
      timeline_unit: goal?.timeline_unit,
      checkins_completed: goal?.daily_checkins?.filter(c => c.completed).length || 0,
    });
    await createCircleMilestonePost({
      user,
      goal,
      assetUrl,
      assetType,
      caption: caption.trim(),
    });
    setSaving(false);
    onSaved?.();
    onClose();
    setAssetUrl(null);
    setCaption('');
  };

  return (
    <ModalPortal lockScroll={isOpen}>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg"
            style={{ maxHeight: 'calc(100dvh - 32px)' }}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard variant="strong" className="p-6 rounded-3xl overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100dvh - 32px)' }} animate={false}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading text-xl font-bold">Add Milestone</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {goal ? `For: ${goal.title}` : 'Celebrate your achievement'}
                  </p>
                </div>
                <button onClick={onClose} className="border border-foreground/15 rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload area */}
              <div
                className="relative rounded-2xl overflow-hidden mb-4 cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {assetUrl ? (
                  assetType === 'video' ? (
                    <motion.video
                      src={assetUrl}
                      controls
                      className="w-full h-48 bg-black object-contain"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring' }}
                    />
                  ) : (
                    <motion.img
                      src={assetUrl}
                      alt="Milestone asset"
                      className="w-full h-48 object-cover"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring' }}
                    />
                  )
                ) : (
                  <div className="border-2 border-dashed border-foreground/20 rounded-2xl h-48 flex flex-col items-center justify-center gap-3 hover:border-foreground/40 transition-colors">
                    {uploading ? (
                      <div className="w-8 h-8 border-[3px] border-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full border border-foreground/15 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Tap to upload your<br />fandom asset
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Asset type */}
              <div className="flex gap-2 mb-4">
                {ASSET_TYPES.map(type => (
                  <button
                    key={type}
                    className={`flex-1 rounded-xl py-2 text-[10px] font-heading font-semibold uppercase tracking-wider transition-all border ${
                      assetType === type
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-foreground/10 text-muted-foreground'
                    }`}
                    onClick={() => setAssetType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Caption */}
              <div className="border border-foreground/10 rounded-xl p-3 mb-5">
                <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finally did it. 30 days strong."
                  className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={!assetUrl || saving}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Milestone'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </ModalPortal>
  );
}
