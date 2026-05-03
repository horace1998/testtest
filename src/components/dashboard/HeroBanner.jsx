import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { ImagePlus } from 'lucide-react';
import HeroPreview from '@/components/profile/HeroPreview';
import { Link } from 'react-router-dom';

/**
 * HeroBanner - editorial-style hero. Pure display.
 * - Caches HeroAsset queries aggressively (5min) so revisits are instant.
 * - Preloads the hero image so it appears smoothly without layout jank.
 * - Shows a soft glassy skeleton while the image decodes.
 */
export default function HeroBanner({ user }) {
  const { data: assets = [] } = useQuery({
    queryKey: ['heroAssets'],
    queryFn: () => synkify.entities.HeroAsset.list('order'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const hero = assets.find(a => a.role === 'hero');
  const [imgReady, setImgReady] = useState(false);

  // Preload the hero image as soon as the URL is known
  useEffect(() => {
    if (!hero?.image_url) {
      setImgReady(false);
      return;
    }
    setImgReady(false);
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'high';
    img.src = hero.image_url;
    let cancelled = false;
    const done = () => { if (!cancelled) setImgReady(true); };
    if (img.decode) {
      img.decode().then(done).catch(done);
    } else {
      img.onload = done;
      img.onerror = done;
    }
    return () => { cancelled = true; };
  }, [hero?.image_url]);

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      {hero ? (
        <div className="relative">
          {/* Skeleton shimmer - soft glass tint that blends with the dreamy bg */}
          {!imgReady && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden aspect-[4/5] z-10 glass-subtle">
              <div className="absolute inset-0 animate-pulse"
                style={{
                  background: 'radial-gradient(circle at 50% 55%, rgba(196,181,253,0.25), transparent 60%)',
                }}
              />
            </div>
          )}
          <motion.div
            initial={false}
            animate={{ opacity: imgReady ? 1 : 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroPreview
              imageUrl={hero.image_url}
              settings={hero}
              idolName={user?.favorite_idol}
              groupName={user?.favorite_group}
            />
          </motion.div>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden aspect-[4/5] flex items-center justify-center border border-dashed border-foreground/20 bg-foreground/3">
          <Link
            to="/profile"
            className="border border-foreground/15 rounded-2xl py-4 px-5 flex items-center gap-2 text-foreground"
          >
            <ImagePlus className="w-5 h-5 text-foreground" />
            <span className="font-heading text-sm font-semibold">Add Idol Photo in Profile</span>
          </Link>
        </div>
      )}
    </motion.div>
  );
}
