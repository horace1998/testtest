import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { ArrowLeft, Calendar, Users, Sparkles } from 'lucide-react';
import PageShell from '@/components/PageShell';
import CircleMembersList from '@/components/circle/CircleMembersList';
import CircleStoryComposer from '@/components/circle/CircleStoryComposer';
import CircleUnifiedFeed from '@/components/circle/CircleUnifiedFeed';

export default function SupportCircle() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => synkify.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: mission, isLoading } = useQuery({
    queryKey: ['mission', id],
    queryFn: () => synkify.entities.Mission.get(id),
    enabled: !!id,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const isMember = !!mission && (
    mission.creator_email === user?.email ||
    (mission.members || []).some(m => m.user_email === user?.email)
  );

  if (isLoading || !mission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 18, color: 'rgba(0,0,0,0.55)', marginBottom: 16, textAlign: 'center',
        }}>This circle is for members only.</p>
        <button
          onClick={() => navigate('/missions')}
          style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
            color: '#fff', borderRadius: 12, padding: '10px 20px',
          }}
        >Browse Missions</button>
      </div>
    );
  }

  // Combine creator + members in one list (creator first, dedup)
  const allMembers = [
    ...((mission.creator_email && !(mission.members || []).some(m => m.user_email === mission.creator_email))
      ? [{
          user_email: mission.creator_email,
          user_name: mission.creator_name,
          joined_date: mission.created_date,
        }]
      : []
    ),
    ...(mission.members || []),
  ];

  return (
    <div className="min-h-screen relative pb-28">
      <PageShell goals={goals} user={user}>
        <div className="relative z-10 px-6 pt-[3.5rem]">
          <Link to="/missions" className="inline-flex items-center gap-1.5 mb-4" style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.5)',
          }}>
            <ArrowLeft className="w-3 h-3" /> Missions
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
              fontWeight: 700, letterSpacing: '0.38em', textTransform: 'uppercase',
              color: '#1a3aad', marginBottom: 6,
            }} className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Support Circle
            </p>
            <h1 style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: 'clamp(2rem, 8vw, 3rem)',
              color: '#0d1117', lineHeight: 1, letterSpacing: '0.02em',
            }}>{mission.title}</h1>
            {mission.description && (
              <p style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: 14, color: 'rgba(0,0,0,0.55)', marginTop: 8,
              }}>{mission.description}</p>
            )}

            <div className="flex items-center gap-3 mt-3" style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
              fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.45)',
            }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {mission.timeline_value} {mission.timeline_unit}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {allMembers.length}</span>
              {mission.idol_group && <span>· {mission.idol_group}</span>}
            </div>
          </motion.div>

          <CircleMembersList members={allMembers} currentUser={user} circleId={mission.id} />

          <div className="flex items-center gap-3 mb-4">
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
              textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
            }}>
              Circle Feed
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
          </div>
          <CircleStoryComposer circleId={mission.id} mission={mission} currentUser={user} />
          <CircleUnifiedFeed circleId={mission.id} members={allMembers} currentUser={user} />
        </div>
      </PageShell>
    </div>
  );
}
