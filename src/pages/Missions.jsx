import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import PageShell from '@/components/PageShell';
import MissionCard from '@/components/missions/MissionCard';
import GoalCard from '@/components/dashboard/GoalCard';
import { ArrowRight, Users, Flame, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { shouldShowMissionAsMine } from '@/lib/missionMembership';
import { repairMissionStateForUser } from '@/lib/repairMissionState';
import { leaveGoal } from '@/lib/leaveGoal';
import { useNavAction } from '@/lib/NavActionContext';

export default function Missions() {
  const [filterGroup, setFilterGroup] = useState('all');
  const [tab, setTab] = useState('mine'); // mine | trending | new
  const queryClient = useQueryClient();
  const { select } = useNavAction();

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

  const checkinMutation = useMutation({
    mutationFn: (goal) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const checkins = [...(goal.daily_checkins || []), { date: today, completed: true, note: '' }];
      return synkify.entities.Goal.update(goal.id, { daily_checkins: checkins });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (goal) => synkify.entities.Goal.update(goal.id, { status: 'completed', progress: 100 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: (goal) => leaveGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  useEffect(() => {
    if (!user?.email || goals.length === 0) return;

    repairMissionStateForUser(user, goals).then((result) => {
      if (!result.abandonedGoals && !result.leftMissions) return;
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    }).catch(() => null);
  }, [goals, queryClient, user]);

  const groups = ['all', ...new Set(missions.map(m => m.idol_group).filter(Boolean))];

  let filtered = filterGroup === 'all' ? missions : missions.filter(m => m.idol_group === filterGroup);

  if (tab === 'trending') {
    filtered = [...filtered].sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
  } else if (tab === 'mine') {
    filtered = filtered.filter(m => shouldShowMissionAsMine(m, goals, user?.email));
  }

  const privateGoals = goals.filter((goal) => {
    if (tab !== 'mine') return false;
    if (goal.status !== 'active' || goal.mission_id) return false;
    return filterGroup === 'all' || goal.idol_group === filterGroup;
  });
  const publicMissionGoals = filtered
    .map((mission) => goals.find((goal) => goal.status === 'active' && goal.mission_id === mission.id))
    .filter(Boolean);
  const hasMineItems = privateGoals.length > 0 || publicMissionGoals.length > 0;

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
          ) : tab === 'mine' && !hasMineItems ? (
            <GlassCard className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-heading font-semibold mb-1">No active goals</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a private goal, publish a mission, or join one to get started.
              </p>
              <button
                onClick={() => {
                  select('goal');
                }}
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                  fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                  color: '#fff', borderRadius: 12, padding: '10px 20px',
                }}
              >
                Create a Goal
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-6">
              {tab === 'mine' && privateGoals.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-[9px] font-heading font-bold uppercase tracking-[0.35em] text-foreground/35">
                      Private Goals
                    </span>
                    <div className="h-px flex-1 bg-foreground/10" />
                    <span className="font-display text-base leading-none text-primary">
                      {String(privateGoals.length).padStart(2, '0')}
                    </span>
                  </div>
                  {privateGoals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      index={i}
                      onCheckin={(g) => checkinMutation.mutate(g)}
                      onComplete={(g) => completeMutation.mutate(g)}
                      onDelete={() => leaveMutation.mutate(goal)}
                    />
                  ))}
                </section>
              )}

              {publicMissionGoals.length > 0 && (
                <section>
                  {tab === 'mine' && (
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[9px] font-heading font-bold uppercase tracking-[0.35em] text-foreground/35">
                        Public Missions
                      </span>
                      <div className="h-px flex-1 bg-foreground/10" />
                      <span className="font-display text-base leading-none text-primary">
                        {String(publicMissionGoals.length).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {publicMissionGoals.map((goal, i) => (
                    <div key={goal.id} className="relative">
                      <Link
                        to={`/circle/${goal.mission_id}`}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 bg-white/95 text-primary shadow-sm"
                        aria-label="Open support circle"
                        title="Open support circle"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <GoalCard
                        goal={goal}
                        index={i}
                        onCheckin={(g) => checkinMutation.mutate(g)}
                        onComplete={(g) => completeMutation.mutate(g)}
                        onDelete={() => leaveMutation.mutate(goal)}
                      />
                    </div>
                  ))}
                </section>
              )}

              {tab !== 'mine' && filtered.map((m, i) => (
                <MissionCard key={m.id} mission={m} currentUser={user} userGoals={goals} index={i} />
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}
