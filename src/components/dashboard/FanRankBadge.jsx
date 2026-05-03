import React from 'react';
import { motion } from 'framer-motion';
import { getFanRank, getNextRank, getRankScore } from '@/lib/fanRank';

export default function FanRankBadge({ totalCheckins = 0, milestoneCount = 0, idolImageUrl }) {
  const rank = getFanRank(totalCheckins, milestoneCount);
  const score = getRankScore(totalCheckins, milestoneCount);
  const next = getNextRank(totalCheckins, milestoneCount);
  const progress = next
    ? Math.min(100, Math.round(((score - (rank.minScore || 0)) / (next.rank.minScore - (rank.minScore || 0))) * 100))
    : 100;

  const showIdol = !!idolImageUrl;
  const IDOL_SIZE = 130; // px, circular idol diameter
  const IDOL_OVERLAP = 70; // px that stick up above the card top

  return (
    <motion.div
      className="mb-7 relative"
      style={{ paddingTop: showIdol ? IDOL_SIZE - IDOL_OVERLAP : 0 }}
    >
      {/* ── Hologram idol cutout (circular) ── */}
      {showIdol && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none overflow-hidden"
          style={{
            top: 0,
            zIndex: 30,
            width: IDOL_SIZE,
            height: IDOL_SIZE,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
          aria-hidden="true"
        >
          <motion.img
            src={idolImageUrl}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              borderRadius: '50%',
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* ── Dark navy card ── */}
      <motion.div
        className="relative overflow-hidden"
        style={{
          borderRadius: 24,
          background: 'linear-gradient(135deg, #0a1540 0%, #0d1f6b 45%, #1a3aad 100%)',
          border: '1px solid rgba(77, 127, 255, 0.4)',
          boxShadow: '0 8px 48px rgba(26, 58, 173, 0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
          padding: showIdol ? `${IDOL_SIZE - IDOL_OVERLAP + 16}px 22px 18px` : '20px 22px 18px',
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        {/* Animated iridescent sheen on card */}
        <motion.div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(77,127,255,0.06) 0%, rgba(140,80,255,0.04) 50%, transparent 100%)',
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Ghost rank watermark */}
        <div
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          aria-hidden="true"
          style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: 90, lineHeight: 1,
            color: 'rgba(255,255,255,0.04)',
            letterSpacing: '0.04em',
          }}
        >
          {rank.label}
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between mb-1 relative">
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.38em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
          }}>
            Fan Rank
          </span>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
          }}>
            {String(score).padStart(3, '0')} PTS
          </span>
        </div>

        {/* Rank title */}
        <div className="flex items-baseline gap-3 mb-4 relative">
          <h3 style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: 'clamp(2.2rem, 10vw, 3.5rem)',
            color: '#fff', lineHeight: 1, letterSpacing: '0.06em',
          }}>
            {rank.label}
          </h3>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic', fontSize: 13,
            color: 'rgba(255,255,255,0.5)',
          }}>
            {rank.description}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <motion.div
            style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, rgba(77,127,255,0.9), rgba(200,160,255,0.85))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        </div>
        <p style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 9, fontWeight: 600, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
          textAlign: 'right', marginTop: 7,
        }}>
          {next ? `${next.pointsNeeded} pts to ${next.rank.label}` : '— apex tier —'}
        </p>
      </motion.div>
    </motion.div>
  );
}