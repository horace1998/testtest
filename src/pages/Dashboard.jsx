import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { synkify } from '@/api/synkifyClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ThreeBackground from '@/components/ThreeBackground';
import GoalCard from '@/components/dashboard/GoalCard';
import NewGoalModal from '@/components/dashboard/NewGoalModal';
import PageShell from '@/components/PageShell';
import NotificationBell from '@/components/NotificationBell';
import FanRankBadge from '@/components/dashboard/FanRankBadge';
import EditorialHeader from '@/components/dashboard/EditorialHeader';
import LevelUpModal from '@/components/LevelUpModal';
import CheerInbox from '@/components/circle/CheerInbox';
import HomeSplash from '@/components/dashboard/HomeSplash';
import { leaveGoal } from '@/lib/leaveGoal';
import { getFanRank, getRankScore } from '@/lib/fanRank';
import { addDays, addMonths, addWeeks, differenceInCalendarDays, format, parseISO, isSameDay } from 'date-fns';
import { Calendar, Clock, CheckCircle2, Circle, Share2, Settings } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import HeroDecorator from '@/components/dashboard/HeroDecorator';
import SettingsModal from '@/components/SettingsModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => synkify.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (user?.onboarded === false) navigate('/onboarding');
  }, [user, navigate]);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const [levelUpRank, setLevelUpRank] = useState(null);

  const checkinMutation = useMutation({
    mutationFn: ({ goal, prevRankId }) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const checkins = [...(goal.daily_checkins || []), { date: today, completed: true, note: '' }];
      return synkify.entities.Goal.update(goal.id, { daily_checkins: checkins })
        .then(() => prevRankId);
    },
    onSuccess: (prevRankId) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      // Detect rank-up: recompute with one extra check-in
      const newCheckins = totalCheckins + 1;
      const newRank = getFanRank(newCheckins, milestoneCount);
      if (newRank.id !== prevRankId) {
        setLevelUpRank(newRank);
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (goal) => {
      await synkify.entities.Goal.update(goal.id, { status: 'completed', progress: 100 });
      // If linked to a mission and user isn't the creator, also remove from members list
      if (goal.mission_id) {
        try {
          const mission = await synkify.entities.Mission.get(goal.mission_id);
          if (mission && mission.creator_email !== user?.email) {
            await synkify.functions.invoke('leaveMission', { mission_id: goal.mission_id });
          }
        } catch {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goal) => leaveGoal(goal, user?.email),
    onMutate: async (goal) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      await queryClient.cancelQueries({ queryKey: ['missions'] });
      await queryClient.cancelQueries({ queryKey: ['active-missions'] });

      const previousGoals = queryClient.getQueryData(['goals']);
      const previousMissions = queryClient.getQueryData(['missions']);

      queryClient.setQueryData(['goals'], (current = []) =>
        current.map((item) =>
          item.id === goal.id ? { ...item, status: 'abandoned', updated_date: new Date().toISOString() } : item
        )
      );

      if (goal.mission_id && user?.email) {
        queryClient.setQueryData(['missions'], (current = []) =>
          current
            .map((mission) => {
              if (mission.id !== goal.mission_id) return mission;
              const members = (mission.members || []).filter((member) => member.user_email !== user.email);
              const shouldClose = mission.creator_email === user.email || members.length === 0;
              return { ...mission, members, member_count: members.length, status: shouldClose ? 'closed' : mission.status };
            })
            .filter((mission) => mission.status === 'active')
        );
      }

      return { previousGoals, previousMissions };
    },
    onError: (_error, _goal, context) => {
      if (context?.previousGoals) queryClient.setQueryData(['goals'], context.previousGoals);
      if (context?.previousMissions) queryClient.setQueryData(['missions'], context.previousMissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['active-missions'] });
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => synkify.entities.Milestone.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => synkify.entities.Task.list('-due_date'),
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const totalCheckins = goals.reduce((sum, g) => sum + (g.daily_checkins?.filter(c => c.completed).length || 0), 0);
  const milestoneCount = milestones.length;
  const currentRank = getFanRank(totalCheckins, milestoneCount);
  const canAddGoal = activeGoals.length < 3;
  const activeMissionGoals = activeGoals.filter((goal) => goal.mission_id);

  const { data: activeMissions = [] } = useQuery({
    queryKey: ['active-missions', activeMissionGoals.map((goal) => goal.mission_id).sort().join(',')],
    queryFn: async () => {
      const ids = [...new Set(activeMissionGoals.map((goal) => goal.mission_id).filter(Boolean))];
      const records = await Promise.all(ids.map((id) => synkify.entities.Mission.get(id).catch(() => null)));
      return records.filter(Boolean);
    },
    enabled: activeMissionGoals.length > 0,
  });

  const missionById = new Map(activeMissions.map((mission) => [mission.id, mission]));

  const handleCheckin = (goal) => {
    checkinMutation.mutate({ goal, prevRankId: currentRank.id });
  };

  const handleDeleteGoal = (goal) => {
    deleteGoalMutation.mutate(goal);
  };

  const handleShareLevelUp = async () => {
    if (!user || !levelUpRank) return;
    await synkify.entities.FeedPost.create({
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      idol_name: user.favorite_idol || 'Fan',
      idol_group: user.favorite_group || '',
      goal_title: `Reached ${levelUpRank.label} rank!`,
      caption: `Just leveled up to ${levelUpRank.label}: ${levelUpRank.description}`,
      fan_rank: levelUpRank.label,
      cheers: [],
    });
    queryClient.invalidateQueries({ queryKey: ['feedPosts'] });
    setLevelUpRank(null);
    navigate('/feed');
  };

  return (
    <div className="min-h-screen relative pb-32" style={{ background: '#ffffff' }}>
      <HomeSplash />
      <PageShell goals={goals} user={user}>

      <div className="relative z-10 px-5 pt-[3.5rem]">
        {/* Top utility bar */}
         <motion.div
           className="flex items-center justify-between mb-1 pt-3"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.5 }}
         >
           <div />
           <div className="flex items-center gap-3">
             <button
               onClick={() => setSettingsOpen(true)}
               className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
               title="Settings"
             >
               <Settings className="w-5 h-5 text-foreground" />
             </button>
             <NotificationBell userEmail={user?.email} />
           </div>
         </motion.div>

        {/* Poster header */}
        <EditorialHeader user={user} />

        {/* Identity Section - Hero + Fan Rank unified */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {user && (
            <HeroDecorator 
              user={user} 
              totalCheckins={totalCheckins} 
              milestoneCount={milestoneCount}
            />
          )}
        </motion.div>

        {/* Active Missions */}
        {activeMissionGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
              }}>
                Active Mission
              </span>
            </div>
            <div className="space-y-3">
              {activeMissionGoals.map((goal, index) => {
                const mission = missionById.get(goal.mission_id);
                const timelineValue = Number(goal.timeline_value || mission?.timeline_value || 0);
                const timelineUnit = (goal.timeline_unit || mission?.timeline_unit || 'days').toLowerCase();
                const startDate = goal.created_date ? new Date(goal.created_date) : new Date();
                const endDate = timelineValue
                  ? timelineUnit.startsWith('month')
                    ? addMonths(startDate, timelineValue)
                    : timelineUnit.startsWith('week')
                      ? addWeeks(startDate, timelineValue)
                      : addDays(startDate, timelineValue)
                  : null;
                const daysRemaining = endDate ? Math.max(0, differenceInCalendarDays(endDate, new Date())) : null;

                return (
                  <div key={goal.id} className="rounded-2xl border border-foreground/10 bg-white/95 p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/support-circle/${goal.mission_id}`)}
                      className="mb-3 grid w-full grid-cols-3 gap-2 text-left"
                    >
                      {[
                        { label: 'Duration', value: timelineValue ? `${timelineValue} ${timelineUnit}` : 'Open' },
                        { label: 'Remaining', value: daysRemaining === null ? '--' : `${daysRemaining}d` },
                        { label: 'Fans', value: mission?.member_count || 1 },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-2 py-2 text-center">
                          <p className="font-display text-xl leading-none text-foreground">{item.value}</p>
                          <p className="mt-1 text-[8px] font-heading font-bold uppercase tracking-[0.18em] text-foreground/40">{item.label}</p>
                        </div>
                      ))}
                    </button>
                    <GoalCard
                      goal={goal}
                      index={index}
                      onCheckin={handleCheckin}
                      onComplete={(g) => completeMutation.mutate(g)}
                      onDelete={() => handleDeleteGoal(goal)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cheers received from circle members */}
        <CheerInbox user={user} />

        {/* Stats - filmstrip style */}
        <div className="grid grid-cols-3 mb-8" style={{ gap: 8 }}>
          {[
            { label: 'Active', value: activeGoals.length },
            { label: 'Completed', value: completedCount },
            { label: 'Entries', value: totalCheckins },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              style={{
                borderRadius: 12,
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.07)',
                padding: '14px 10px',
                textAlign: 'center',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.45 }}
            >
              <p style={{
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 34, color: '#0d1117', lineHeight: 1, letterSpacing: '0.03em',
              }}>
                {String(stat.value).padStart(2, '0')}
              </p>
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.28em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginTop: 5,
              }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ─────── SECTION DIVIDER: FOCUS AREA ─────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 mt-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
              textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
            }}>
              What You're Focused On
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
          </div>
        </motion.div>

        {/* Calendar Widget */}
         {/* Import from PageShell context */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.38 }}
           className="mb-8"
         >
           <div className="flex items-center gap-3 mb-4">
             <span style={{
               fontFamily: 'Space Grotesk, sans-serif',
               fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
               textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
             }}>
               Planning & Tracking
             </span>
             <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
           </div>
           <CalendarWidget
             tasks={tasks}
             goals={goals}
             milestones={milestones}
             selectedDate={selectedDate}
             onDateSelect={setSelectedDate}
             onNewTask={() => {
               // Trigger the FAB from NavActionContext
               const handler = queryClient.getQueryData(['navActionHandler']);
               if (handler) handler('task');
             }}
           />
         </motion.div>

         {/* Engagement Section */}
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.42 }}
           className="mb-8"
         >
           <div className="flex items-center gap-3 mb-4">
             <span style={{
               fontFamily: 'Space Grotesk, sans-serif',
               fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
               textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
             }}>
               Community Cheers
             </span>
             <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
           </div>
           <CheerInbox user={user} />
         </motion.div>

        {/* Milestones grid */}
        {false && milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <span style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
                textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)',
              }}>
                Achievements & Moments
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {milestones.slice(0, 6).map(m => (
                <div key={m.id} className="rounded-xl overflow-hidden border border-foreground/10">
                  {m.asset_url && (
                    <img src={m.asset_url} alt="" className="w-full aspect-square object-cover" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Goals */}
        {false && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
        >
          {/* Section label */}
          <div className="flex items-center gap-3 mb-4">
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
            }}>
              Chapter I - In Progress
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 16,
              color: '#1a3aad', letterSpacing: '0.05em',
            }}>
              {String(activeGoals.length).padStart(2, '0')}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} style={{
                  height: 96, borderRadius: 16,
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
              ))}
            </div>
          ) : activeGoals.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              borderTop: '1px solid rgba(0,0,0,0.08)',
              borderBottom: '1px solid rgba(0,0,0,0.08)',
            }}>
              {/* iMessage style empty state */}
              <div className="inline-block chat-bubble-in mb-3" style={{ fontSize: 13 }}>
                An empty page awaits.
              </div>
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 11, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.2em',
              }}>
                Begin your first entry.
              </p>
            </div>
          ) : (
            <>
              {activeGoals.map((goal, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={i}
                  onCheckin={handleCheckin}
                  onComplete={(g) => completeMutation.mutate(g)}
                  onDelete={() => handleDeleteGoal(goal)}
                />
              ))}
              {!canAddGoal && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)',
                  borderRadius: 12, textAlign: 'center',
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 11,
                  color: 'rgba(0,0,0,0.6)',
                }}>
                  Max 3 active goals. Complete or delete one to add more.
                </div>
              )}
            </>
          )}
        </motion.div>
        )}
      </div>

      </PageShell>

      <LevelUpModal
        isOpen={!!levelUpRank}
        rank={levelUpRank}
        score={getRankScore(totalCheckins, milestoneCount)}
        onClose={() => setLevelUpRank(null)}
        onShare={handleShareLevelUp}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
      />
    </div>
  );
}
