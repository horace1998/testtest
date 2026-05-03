// Fan Rank system based on total check-ins + milestones
export const FAN_RANKS = [
  {
    id: 'trainee',
    label: 'Trainee',
    minScore: 0,
    color: 'from-slate-300 to-slate-400',
    textColor: 'text-slate-500',
    bgColor: 'bg-slate-100',
    description: 'Just starting your journey',
  },
  {
    id: 'debut',
    label: 'Debut',
    minScore: 10,
    color: 'from-sky-200 to-indigo-300',
    textColor: 'text-indigo-400',
    bgColor: 'bg-sky-50',
    description: 'Finding your rhythm',
  },
  {
    id: 'rising',
    label: 'Rising',
    minScore: 30,
    color: 'from-violet-300 to-indigo-400',
    textColor: 'text-violet-500',
    bgColor: 'bg-violet-50',
    description: 'On the rise',
  },
  {
    id: 'idol',
    label: 'Idol',
    minScore: 75,
    color: 'from-violet-400 to-pink-300',
    textColor: 'text-violet-500',
    bgColor: 'bg-violet-50',
    description: 'True dedication',
  },
  {
    id: 'legend',
    label: 'Legend',
    minScore: 150,
    color: 'from-pink-300 to-violet-400',
    textColor: 'text-pink-500',
    bgColor: 'bg-pink-50',
    description: 'Unstoppable force',
  },
];

export function getRankScore(totalCheckins, milestoneCount) {
  return totalCheckins + milestoneCount * 5;
}

export function getFanRank(totalCheckins, milestoneCount) {
  const score = getRankScore(totalCheckins, milestoneCount);
  let rank = FAN_RANKS[0];
  for (const r of FAN_RANKS) {
    if (score >= r.minScore) rank = r;
  }
  return rank;
}

export function getNextRank(totalCheckins, milestoneCount) {
  const score = getRankScore(totalCheckins, milestoneCount);
  const idx = FAN_RANKS.findIndex(r => score < r.minScore);
  return idx !== -1 ? { rank: FAN_RANKS[idx], pointsNeeded: FAN_RANKS[idx].minScore - score } : null;
}