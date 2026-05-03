import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { Users, Sparkles, Calendar, Loader2, Check, Flag, ArrowRight } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import ReportDialog from '@/components/feed/ReportDialog';
import { activeMissionGoals, hasActiveMissionGoal, isMissionMember } from '@/lib/missionMembership';



export default function MissionCard({ mission, currentUser, userGoals = [], index = 0 }) {
  const queryClient = useQueryClient();
  const [joining, setJoining] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const hasActiveLinkedGoal = hasActiveMissionGoal(userGoals, mission.id);
  const isMember = isMissionMember(mission, currentUser?.email);

  // Stale: in members list but no active goal; auto-cleanup so user can rejoin.
  useEffect(() => {
    if (!currentUser) return;
    if (isMember && !hasActiveLinkedGoal) {
      synkify.functions.invoke('leaveMission', { mission_id: mission.id })
        .then(() => queryClient.invalidateQueries({ queryKey: ['missions'] }))
        .then(() => queryClient.invalidateQueries({ queryKey: ['goals'] }))
        .catch(() => {});
    }
  }, [currentUser?.email, mission.id, isMember, hasActiveLinkedGoal, queryClient]);

  // Personal goals should not block joining a circle mission.
  const activeMissionGoalCount = activeMissionGoals(userGoals).length;
  const canJoin = activeMissionGoalCount < 3;

  const handleJoin = async () => {
    if (!currentUser || isMember) return;
    if (!canJoin) {
      toast.error('Max 3 active missions. Complete or leave one to join another.');
      return;
    }
    setJoining(true);
    try {
      const res = await synkify.functions.invoke('joinMission', { mission_id: mission.id });
      if (res?.data?.success) {
        toast.success(`Joined! "${mission.title}" added to your goals`);
        queryClient.invalidateQueries({ queryKey: ['missions'] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
      } else {
        toast.error(res?.data?.error || 'Could not join');
      }
    } catch (e) {
      toast.error('Could not join mission');
    }
    setJoining(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.05 }}
      >
        <GlassCard variant="strong" className="p-5 mb-3" animate={false}>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl border border-foreground/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-base font-bold leading-snug">{mission.title}</p>
              <p className="text-[10px] text-muted-foreground font-heading uppercase tracking-wider mt-0.5">
                by {mission.creator_name || mission.creator_email?.split('@')[0]}
                {mission.idol_group ? ` · ${mission.idol_group}` : ''}
              </p>
            </div>
            <button
              onClick={() => setReportOpen(true)}
              className="glass-subtle rounded-full p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Report"
            >
              <Flag className="w-3 h-3" />
            </button>
          </div>

          {mission.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mission.description}</p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-heading mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {mission.timeline_value} {mission.timeline_unit}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {mission.member_count || 1} {mission.member_count === 1 ? 'fan' : 'fans'}
            </span>
          </div>

          {isMember ? (
            <div className="flex gap-2">
              <div className="flex-1 border border-foreground/15 rounded-xl py-2 text-center text-[11px] font-heading text-foreground flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Joined
              </div>
              <Link
                to={`/circle/${mission.id}`}
                className="flex items-center justify-center gap-1 px-3 rounded-xl"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                  color: '#fff',
                }}
              >
                Circle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
           <GlassButton 
             variant="primary" 
             onClick={handleJoin} 
             disabled={joining || !canJoin} 
             className="w-full py-2 text-xs"
             title={!canJoin ? 'Max 3 active missions. Complete or leave one to join another.' : ''}
           >
             {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : !canJoin ? 'Max 3 missions' : 'Join Mission'}
           </GlassButton>
          )}
        </GlassCard>
      </motion.div>

      <ReportDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="mission"
        targetId={mission.id}
        snapshot={`${mission.title} - ${mission.description || ''}`}
      />
    </>
  );
}

