import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ModalPortal from '@/components/ui/ModalPortal';
import { Flag, X } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { toast } from 'sonner';

const REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'nsfw', label: '18+ / Adult content' },
  { id: 'hate', label: 'Hate / Harassment' },
  { id: 'off_topic', label: 'Off-topic / Politics' },
  { id: 'other', label: 'Other' },
];

const HIDE_THRESHOLD = 3;

export default function ReportDialog({ isOpen, onClose, targetType, targetId, snapshot }) {
  const [reason, setReason] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);

    const user = await synkify.auth.me();
    await synkify.entities.Report.create({
      target_type: targetType,
      target_id: targetId,
      reporter_email: user?.email,
      reason,
      note: note.trim(),
      snapshot: snapshot?.slice(0, 500) || '',
      status: 'open',
    });

    // Auto-hide after threshold
    try {
      const reports = await synkify.entities.Report.filter({ target_id: targetId, status: 'open' });
      if (reports.length >= HIDE_THRESHOLD) {
        const entity =
          targetType === 'feedpost' ? synkify.entities.FeedPost :
          targetType === 'comment' ? synkify.entities.Comment :
          targetType === 'mission' ? synkify.entities.Mission : null;
        if (entity) {
          await entity.update(targetId, { moderation_status: 'pending' });
        }
      }
    } catch {}

    toast.success('Report submitted. Thank you for keeping the community safe.');
    setSubmitting(false);
    setReason(null);
    setNote('');
    onClose();
  };

  return (
    <ModalPortal lockScroll={isOpen}>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg"
            style={{ maxHeight: 'calc(100dvh - 32px)' }}
            initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard variant="strong" className="p-6 rounded-3xl overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100dvh - 32px)' }} animate={false}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-pink-500" />
                  <h3 className="font-heading text-lg font-bold">Report</h3>
                </div>
                <button onClick={onClose} className="glass-subtle rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-3">Why are you reporting this?</p>
              <div className="space-y-2 mb-3">
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm font-heading transition-all ${
                      reason === r.id
                        ? 'bg-gradient-to-r from-violet-400 to-indigo-400 text-white'
                        : 'glass-subtle text-foreground'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional - add details (max 200 chars)"
                maxLength={200}
                rows={2}
                className="w-full glass-subtle rounded-xl p-3 text-xs outline-none resize-none mb-4"
              />

              <div className="flex gap-3">
                <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
                <GlassButton variant="primary" onClick={submit} disabled={!reason || submitting} className="flex-1">
                  {submitting ? 'Sending...' : 'Submit Report'}
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
