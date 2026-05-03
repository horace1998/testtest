import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function EditorialHeader({ user }) {
  const name = user?.full_name || user?.email?.split('@')[0] || '…';
  const idol = user?.favorite_idol || 'your idol';
  const group = user?.favorite_group || '';
  const today = format(new Date(), 'MMM dd');

  return (
    <div className="relative mb-8 overflow-visible pb-6">
      {/* Huge ghost text behind */}
      <div
        className="absolute inset-0 flex items-center overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <p
          style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: 'clamp(6rem, 30vw, 16rem)',
            lineHeight: 0.85,
            color: 'rgba(0,0,0,0.04)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            marginLeft: '-0.05em',
          }}
        >
          {group || name}
        </p>
      </div>

      {/* Date tag */}
      <motion.div
        className="relative flex items-center gap-3 mb-3"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ width: 28, height: 1, background: 'rgba(77, 127, 255, 0.6)' }} />
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.35em',
          textTransform: 'uppercase', color: 'rgba(77,127,255,0.8)',
        }}>
          {today}
        </span>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1a3aad' }} />
        <span style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.35em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
        }}>
          Welcome back
        </span>
      </motion.div>

      {/* Main name */}
      <motion.h1
        className="relative"
        style={{
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: 'clamp(2.8rem, 12vw, 6rem)',
          lineHeight: 1.1,
          paddingBottom: '0.08em',
          letterSpacing: '0.02em',
          color: '#0d1117',
          fontWeight: 400,
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {name}
      </motion.h1>

      {/* Idol tag — iMessage style bubble */}
      {idol && (
        <motion.div
          className="relative mt-3 inline-flex"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="chat-bubble-in text-xs" style={{ fontSize: 12, padding: '7px 14px' }}>
            for {idol}{group ? ` · ${group}` : ''}
          </div>
        </motion.div>
      )}
    </div>
  );
}