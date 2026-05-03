import { synkify } from '@/api/synkifyClient';
import { hasActiveMissionGoal, isMissionMember } from '@/lib/missionMembership';

export async function repairMissionStateForUser(user, goals = []) {
  if (!user?.email) {
    return { abandonedGoals: 0, leftMissions: 0 };
  }

  const activeMissionGoals = goals.filter((goal) => goal.status === 'active' && goal.mission_id);
  const missionIds = [...new Set(activeMissionGoals.map((goal) => goal.mission_id).filter(Boolean))];
  const linkedMissions = await Promise.all(
    missionIds.map((id) => synkify.entities.Mission.get(id).catch(() => null))
  );
  const missionById = new Map(linkedMissions.filter(Boolean).map((mission) => [mission.id, mission]));

  let abandonedGoals = 0;
  await Promise.all(
    activeMissionGoals.map(async (goal) => {
      const mission = missionById.get(goal.mission_id);
      if (mission && isMissionMember(mission, user.email)) return;
      await synkify.entities.Goal.update(goal.id, { status: 'abandoned' });
      abandonedGoals += 1;
    })
  );

  const activeMissions = await synkify.entities.Mission.filter(
    { status: 'active', moderation_status: 'approved' },
    '-created_date',
    100
  );

  let leftMissions = 0;
  await Promise.all(
    activeMissions.map(async (mission) => {
      if (!isMissionMember(mission, user.email)) return;
      if (hasActiveMissionGoal(activeMissionGoals, mission.id)) return;
      await synkify.functions.invoke('leaveMission', { mission_id: mission.id });
      leftMissions += 1;
    })
  );

  return { abandonedGoals, leftMissions };
}
