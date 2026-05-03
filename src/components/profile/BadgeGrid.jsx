import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

/**
 * BadgeGrid — trophy case display.
 * Shows earned badges in full color and locked ones grayscale with a lock icon,
 * just like Strava / Duolingo achievement screens.
 */
export default function BadgeGrid({ badges = [], showLocked = true }) {
  const visible = showLocked ? badges : badges.filter(b => b.earned);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading">
          Trophy Case
        </p>
        <p className="text-[10px] text-muted-foreground font-heading">
          {badges.filter(b => b.earned).length} / {badges.length}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {visible.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: 'spring', stiffness: 240, damping: 24 }}
            >
              <GlassCard
                variant={b.earned ? 'strong' : 'subtle'}
                className={`p-3 text-center aspect-square flex flex-col items-center justify-center ${
                  !b.earned ? 'opacity-60 grayscale' : ''
                }`}
                animate={false}
              >
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-1.5 shadow-md shadow-violet-200/40 relative`}
                >
                  <Icon className="w-5 h-5 text-white drop-shadow" />
                  {!b.earned && (
                    <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  )}
                </div>
                <p className="font-heading text-[10px] font-bold leading-tight">{b.label}</p>
                <p className="text-[8px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                  {b.description}
                </p>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}