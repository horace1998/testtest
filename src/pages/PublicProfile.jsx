import React from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import FanRankBadge from '@/components/dashboard/FanRankBadge';
import BiasMonogram from '@/components/profile/BiasMonogram';
import BadgeGrid from '@/components/profile/BadgeGrid';
import PhotoWall from '@/components/profile/PhotoWall';
import { evaluateBadges, buildStats } from '@/lib/badges';
import { ArrowLeft } from 'lucide-react';

export default function PublicProfile() {
  const { email: rawEmail } = useParams();
  const email = decodeURIComponent(rawEmail || '');

  // Look up the public user record by email
  const { data: users = [], isLoading: loadingUser } = useQuery({
    queryKey: ['public-user', email],
    queryFn: () => synkify.entities.User.filter({ email }),
    enabled: !!email,
  });
  const profileUser = users[0];

  const { data: goals = [] } = useQuery({
    queryKey: ['public-goals', email],
    queryFn: () => synkify.entities.Goal.filter({ created_by: email }, '-created_date', 100),
    enabled: !!email,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['public-milestones', email],
    queryFn: () => synkify.entities.Milestone.filter({ created_by: email }, '-created_date', 50),
    enabled: !!email,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['public-missions-all'],
    queryFn: () => synkify.entities.Mission.list('-created_date', 100),
  });

  const stats = buildStats({ goals, milestones, missions, userEmail: email });
  const badges = evaluateBadges(stats);
  const completedGoals = stats.completedGoals;
  const totalCheckins = stats.totalCheckins;

  if (loadingUser) {
    return (
      <div className="min-h-screen relative pb-28 px-6 pt-14">
        <ThreeBackground />
        <div className="glass-strong rounded-3xl h-72 animate-pulse" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen relative pb-28 px-6 pt-14">
        <ThreeBackground />
        <Link to="/feed" className="inline-flex items-center gap-2 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <GlassCard variant="strong" className="p-10 text-center">
          <p className="font-heading font-bold text-lg mb-1">Profile not found</p>
          <p className="text-xs text-muted-foreground">This member's profile is unavailable.</p>
        </GlassCard>
      </div>
    );
  }

  // Check privacy settings
  if (profileUser.profile_visibility === 'private') {
    return (
      <div className="min-h-screen relative pb-28 px-6 pt-14">
        <ThreeBackground />
        <Link to="/feed" className="inline-flex items-center gap-2 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <GlassCard variant="strong" className="p-10 text-center">
          <p className="font-heading font-bold text-lg mb-1">Profile is Private</p>
          <p className="text-xs text-muted-foreground">This member's profile is not publicly visible.</p>
        </GlassCard>
      </div>
    );
  }

  const displayName = profileUser.full_name || (email.split('@')[0]);
  const biasName = profileUser.favorite_idol;
  const groupName = profileUser.favorite_group;

  return (
    <div className="min-h-screen relative pb-28">
      <ThreeBackground />

      <div className="relative z-10 px-6 pt-14">
        {/* Back button */}
        <Link to="/feed" className="inline-flex items-center gap-2 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </Link>

        {/* Editorial header */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>Station Member</p>
        </motion.div>

        {/* Bias Monogram - the centerpiece */}
        <div className="flex justify-center mb-6">
          <BiasMonogram biasName={biasName} groupName={groupName} size="xl" />
        </div>

        {/* Name + handle */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-display text-4xl tracking-wide uppercase" style={{ color: '#0d1117' }}>{displayName}</h1>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', margin: '12px auto', maxWidth: 120 }} />
          {biasName ? (
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>
              Stanning <span style={{ color: '#0d1117' }}>{groupName || biasName}</span>
              {biasName && groupName ? <> · Bias <span style={{ color: '#0d1117' }}>{biasName}</span></> : null}
            </p>
          ) : (
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>Discovering their fandom</p>
          )}
        </motion.div>

        {/* Fan Rank */}
        <FanRankBadge totalCheckins={totalCheckins} milestoneCount={milestones.length} />

        {/* Followers / Following stats */}
        <div className="grid grid-cols-3 mb-8" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          {[
            { label: 'Followers', value: profileUser.followers?.length || 0 },
            { label: 'Following', value: profileUser.following?.length || 0 },
            { label: 'Creations', value: milestones.length },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center py-4"
              style={{ borderRight: i < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#0d1117', fontWeight: 600 }}>
                {String(s.value).padStart(3, '0')}
              </p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', marginTop: 3 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats - editorial four-column index */}
        <div className="grid grid-cols-4 mb-8" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          {[
            { label: 'Goals', value: goals.length },
            { label: 'Done', value: completedGoals },
            { label: 'Entries', value: totalCheckins },
            { label: 'Wins', value: milestones.length },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center py-4"
              style={{ borderRight: i < 3 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#0d1117', fontWeight: 600 }}>
                {String(s.value).padStart(2, '0')}
              </p>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', marginTop: 3 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Photo Wall */}
        <div className="mb-8">
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 12 }}>Milestone Wall</p>
          <PhotoWall milestones={milestones} emptyLabel="No milestones shared yet" />
        </div>

        {/* Trophy Case */}
        <div className="mb-8">
          <BadgeGrid badges={badges} />
        </div>

        {/* Footer link back */}
        <Link to="/feed" className="block">
          <GlassButton variant="ghost" className="w-full">Back to Fan Feed</GlassButton>
        </Link>
      </div>
    </div>
  );
}
