export const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const missionMembers = (mission) => (Array.isArray(mission?.members) ? mission.members : []);

export const isMissionMember = (mission, email) => {
  const userEmail = normalizeEmail(email);
  if (!userEmail) return false;

  return missionMembers(mission).some((member) => normalizeEmail(member.user_email) === userEmail);
};

export const hasActiveMissionGoal = (goals = [], missionId) =>
  goals.some((goal) => goal.mission_id === missionId && goal.status === 'active');

export const activeMissionGoals = (goals = []) =>
  goals.filter((goal) => goal.status === 'active' && goal.mission_id);

export const shouldShowMissionAsMine = (mission, goals = [], email) =>
  isMissionMember(mission, email) && hasActiveMissionGoal(goals, mission?.id);
