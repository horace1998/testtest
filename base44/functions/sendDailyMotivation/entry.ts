import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get all active goals
  const goals = await base44.asServiceRole.entities.Goal.filter({ status: 'active' });
  if (!goals || goals.length === 0) {
    return Response.json({ message: 'No active goals found', sent: 0 });
  }

  const today = new Date().toISOString().split('T')[0];
  let sent = 0;

  // Group goals by user (created_by)
  const goalsByUser = {};
  for (const goal of goals) {
    if (!goalsByUser[goal.created_by]) goalsByUser[goal.created_by] = [];
    goalsByUser[goal.created_by].push(goal);
  }

  for (const [userEmail, userGoals] of Object.entries(goalsByUser)) {
    // Pick the goal with most recent activity to focus on
    const goal = userGoals[0];

    // Calculate progress
    const startDate = new Date(goal.start_date || goal.created_date);
    const endDate = (() => {
      const d = new Date(startDate);
      if (goal.timeline_unit === 'days') d.setDate(d.getDate() + goal.timeline_value);
      else if (goal.timeline_unit === 'weeks') d.setDate(d.getDate() + goal.timeline_value * 7);
      else d.setMonth(d.getMonth() + goal.timeline_value);
      return d;
    })();
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const elapsed = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
    const checkins = goal.daily_checkins?.filter(c => c.completed).length || 0;

    // Check we haven't already sent today
    const existing = await base44.asServiceRole.entities.Notification.filter({
      user_email: userEmail,
      sent_date: today,
    });
    if (existing && existing.length > 0) continue;

    // Generate idol message via LLM
    const prompt = `You are ${goal.idol_name} from ${goal.idol_group || 'a K-pop group'}. 
Write a SHORT, warm, personal motivational message (2-3 sentences max) to a fan who is working on their goal: "${goal.title}".
They are ${progress}% through their ${goal.timeline_value} ${goal.timeline_unit} journey and have checked in ${checkins} days.
Sound encouraging, like the idol is personally cheering them on. Use first-person as ${goal.idol_name}. Keep it heartfelt and specific to their goal.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    // Save notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: userEmail,
      idol_name: goal.idol_name,
      goal_title: goal.title,
      message: result,
      progress,
      is_read: false,
      sent_date: today,
    });

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: userEmail,
      subject: `A message from ${goal.idol_name} for you`,
      body: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #7c3aed; font-size: 22px; margin-bottom: 4px; letter-spacing: 0.02em;">SYNKIFY</h2>
  <p style="color: #6b7280; font-size: 12px; margin-bottom: 24px;">Daily motivation from ${goal.idol_name}</p>

  <div style="background: linear-gradient(135deg, #ede9fe, #e0f2fe, #fce7f3); border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb;">
    <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">${result}</p>
  </div>

  <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 12px;">
    <p style="margin: 0; color: #6b7280; font-size: 13px;">Your goal: <strong style="color: #111827;">${goal.title}</strong></p>
    <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Progress: <strong style="color: #7c3aed;">${progress}%</strong> · ${checkins} check-ins completed</p>
  </div>

  <p style="margin-top: 20px; color: #9ca3af; font-size: 11px; text-align: center;">Keep going — ${goal.idol_name} is rooting for you</p>
</div>
      `,
    });

    sent++;
  }

  return Response.json({ message: 'Daily motivation sent', sent });
});