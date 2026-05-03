import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Loader2 } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import ModalPortal from '@/components/ui/ModalPortal';
import { toast } from 'sonner';
import { moderate } from '@/lib/moderation';

const QUICK_PHRASES = [
  'Fighting! You got this',
  'Proud of your hustle',
  'One step at a time. Keep going',
  'Sending energy your way',
];

export default function CheerModal({ isOpen, onClose, recipient, circleId, sender }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!recipient) return null;

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || !sender) return;
    setSending(true);
    try {
      const verdict = await moderate(trimmed, 'cheer');
      if (!verdict.ok) {
        toast.error(verdict.reason || 'Message blocked');
        setSending(false);
        return;
      }
      await synkify.entities.Cheer.create({
        support_circle_id: circleId,
        sender_email: sender.email,
        sender_name: sender.full_name || sender.email.split('@')[0],
        receiver_email: recipient.user_email,
        message: trimmed,
        is_read: false,
      });
      toast.success(`Cheer sent to ${recipient.user_name || 'fan'}`);
      setMessage('');
      onClose();
    } catch (e) {
      toast.error('Could not send cheer');
    }
    setSending(false);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          >
            <motion.div
              className="w-full sm:max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl overflow-hidden"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#1a3aad]" />
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                    fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
                    color: '#1a3aad',
                  }}>Send Cheer</span>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5">
                  <X className="w-4 h-4 text-foreground/50" />
                </button>
              </div>

              <div className="px-5 pb-2">
                <p style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                  fontSize: 16, color: 'rgba(0,0,0,0.55)',
                }}>
                  to <span style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontStyle: 'normal', color: '#0d1117', letterSpacing: '0.04em' }}>
                    {recipient.user_name || recipient.user_email?.split('@')[0]}
                  </span>
                </p>
              </div>

              <div className="px-5 pb-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 240))}
                  placeholder="Write something kind..."
                  rows={3}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: '#0d1117',
                  }}
                />
                <div className="flex justify-end mt-1">
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                    color: 'rgba(0,0,0,0.35)', letterSpacing: '0.15em',
                  }}>{message.length}/240</span>
                </div>
              </div>

              <div className="px-5 pb-4">
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: 'rgba(0,0,0,0.35)', marginBottom: 8,
                }}>Quick phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PHRASES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setMessage(p)}
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                        background: 'rgba(26,58,173,0.06)',
                        border: '1px solid rgba(26,58,173,0.18)',
                        borderRadius: 99, padding: '5px 10px',
                        color: '#1a3aad',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                    fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                    border: '1px solid rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.55)',
                  }}
                >Cancel</button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                    fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                    background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                    color: '#fff', opacity: !message.trim() || sending ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
