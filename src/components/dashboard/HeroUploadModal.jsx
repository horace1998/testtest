import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { X, Upload, Sparkles, Crop, Loader2 } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { removeBackground } from '@imgly/background-removal';
import CropTool from './CropTool';
import ModalPortal from '@/components/ui/ModalPortal';

/**
 * HeroUploadModal - pick image, choose AI auto-cutout or manual crop,
 * returns final image URL (uploaded) via onSave.
 *
 * Credit-saving flow: the original picked file stays LOCAL (object URL).
 * We only upload the FINAL processed result (cutout or crop): 1 upload per save.
 */
export default function HeroUploadModal({ isOpen, onClose, onSave, role = 'hero' }) {
  const [step, setStep] = useState('pick'); // pick | choose | crop | processing
  const [localFile, setLocalFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Cleanup local object URL when it changes / unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep('pick');
    setLocalFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const url = URL.createObjectURL(file);
    setLocalFile(file);
    setPreviewUrl(url);
    setStep('choose');
  };

  const handleAutoCutout = async () => {
    setStep('processing');
    setError(null);
    try {
  // Run pixel-perfect background removal locally; operates on the local file directly.
      const blob = await removeBackground(localFile, { output: { format: 'image/png' } });
      const file = new File([blob], 'cutout.png', { type: 'image/png' });
      const { file_url } = await synkify.integrations.Core.UploadFile({ file });
      onSave(file_url);
      reset();
    } catch (err) {
      console.error(err);
      setError('AI cutout failed. Try Quick Crop.');
      setStep('choose');
    }
  };

  const handleUseOriginal = async () => {
    setStep('processing');
    setError(null);
    try {
      const { file_url } = await synkify.integrations.Core.UploadFile({ file: localFile });
      await onSave(file_url);
      reset();
    } catch (err) {
      console.error(err);
      setError('Upload failed. Try a smaller JPG or PNG.');
      setStep('choose');
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    setStep('processing');
    try {
      const file = new File([croppedBlob], 'cropped.png', { type: 'image/png' });
      const { file_url } = await synkify.integrations.Core.UploadFile({ file });
      onSave(file_url);
      reset();
    } catch (err) {
      setError('Upload failed');
      setStep('crop');
    }
  };

  return (
    <ModalPortal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ height: '100dvh' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg overflow-y-auto"
            style={{ maxHeight: '90dvh' }}
            initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard variant="strong" className="p-6 rounded-3xl" animate={false}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-2xl tracking-wide uppercase">
                  {role === 'hero' ? 'Hero Image' : 'Add to Filmstrip'}
                </h3>
                <button onClick={handleClose} className="glass-subtle rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {step === 'pick' && (
                <div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full glass-subtle rounded-2xl p-10 flex flex-col items-center gap-3 hover:ring-1 hover:ring-violet-300/60 transition-all"
                  >
                    <Upload className="w-8 h-8 text-violet-400" />
                    <p className="font-heading font-semibold text-sm">Upload Photo</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                  </button>
                  <input
                    ref={fileRef} type="file" accept="image/*"
                    className="hidden" onChange={handleFile}
                  />
                  {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}
                </div>
              )}

              {step === 'choose' && previewUrl && (
                <div className="space-y-3">
                  <img src={previewUrl} alt="" className="w-full h-48 object-cover rounded-2xl" />
                  <p className="text-xs text-muted-foreground text-center">
                    How would you like to process it?
                  </p>
                  <button
                    onClick={handleUseOriginal}
                    className="w-full glass-subtle rounded-2xl p-4 flex items-center gap-3 hover:ring-1 hover:ring-violet-300/60 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm">Use Photo</p>
                      <p className="text-[11px] text-muted-foreground">Best for the home overlay background</p>
                    </div>
                  </button>
                  <button
                    onClick={handleAutoCutout}
                    className="w-full glass-subtle rounded-2xl p-4 flex items-center gap-3 hover:ring-1 hover:ring-violet-300/60 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm">Auto Cutout (AI)</p>
                      <p className="text-[11px] text-muted-foreground">Removes background automatically</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setStep('crop')}
                    className="w-full glass-subtle rounded-2xl p-4 flex items-center gap-3 hover:ring-1 hover:ring-violet-300/60 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-300 to-violet-300 flex items-center justify-center">
                      <Crop className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm">Quick Crop</p>
                      <p className="text-[11px] text-muted-foreground">Manually select the area</p>
                    </div>
                  </button>
                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                </div>
              )}

              {step === 'crop' && previewUrl && (
                <CropTool
                  imageUrl={previewUrl}
                  onCancel={() => setStep('choose')}
                  onComplete={handleCropComplete}
                />
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="font-heading text-sm">Saving image...</p>
                  <p className="text-[11px] text-muted-foreground text-center">Large images are compressed for local testing</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
