import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { X, Check, RotateCcw, ImagePlus, Move, Wand2 } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import HeroPreview from './HeroPreview';
import HeroUploadModal from '@/components/dashboard/HeroUploadModal';
import HeroEraser from './HeroEraser';

const DEFAULTS = {
  glow: 50,
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  shadow: 50,
  text_color: '#ffffff',
  title_line1: '',
  title_line2: '',
  title_x: 5,
  title_y: 8,
};

const PRESET_COLORS = ['#ffffff', '#f5d0fe', '#fcd34d', '#fda4af', '#a5b4fc', '#86efac', '#000000'];

/**
 * HeroEditor - mobile-first editor.
 * Layout: sticky header (top) | pinned preview (top) | scrollable controls | sticky footer (Cancel/Apply)
 */
export default function HeroEditor({ isOpen, onClose, hero, user }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(DEFAULTS);
  const [draftImage, setDraftImage] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showEraser, setShowEraser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft({
        glow: hero?.glow ?? DEFAULTS.glow,
        blur: hero?.blur ?? DEFAULTS.blur,
        brightness: hero?.brightness ?? DEFAULTS.brightness,
        contrast: hero?.contrast ?? DEFAULTS.contrast,
        saturation: hero?.saturation ?? DEFAULTS.saturation,
        shadow: hero?.shadow ?? DEFAULTS.shadow,
        text_color: hero?.text_color ?? DEFAULTS.text_color,
        title_line1: hero?.title_line1 ?? '',
        title_line2: hero?.title_line2 ?? '',
        title_x: hero?.title_x ?? DEFAULTS.title_x,
        title_y: hero?.title_y ?? DEFAULTS.title_y,
      });
      setDraftImage(hero?.image_url || null);
      // Auto-open upload dialog if no existing image
      if (!hero?.image_url) setShowUpload(true);
    }
  }, [isOpen, hero?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...draft, image_url: draftImage };
      if (hero) return synkify.entities.HeroAsset.update(hero.id, payload);
      return synkify.entities.HeroAsset.create({ ...payload, role: 'hero', order: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroAssets'] });
      onClose();
    },
  });

  const update = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const reset = () => setDraft(DEFAULTS);
  const handleTitleDrag = (x, y) => setDraft(d => ({ ...d, title_x: x, title_y: y }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          style={{ height: '100dvh' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Sticky header - compact */}
          <div className="flex-shrink-0 glass-strong border-b border-white/40 px-3 py-1.5 flex items-center justify-between" style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top))' }}>
            <button onClick={onClose} className="glass-subtle rounded-full p-1.5">
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="font-heading text-xs font-bold uppercase tracking-wider">Hero Editor</p>
            <button onClick={reset} className="glass-subtle rounded-full p-1.5" title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pinned preview (drag-to-position title) - compact */}
          <div className="flex-shrink-0 px-3 pt-2 pb-1 bg-background">
            <div className="mx-auto" style={{ height: '26vh', aspectRatio: '4/5' }}>
              <HeroPreview
                imageUrl={draftImage}
                settings={draft}
                idolName={user?.favorite_idol}
                groupName={user?.favorite_group}
                compact
                onTitleDrag={handleTitleDrag}
              />
            </div>
            <p className="text-[9px] text-muted-foreground text-center mt-1 flex items-center justify-center gap-1">
              <Move className="w-2.5 h-2.5" /> Drag title to reposition
            </p>
          </div>

          {/* Scrollable controls */}
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            <div className="px-4 py-3 max-w-xl mx-auto" style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}>
              {/* Image actions: replace + erase */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setShowUpload(true)}
                  className="glass-subtle rounded-2xl py-3 px-3 flex items-center justify-center gap-2 hover:bg-white/60 transition"
                >
                  <ImagePlus className="w-4 h-4 text-violet-500" />
                  <span className="font-heading text-xs font-semibold">
                    {draftImage ? 'Replace' : 'Upload'}
                  </span>
                </button>
                <button
                  onClick={() => setShowEraser(true)}
                  disabled={!draftImage}
                  className="glass-subtle rounded-2xl py-3 px-3 flex items-center justify-center gap-2 hover:bg-white/60 transition disabled:opacity-40"
                >
                  <Wand2 className="w-4 h-4 text-violet-500" />
                  <span className="font-heading text-xs font-semibold">Erase Magic</span>
                </button>
              </div>

              {/* Editable title lines (any case allowed) */}
              <div className="mb-4">
                <p className="font-heading text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Title Text (optional)</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={draft.title_line1}
                    onChange={(e) => update('title_line1', e.target.value)}
                    placeholder={`Line 1 - defaults to "${user?.favorite_group || 'Group'}"`}
                    maxLength={20}
                    className="w-full glass-subtle rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  <input
                    type="text"
                    value={draft.title_line2}
                    onChange={(e) => update('title_line2', e.target.value)}
                    placeholder={`Line 2 - defaults to "${user?.favorite_idol || 'Idol'}"`}
                    maxLength={20}
                    className="w-full glass-subtle rounded-xl px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Use any case: uppercase, lowercase, or mixed.</p>
              </div>

              {/* Text color */}
              <div className="mb-4">
                <p className="font-heading text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Text Color</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => update('text_color', c)}
                      className={`w-8 h-8 rounded-full border-2 transition ${draft.text_color === c ? 'border-violet-500 scale-110' : 'border-white/60'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 cursor-pointer flex items-center justify-center"
                    style={{ background: 'conic-gradient(red, orange, yellow, green, cyan, blue, magenta, red)' }}
                  >
                    <input
                      type="color"
                      value={draft.text_color}
                      onChange={(e) => update('text_color', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3.5">
                <Slider label="Glow"        value={draft.glow}       min={0}   max={100} onChange={(v) => update('glow', v)} />
                <Slider label="Outline Blur" value={draft.blur}      min={0}   max={100} onChange={(v) => update('blur', v)} />
                <Slider label="Brightness"  value={draft.brightness} min={50}  max={150} onChange={(v) => update('brightness', v)} />
                <Slider label="Contrast"    value={draft.contrast}   min={50}  max={150} onChange={(v) => update('contrast', v)} />
                <Slider label="Saturation"  value={draft.saturation} min={0}   max={200} onChange={(v) => update('saturation', v)} />
                <Slider label="Shadow"      value={draft.shadow}     min={0}   max={100} onChange={(v) => update('shadow', v)} />
              </div>

              {/* Cancel / Apply - placed directly below Shadow slider */}
              <div
                className="flex gap-2 mt-5"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
              >
                <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={() => saveMutation.mutate()}
                  disabled={!draftImage || saveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Apply'}
                </GlassButton>
              </div>
            </div>
          </div>

          <HeroUploadModal
            isOpen={showUpload}
            onClose={() => setShowUpload(false)}
            role="hero"
            onSave={(url) => {
              setDraftImage(url);
              setShowUpload(false);
            }}
          />

          <HeroEraser
            isOpen={showEraser}
            imageUrl={draftImage}
            onClose={() => setShowEraser(false)}
            onApply={(url) => {
              setDraftImage(url);
              setShowEraser(false);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="font-heading text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{label}</span>
        <span className="font-heading text-[10px] text-foreground tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-violet-500 cursor-pointer"
      />
    </div>
  );
}
