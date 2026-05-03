import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, LogOut } from 'lucide-react';
import { differenceInDays, addDays, addWeeks, addMonths } from 'date-fns';

function getEndDate(startDate, value, unit) {
  const start = new Date(startDate);
  if (unit === 'days') return addDays(start, value);
  if (unit === 'weeks') return addWeeks(start, value);
  return addMonths(start, value);
}

function getProgress(startDate, value, unit) {
  const start = new Date(startDate);
  const end = getEndDate(startDate, value, unit);
  const now = new Date();
  const totalDays = differenceInDays(end, start);
  const elapsed = differenceInDays(now, start);
  return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
}

export default function GoalCard({ goal, onCheckin, onComplete, onDelete, index = 0 }) {
  const progress = getProgress(goal.start_date || goal.created_date, goal.timeline_value, goal.timeline_unit);
  const endDate = getEndDate(goal.start_date || goal.created_date, goal.timeline_value, goal.timeline_unit);
  const daysLeft = Math.max(0, differenceInDays(endDate, new Date()));
  const [confirmAction, setConfirmAction] = useState(null); // 'complete' | 'leave' | null
  const isActive = goal.status === 'active';

  return (
    <motion.div
      className="relative mb-3"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.06, 0.22) }}
    >
      <div style={{
        borderRadius: 16,
        background: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(0,0,0,0.08)',
        padding: '16px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {/* Eyebrow */}
            <div className="flex items-center justify-between mb-2">
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
              }}>
                {goal.idol_group || goal.idol_name}
              </span>
              {goal.status === 'completed' && (
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: '#1a3aad',
                }}>
                  ✓ Closed
                </span>
              )}
            </div>

            {/* Title */}
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 15, fontWeight: 500,
              color: '#0d1117', lineHeight: 1.35,
              letterSpacing: '-0.01em',
            }} className="line-clamp-2">
              {goal.title}
            </p>

            {goal.idol_name && goal.idol_name !== goal.idol_group && (
              <p style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic', fontSize: 12,
                color: 'rgba(0,0,0,0.38)', marginTop: 3,
              }}>
                for {goal.idol_name}
              </p>
            )}

            {/* Progress */}
            <div className="mt-4">
              <div style={{ height: 2, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <motion.div
                  style={{
                    height: '100%', borderRadius: 99,
                    background: 'linear-gradient(90deg, #1a3aad, #4d7fff)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-2" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9, fontWeight: 600, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)',
              }}>
                <span>{goal.daily_checkins?.filter(c => c.completed).length || 0} entries · {progress}%</span>
                <span>{daysLeft}d left</span>
              </div>
            </div>
          </div>

        </div>

        {/* Action buttons — Complete / Leave */}
        {isActive && (onComplete || onDelete) && (
          <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {onComplete && (
              <button
                onClick={() => setConfirmAction('complete')}
                className="flex-1 flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                  border: '1px solid rgba(26,58,173,0.3)', borderRadius: 10,
                  padding: '9px 12px', color: '#fff',
                }}
              >
                <Check className="w-3.5 h-3.5" /> Complete
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setConfirmAction('leave')}
                className="flex items-center justify-center gap-1.5"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                  background: 'transparent',
                  border: '1px solid rgba(0,0,0,0.15)', borderRadius: 10,
                  padding: '9px 14px', color: 'rgba(0,0,0,0.55)',
                }}
              >
                <LogOut className="w-3.5 h-3.5" /> Leave
              </button>
            )}
          </div>
        )}
      </div>

      {/* Confirm overlay */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{
              borderRadius: 16,
              background: 'rgba(255,255,255,0.97)',
              border: confirmAction === 'complete'
                ? '1px solid rgba(26,58,173,0.25)'
                : '1px solid rgba(200,0,0,0.2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              padding: '14px 18px',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 15, color: '#0d1117', marginBottom: 12, textAlign: 'center',
            }}>
              {confirmAction === 'complete' ? 'Mark this goal complete?' : 'Leave this goal?'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
                  border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8,
                  padding: '7px 14px', color: 'rgba(0,0,0,0.5)', background: 'transparent',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'complete') onComplete?.(goal);
                  else onDelete?.();
                  setConfirmAction(null);
                }}
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                  fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
                  background: confirmAction === 'complete'
                    ? 'linear-gradient(135deg, #1a3aad, #0d1f6b)'
                    : 'linear-gradient(135deg, rgba(200,0,0,0.85), rgba(150,0,0,0.85))',
                  border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8,
                  padding: '7px 14px', color: '#fff',
                }}
              >
                {confirmAction === 'complete' ? 'Confirm' : 'Leave'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}