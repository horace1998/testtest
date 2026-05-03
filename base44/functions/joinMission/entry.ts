import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mission_id } = await req.json();
    if (!mission_id) return Response.json({ error: 'mission_id required' }, { status: 400 });

    const mission = await base44.asServiceRole.entities.Mission.get(mission_id);
    if (!mission) return Response.json({ error: 'Mission not found' }, { status: 404 });
    if (mission.status !== 'active' || mission.moderation_status !== 'approved') {
      return Response.json({ error: 'Mission not available' }, { status: 400 });
    }

    const members = mission.members || [];
    if (members.some(m => m.user_email === user.email)) {
      return Response.json({ error: 'Already joined' }, { status: 400 });
    }

    // Check 3-goal limit: count ALL active goals
    const userGoals = await base44.entities.Goal.list('-created_date', 100);
    const activeGoals = userGoals.filter(g => g.status === 'active');
    if (activeGoals.length >= 3) {
      return Response.json({ error: 'Max 3 active goals — complete one to join another' }, { status: 400 });
    }

    // Use the joiner's own focus if available, fallback to mission's
    const idolGroup = user.favorite_group || mission.idol_group || '';
    const idolName = user.favorite_idol || user.favorite_group || mission.idol_name || '';

    const goal = await base44.entities.Goal.create({
      title: mission.title,
      idol_name: idolName,
      idol_group: idolGroup,
      timeline_value: mission.timeline_value || 7,
      timeline_unit: mission.timeline_unit || 'days',
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      progress: 0,
      daily_checkins: [],
      mission_id: mission.id,
      is_mission_creator: false,
    });

    const newMembers = [...members, {
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      joined_date: new Date().toISOString(),
    }];

    await base44.asServiceRole.entities.Mission.update(mission.id, {
      members: newMembers,
      member_count: newMembers.length,
    });

    return Response.json({ success: true, goal_id: goal.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});