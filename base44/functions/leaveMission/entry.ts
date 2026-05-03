import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mission_id, goal_id } = await req.json();
    if (!mission_id) return Response.json({ error: 'mission_id required' }, { status: 400 });

    const mission = await base44.asServiceRole.entities.Mission.get(mission_id);
    if (!mission) return Response.json({ error: 'Mission not found' }, { status: 404 });

    const members = mission.members || [];
    const currentParticipantCount = members.length;
    const newMembers = members.filter(m => m.user_email !== user.email);
    const remainingParticipantCount = newMembers.length;
    const userWasParticipant = remainingParticipantCount < currentParticipantCount;
    const shouldDeleteMission =
      remainingParticipantCount === 0 || (currentParticipantCount <= 1 && userWasParticipant);

    if (shouldDeleteMission) {
      await base44.asServiceRole.entities.Mission.delete(mission.id);
    } else {
      await base44.asServiceRole.entities.Mission.update(mission.id, {
        members: newMembers,
        member_count: remainingParticipantCount,
      });
    }

    // Mark the user's linked goal as abandoned (if provided)
    if (goal_id) {
      try {
        await base44.entities.Goal.update(goal_id, { status: 'abandoned' });
      } catch (e) {
        // ignore
      }
    }

    return Response.json({
      success: true,
      deleted: shouldDeleteMission,
      previous_member_count: currentParticipantCount,
      member_count: shouldDeleteMission ? 0 : remainingParticipantCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
