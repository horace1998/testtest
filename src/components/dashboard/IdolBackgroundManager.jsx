/**
 * IdolBackgroundManager
 * Lets the user set an idol photo as a full-page background overlay.
 * Stores the image URL on the user record (background_image_url).
 */
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Trash2, X } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';
import ModalPortal from '@/components/ui/ModalPortal';

export default function IdolBackgroundManager({ user, onClose }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const queryClient = useQueryClient();

  const current = user?.background_image_url;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await synkify.integrations.Core.UploadFile({ file });
    await synkify.auth.updateMe({ background_image_url: file_url });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setUploading(false);
    onClose?.();
  };

  const handleRemove = async () => {
    setRemoving(true);
    await synkify.auth.updateMe({ background_image_url: '' });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setRemoving(false);
    onClose?.();
  };

  return (
    <ModalPortal lockScroll>
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-sm"
        style={{ maxHeight: 'calc(100dvh - 32px)' }}
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: 24,
          padding: '22px 22px 20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <div className="flex items-center justify-between mb-1">
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: '0.05em', color: '#0d1117' }}>
              Idol Background
            </h3>
            <button
              onClick={onClose}
              style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 99, padding: 6, background: 'transparent' }}
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 18 }}>
            Set your idol's photo as a motivating full-page backdrop
          </p>

          {/* Preview */}
          {current && (
            <div className="relative mb-4 rounded-2xl overflow-hidden" style={{ height: 140 }}>
              <img src={current} alt="Current background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-2 left-3 text-white text-[10px] uppercase tracking-widest font-heading">Current</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                border: 'none',
                borderRadius: 14,
                padding: '13px 0',
                color: '#fff',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ImageIcon style={{ width: 15, height: 15 }} />
              {uploading ? 'Uploading...' : current ? 'Change Photo' : 'Choose Photo'}
            </button>

            {current && (
              <button
                onClick={handleRemove}
                disabled={removing}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 14,
                  padding: '11px 0',
                  color: 'rgba(0,0,0,0.5)',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: removing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
                {removing ? 'Removing...' : 'Remove Background'}
              </button>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </motion.div>
    </div>
    </ModalPortal>
  );
}
