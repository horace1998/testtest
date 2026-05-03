import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { getFanRank, getNextRank, getRankScore } from '@/lib/fanRank';
import HeroUploadModal from './HeroUploadModal';

export default function HeroDecorator({ user, totalCheckins = 0, milestoneCount = 0 }) {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const bgUrl = user?.hero_bg_url;
  const sideImages = user?.hero_side_urls || [null, null];

  const rank = getFanRank(totalCheckins, milestoneCount);
  const score = getRankScore(totalCheckins, milestoneCount);
  const next = getNextRank(totalCheckins, milestoneCount);
  const progress = next
    ? Math.min(100, Math.round(((score - (rank.minScore || 0)) / (next.rank.minScore - (rank.minScore || 0))) * 100))
    : 100;

  const saveHeroImage = async (imageUrl) => {
    await synkify.auth.updateMe({
      hero_bg_url: imageUrl,
      background_image_url: user?.background_image_url || imageUrl,
    });
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setUploadOpen(false);
  };

  const rankHeader = (
    <div className="absolute inset-x-0 top-0 p-6 z-10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 6,
            }}
          >
            Fan Rank
          </p>
          <div className="flex items-baseline gap-3">
            <h3
              style={{
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 'clamp(2.2rem, 10vw, 3.2rem)',
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '0.05em',
              }}
            >
              {rank.label}
            </h3>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {rank.description}
            </p>
          </div>
        </div>
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {String(score).padStart(3, '0')} PTS
        </span>
      </div>

      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginBottom: 8 }}>
        <motion.div
          style={{
            height: '100%',
            borderRadius: 99,
            background: 'linear-gradient(90deg, rgba(77,127,255,0.95), rgba(200,160,255,0.9))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </div>
      <p
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
          textAlign: 'right',
        }}
      >
        {next ? `${next.pointsNeeded} pts to ${next.rank.label}` : 'Apex tier'}
      </p>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: bgUrl ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{
          minHeight: bgUrl ? 469 : 340,
          background: 'linear-gradient(135deg, #07113d 0%, #0d1f6b 48%, #1a3aad 100%)',
          border: '1px solid rgba(77, 127, 255, 0.4)',
          boxShadow: '0 8px 48px rgba(26, 58, 173, 0.48), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {bgUrl ? (
          <>
            <img
              src={bgUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 opacity-80"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.82), rgba(3,10,34,0.62) 52%, rgba(6,18,70,0.5)), linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.78))',
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,18,62,0.35), rgba(8,18,62,0.9)), radial-gradient(circle at 50% 46%, rgba(255,255,255,0.16), transparent 28%)',
            }}
          />
        )}

        {rankHeader}

        <button
          onClick={() => setUploadOpen(true)}
          className="absolute top-4 right-4 z-20 rounded-full bg-white/12 border border-white/25 backdrop-blur-md p-2 text-white transition-transform active:scale-95"
          title={bgUrl ? 'Change idol image' : 'Upload idol image'}
        >
          <ImagePlus className="w-4 h-4" />
        </button>

        {bgUrl ? (
          <div className="absolute inset-0 flex items-center justify-center px-8 pt-20">
            <img
              src={bgUrl}
              alt={user?.favorite_idol || 'Idol'}
              className="w-44 h-44 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-white shadow-xl"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-8 pt-20 z-10">
            <button
              onClick={() => setUploadOpen(true)}
              className="rounded-full border-2 border-white/90 bg-white/10 backdrop-blur-md w-40 h-40 flex flex-col items-center justify-center gap-3 text-white transition-transform active:scale-95"
            >
              <ImagePlus className="w-8 h-8" />
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-center leading-5">
                Upload Idol Image
              </span>
            </button>
          </div>
        )}

        {sideImages[0] && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 h-48 overflow-hidden rounded-r-2xl shadow-lg">
            <img src={sideImages[0]} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {sideImages[1] && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-48 overflow-hidden rounded-l-2xl shadow-lg">
            <img src={sideImages[1]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </motion.div>

      <HeroUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={saveHeroImage}
        role="hero"
      />
    </>
  );
}
