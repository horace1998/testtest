import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import FocusPicker from '@/components/FocusPicker';

export default function OnboardingIdol({ onNext, onBack }) {
  const [group, setGroup] = useState('');
  const [bias, setBias] = useState('');

  const subject = bias || group;
  const canContinue = !!group;

  const handleContinue = () => {
    if (!canContinue) return;
    onNext({
      idol_name: bias || group,
      idol_group: group,
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
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-heading mb-2">Step 1 of 2</p>
        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Pick your focus</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Choose a group, and optionally a bias. You can change this anytime in Profile.
        </p>
      </motion.div>

      <GlassCard className="p-5 mb-6" animate={false}>
        <FocusPicker
          group={group}
          bias={bias}
          onChange={({ group: g, bias: b }) => { setGroup(g); setBias(b); }}
        />
      </GlassCard>

      {/* Live preview */}
      <GlassCard variant="strong" className="p-5 mb-6 text-center" animate={false}>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading">Your Focus</p>
        </div>
        {subject ? (
          <motion.div
            key={subject}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <p className="font-display text-3xl tracking-wide uppercase bg-gradient-to-r from-violet-500 to-pink-400 bg-clip-text text-transparent">
              {subject}
            </p>
            {bias && group && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                <p className="text-xs text-muted-foreground font-heading">{group}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">Pick a group to see it here</p>
        )}
      </GlassCard>

      <div className="flex gap-3">
        <GlassButton variant="ghost" onClick={onBack} className="flex-1">Back</GlassButton>
        <GlassButton
          variant="primary"
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex-1 flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </GlassButton>
      </div>
    </motion.div>
  );
}