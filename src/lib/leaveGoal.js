import { synkify } from '@/api/synkifyClient';

/**
 * Leave a goal. If the goal is linked to a mission, remove the user from the
 * mission members; the mission function deletes the mission when empty.
 */
export async function leaveGoal(goal) {
  if (!goal) return;
  if (goal.mission_id) {
    await synkify.functions.invoke('leaveMission', {
      mission_id: goal.mission_id,
      goal_id: goal.id,
    });
    return;
  }
  await synkify.entities.Goal.update(goal.id, { status: 'abandoned' });
}
