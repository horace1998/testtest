import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ModalPortal from '@/components/ui/ModalPortal';
import { synkify } from '@/api/synkifyClient';

/**
 * MilestoneNativeCapture - Lets the user pick a goal, then opens the
 * device's native camera app (via <input capture>) so all hardware
 * controls (flash, zoom, etc.) are available. Uploads the photo and
 * returns it through onClose(fileUrl, goal).
 */
export default function MilestoneNativeCapture({ isOpen, onClose, goals = [] }) {
  const fileInputRef = useRef(null);
  const activeGoals = goals.filter(g => g.status === 'active');
  const [selectedGoal, setSelectedGoal] = useState(activeGoals[0] || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedGoal(activeGoals[0] || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, goals.length]);

  const openCamera = () => {
    if (!selectedGoal) return;
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedGoal) return;
    setUploading(true);
    const { file_url } = await synkify.integrations.Core.UploadFile({ file });
    setUploading(false);
    onClose(file_url, selectedGoal);
  };

  return (
    <ModalPortal lockScroll={isOpen}>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))', paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none" />
          <motion.div
            className="relative w-full max-w-lg max-h-full"
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard variant="strong" className="p-5 rounded-3xl max-h-full overflow-y-auto no-scrollbar" animate={false}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-foreground" />
                  <h3 className="font-heading text-xl font-bold">Capture Milestone</h3>
                </div>
                <button
                  onClick={() => !uploading && onClose(null)}
                  className="border border-foreground/15 rounded-full p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeGoals.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">No active goals yet.</p>
                  <p className="text-xs text-muted-foreground">Create a goal first to log milestones.</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-2">
                    For Goal
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {activeGoals.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGoal(g)}
                        className={`rounded-full px-3 py-1.5 text-xs font-heading font-semibold border transition-all ${
                          selectedGoal?.id === g.id
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-foreground/15 text-foreground'
                        }`}
                      >
                        {g.title}
                      </button>
                    ))}
                  </div>

                  <GlassButton
                    variant="primary"
                    onClick={openCamera}
                    disabled={!selectedGoal || uploading}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2 inline" />
                    {uploading ? 'Uploading...' : 'Open Camera'}
                  </GlassButton>

                  <p className="text-[10px] text-muted-foreground text-center mt-3">
                    Opens your device camera with native controls.
                  </p>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </ModalPortal>
  );
}
