import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import ModalPortal from '@/components/ui/ModalPortal';

export default function LevelUpModal({ isOpen, rank, score, onClose, onShare }) {
  useEffect(() => {
    if (!isOpen) return;
    const end = Date.now() + 800;
    const colors = ['#111', '#555', '#999', '#ddd'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [isOpen]);

  return (
    <ModalPortal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && rank && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Backdrop — pointer-events-none so only close button dismisses */}
            <div className="absolute inset-0 pointer-events-none" />

            <motion.div
              className="relative bg-white border border-foreground/10 rounded-3xl p-7 max-w-sm w-full"
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full border border-foreground/15 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="w-24 h-24 rounded-3xl bg-foreground flex items-center justify-center mb-4"
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.1 }}
                >
                  <Trophy className="w-12 h-12 text-background" strokeWidth={1.8} />
                </motion.div>

                <motion.p
                  className="editorial-eyebrow mb-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  Level Up
                </motion.p>
                <motion.h2
                  className="font-display text-4xl tracking-wide uppercase text-foreground mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {rank.label}
                </motion.h2>
                <motion.p
                  className="text-sm text-muted-foreground mb-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {rank.description}
                </motion.p>

                <motion.div
                  className="border border-foreground/10 rounded-2xl px-4 py-2 mb-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  <p className="editorial-eyebrow">Rank Score</p>
                  <p className="font-heading font-bold text-2xl text-foreground">{score}</p>
                </motion.div>

                <motion.div
                  className="flex gap-2 w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <button
                    onClick={onClose}
                    className="flex-1 border border-foreground/15 rounded-2xl py-3 font-heading font-semibold text-sm text-foreground"
                  >
                    Later
                  </button>
                  <button
                    onClick={onShare}
                    className="flex-1 bg-foreground rounded-2xl py-3 font-heading font-semibold text-sm text-background flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}