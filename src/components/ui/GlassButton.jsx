import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function GlassButton({ children, className, variant = 'primary', onClick, disabled, ...props }) {
  const baseClass = 'relative overflow-hidden rounded-2xl px-6 py-3 font-body font-semibold text-sm transition-all duration-300 cursor-pointer select-none';

  const variants = {
    primary: 'text-white',
    secondary: 'text-white/80',
    accent: 'text-white',
    ghost: 'text-foreground',
  };

  const inlineStyles = {
    primary: { background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)', border: '1px solid rgba(77,127,255,0.35)', boxShadow: '0 4px 20px rgba(26,58,173,0.45)' },
    secondary: { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.12)' },
    accent: { background: 'linear-gradient(135deg, #4d7fff, #1a3aad)', border: '1px solid rgba(77,127,255,0.4)' },
    ghost: { background: 'transparent', border: '1px solid rgba(0,0,0,0.15)' },
  };

  return (
    <motion.button
      className={cn(baseClass, variants[variant], disabled && 'opacity-50 pointer-events-none', className)}
      style={inlineStyles[variant]}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}