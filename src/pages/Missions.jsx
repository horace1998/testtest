import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/PageShell';
import MissionCard from '@/components/missions/MissionCard';
import { Users, Flame, TrendingUp } from 'lucide-react';

export default function Missions() {
  const [filterGroup, setFilterGroup] = useState('all');
  const [tab, setTab] = useState('mine'); // mine | trending | new
  const queryClient = useQueryClient();

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => synkify.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => synkify.entities.Mission.filter(
      { status: 'active', moderation_status: 'approved' },
      '-created_date',
      100
    ),
  });

  useEffect(() => {
    if (!synkify.entities.Mission.subscribe) return undefined;

    return synkify.entities.Mission.subscribe(
      { status: 'active', moderation_status: 'approved' },
      '-created_date',
      100,
      (records) => queryClient.setQueryData(['missions'], records),
      (error) => console.error('Mission live subscription failed:', error)
    );
  }, [queryClient]);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const groups = ['all', ...new Set(missions.map(m => m.idol_group).filter(Boolean))];

  let filtered = filterGroup === 'all' ? missions : missions.filter(m => m.idol_group === filterGroup);

  if (tab === 'trending') {
    filtered = [...filtered].sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
  } else if (tab === 'mine') {
    const userEmail = user?.email?.toLowerCase();

    // Use multiple ownership signals because older mission goals may not have mission_id backfilled.
    const activeMissionIds = new Set(
      goals.filter(g => g.status === 'active' && g.mission_id).map(g => g.mission_id)
    );
    const activePublicGoalFingerprints = new Set(
      goals
        .filter(g => g.status === 'active' && g.is_mission_creator)
        .map(g => `${g.title || ''}|${g.idol_name || ''}|${g.idol_group || ''}`)
    );

    filtered = filtered.filter(m =>
      m.creator_email?.toLowerCase() === userEmail ||
      activeMissionIds.has(m.id) ||
      (m.members || []).some(member => member.user_email?.toLowerCase() === userEmail) ||
      activePublicGoalFingerprints.has(`${m.title || ''}|${m.idol_name || ''}|${m.idol_group || ''}`)
    );
  }

  return (
    <div className="min-h-screen relative pb-28">
      <PageShell goals={goals} user={user}>
        <ThreeBackground />

        <div className="relative z-10 px-5 pt-[3.5rem]">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="mb-6"
          >
            <p className="editorial-eyebrow mb-1">Squad up</p>
            <h1 className="font-display text-4xl tracking-tight text-foreground" style={{ fontWeight: 800 }}>MISSIONS</h1>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'mine', label: 'Mine', icon: Users },
              { id: 'trending', label: 'Trending', icon: Flame },
              { id: 'new', label: 'New', icon: TrendingUp },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  className={`flex-1 rounded-xl py-2 text-[11px] font-heading font-semibold transition-all flex items-center justify-center gap-1 ${
                    tab === t.id
                      ? 'bg-foreground text-background'
                      : 'border border-foreground/15 text-muted-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Group filter pills */}
          {groups.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
              {groups.map(g => (
                <button
                  key={g}
                  onClick={() => setFilterGroup(g)}
                  className={`rounded-full px-3 py-1.5 text-xs font-heading font-medium flex-shrink-0 transition-all ${
                    filterGroup === g
                      ? 'bg-foreground text-background'
                      : 'border border-foreground/15 text-muted-foreground'
                  }`}
                >
                  {g === 'all' ? 'All Groups' : g}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-36 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 && tab !== 'mine' ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading font-semibold mb-1">No missions yet</p>
              <p className="text-sm text-muted-foreground">
                Create a goal and toggle "Public mission" to be the first!
              </p>
            </GlassCard>
          ) : tab === 'mine' && filtered.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading font-semibold mb-1">No active missions</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a public mission or join one to get started!
              </p>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => document.querySelector('[data-scroll-to-goal]')?.click?.(), 300);
                }}
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                  fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                  color: '#fff', borderRadius: 12, padding: '10px 20px',
                }}
              >
                Create a Mission
              </button>
            </GlassCard>
          ) : (
            <div>
              {filtered.map((m, i) => (
                <MissionCard key={m.id} mission={m} currentUser={user} userGoals={goals} index={i} />
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}
