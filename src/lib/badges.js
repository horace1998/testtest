// Achievement badges — derived from the user's goals + milestones.
// No DB writes; we compute earned state from existing data.
//
// Each badge has:
//   id, label, description, icon (lucide name string),
//   gradient (tailwind from-/to- classes), criteria (function).
//
// criteria({ goals, milestones, totalCheckins, completedGoals, longestStreak, missionsJoined }) -> boolean

import { Flame, Sparkles, Target, Trophy, Heart, Crown, Star, Zap, Award, Medal } from 'lucide-react';

// All badges share an editorial monochrome ink-on-cream style — no colors.
const INK = 'from-neutral-800 to-neutral-950';

export const BADGES = [
  { id: 'first_step', label: 'First Step', description: 'Created your first goal', icon: Sparkles, gradient: INK,
    criteria: ({ goals }) => goals.length >= 1 },
  { id: 'first_checkin', label: 'Day One', description: 'Completed your first check-in', icon: Flame, gradient: INK,
    criteria: ({ totalCheckins }) => totalCheckins >= 1 },
  { id: 'streak_7', label: '7-Day Spark', description: '7 total check-ins logged', icon: Zap, gradient: INK,
    criteria: ({ totalCheckins }) => totalCheckins >= 7 },
  { id: 'streak_30', label: '30-Day Devotion', description: '30 total check-ins logged', icon: Flame, gradient: INK,
    criteria: ({ totalCheckins }) => totalCheckins >= 30 },
  { id: 'streak_100', label: 'Centurion Stan', description: '100 total check-ins', icon: Crown, gradient: INK,
    criteria: ({ totalCheckins }) => totalCheckins >= 100 },
  { id: 'goal_complete', label: 'Goal Crusher', description: 'Completed your first goal', icon: Target, gradient: INK,
    criteria: ({ completedGoals }) => completedGoals >= 1 },
  { id: 'three_goals', label: 'Triple Threat', description: 'Completed 3 goals', icon: Trophy, gradient: INK,
    criteria: ({ completedGoals }) => completedGoals >= 3 },
  { id: 'milestone_5', label: 'Memory Keeper', description: '5 milestones captured', icon: Heart, gradient: INK,
    criteria: ({ milestones }) => milestones.length >= 5 },
  { id: 'mission_joiner', label: 'Squad Up', description: 'Joined a public mission', icon: Star, gradient: INK,
    criteria: ({ missionsJoined }) => missionsJoined >= 1 },
  { id: 'legend', label: 'Stan Legend', description: 'Reached the Legend rank', icon: Medal, gradient: INK,
    criteria: ({ totalCheckins, milestones }) => (totalCheckins + milestones.length * 5) >= 150 },
];

// Compute earned + locked split.
export function evaluateBadges(stats) {
  return BADGES.map(b => ({
    ...b,
    earned: !!b.criteria(stats),
  }));
}

export function buildStats({ goals = [], milestones = [], missions = [], userEmail }) {
  const totalCheckins = goals.reduce(
    (sum, g) => sum + (g.daily_checkins?.filter(c => c.completed).length || 0),
    0
  );
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const missionsJoined = missions.filter(m =>
    (m.members || []).some(mem => mem.user_email === userEmail)
  ).length;
  return { goals, milestones, totalCheckins, completedGoals, missionsJoined };
}