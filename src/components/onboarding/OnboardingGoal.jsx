import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { Loader2, Minus, Target, ArrowRight } from 'lucide-react';

const GOAL_SUGGESTIONS = [
  'Exercise every day',
  'Study for 2 hours',
  'Learn a new language',
  'Read 30 pages',
  'Practice dancing',
  'Save money daily',
  'Eat healthier',
  'Journal my thoughts',
];

const TIMELINE_UNITS = ['days', 'weeks', 'months'];

export default function OnboardingGoal({ idolData, onComplete, onBack, isSaving = false, error = '' }) {
  const [goal, setGoal] = useState('');
  const [timelineValue, setTimelineValue] = useState(7);
  const [timelineUnit, setTimelineUnit] = useState('days');

  const handleComplete = () => {
    if (!goal.trim() || isSaving) return;
    onComplete({
      title: goal.trim(),
      idol_name: idolData.idol_name,
      idol_group: idolData.idol_group,
      timeline_value: timelineValue,
      timeline_unit: timelineUnit,
    });
  };

  return (
    <motion.div
      className="min-h-screen px-6 pt-16 pb-8"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-heading mb-2">Step 2 of 2</p>
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Set your first goal</h2>
        <p className="text-muted-foreground text-sm mb-6">What will you achieve before meeting <span className="font-semibold text-foreground">{idolData.idol_name}</span>?</p>
      </motion.div>

      {/* Preview card */}
      <GlassCard variant="strong" className="p-6 mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="iridescent rounded-xl p-4 glass mb-4">
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-2">My Pledge</p>
            <p className="font-heading text-lg font-bold text-foreground leading-snug">
              Before I meet <span className="text-violet-500">{idolData.idol_name}</span>, I will{' '}
              <span className="text-indigo-500">{goal || '...'}</span>{' '}
              for the next{' '}
              <span className="text-violet-500">{timelineValue} {timelineUnit}</span>
            </p>
          </div>
        </motion.div>
      </GlassCard>

      {/* Goal input */}
      <GlassCard className="p-4 mb-4" animate={false}>
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-4 h-4 text-violet-500" />
          <span className="text-xs font-heading uppercase tracking-wider text-muted-foreground">Your Goal</span>
        </div>
        <input
          type="text"
          placeholder="e.g. Exercise every day"
          className="w-full bg-transparent text-foreground outline-none text-base font-medium placeholder:text-muted-foreground/40"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </GlassCard>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {GOAL_SUGGESTIONS.map((s, i) => (
          <motion.button
            type="button"
            key={s}
            className={`glass-subtle rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              goal === s ? 'bg-violet-300/30 text-violet-600 ring-1 ring-violet-300/50' : 'text-muted-foreground hover:bg-white/50'
            }`}
            onClick={() => setGoal(s)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            whileTap={{ scale: 0.95 }}
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Timeline */}
      <GlassCard className="p-4 mb-8" animate={false}>
        <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground mb-3">Timeline</p>
        <div className="flex items-center gap-4">
          <div className="glass-subtle rounded-xl px-4 py-2 flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-foreground font-bold"
              onClick={() => setTimelineValue(Math.max(1, timelineValue - 1))}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-heading font-bold text-2xl w-10 text-center">{timelineValue}</span>
            <button
              type="button"
              className="w-8 h-8 rounded-full glass flex items-center justify-center text-foreground font-bold"
              onClick={() => setTimelineValue(timelineValue + 1)}
            >+</button>
          </div>
          <div className="flex gap-2 flex-1">
            {TIMELINE_UNITS.map(unit => (
              <button
                type="button"
                key={unit}
                className={`flex-1 rounded-xl py-2 text-xs font-heading font-medium capitalize transition-all ${
                  timelineUnit === unit
                    ? 'bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md'
                    : 'glass-subtle text-muted-foreground'
                }`}
                onClick={() => setTimelineUnit(unit)}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="flex gap-3">
        <GlassButton variant="ghost" onClick={onBack} disabled={isSaving} className="flex-1">Back</GlassButton>
        <GlassButton
          variant="primary"
          onClick={handleComplete}
          disabled={!goal.trim() || isSaving}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synkifying
            </>
          ) : (
            <>
              Synkify <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GlassButton>
      </div>
      {error && (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-xs text-red-600">
          {error}
        </p>
      )}
    </motion.div>
  );
}
