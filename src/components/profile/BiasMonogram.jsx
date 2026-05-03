import React from 'react';
import { motion } from 'framer-motion';

/**
 * BiasMonogram — editorial monochrome monogram.
 * Pure typography on a cream / ink background, no gradients.
 */
export default function BiasMonogram({ biasName, groupName, size = 'lg' }) {
  const subject = (biasName || groupName || '?').trim();
  const letter = subject.charAt(0).toUpperCase() || '?';

  const sizes = {
    md: { box: 'w-20 h-20', letter: 'text-5xl' },
    lg: { box: 'w-32 h-32', letter: 'text-7xl' },
    xl: { box: 'w-40 h-40', letter: 'text-8xl' },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`relative ${s.box} rounded-full bg-background border border-foreground/20 flex items-center justify-center overflow-hidden`}
      >
        <span
          className={`font-display ${s.letter} text-foreground leading-none tracking-tight relative z-10`}
          style={{ fontWeight: 600 }}
        >
          {letter}
        </span>
      </div>

      {(biasName || groupName) && (
        <div className="mt-4 text-center">
          {groupName && (
            <p className="editorial-eyebrow">{groupName}</p>
          )}
          {biasName && (
            <p className="editorial-italic text-base text-foreground mt-1">
              {biasName}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}