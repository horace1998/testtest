import React from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

/**
 * PhotoWall — Instagram-style 3-column grid of the user's milestone photos.
 * Pulls from milestones.asset_url. All content is user-uploaded (UGC).
 */
export default function PhotoWall({ milestones = [], emptyLabel = 'No milestones yet' }) {
  const withPhotos = milestones.filter(m => m.asset_url).slice(0, 12);

  if (withPhotos.length === 0) {
    return (
      <div className="glass-subtle rounded-2xl p-8 text-center">
        <Camera className="w-6 h-6 text-foreground/30 mx-auto mb-2" strokeWidth={1.4} />
        <p className="text-xs text-muted-foreground font-heading">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {withPhotos.map((m, i) => (
        <motion.div
          key={m.id}
          className="relative aspect-square rounded-xl overflow-hidden bg-black/5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.03 * i, type: 'spring', stiffness: 260, damping: 24 }}
        >
          <img
            src={m.asset_url}
            alt={m.goal_title || 'milestone'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {m.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <p className="text-[9px] text-white font-heading line-clamp-1">{m.caption}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}