/**
 * PageShell - wraps a page with FAB modals (NewGoal, Camera, Task).
 * The BottomNav itself is rendered ONCE at the App root (App.jsx) so it
 * doesn't unmount/remount on route changes. PageShell registers a handler
 * with NavActionContext so the global FAB knows which modals to open
 * for the current page (with the right `goals` / `user` context).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewGoalModal from '@/components/dashboard/NewGoalModal';
import TaskModal from '@/components/TaskModal';
import MilestoneNativeCapture from '@/components/MilestoneNativeCapture';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';
import { useNavAction } from '@/lib/NavActionContext';
import { moderate } from '@/lib/moderation';
import { createCircleMilestonePost } from '@/lib/circleFeed';
import { toast } from 'sonner';

export default function PageShell({ children, goals = [], user }) {
  const [showGoal, setShowGoal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { registerHandler } = useNavAction();

  useEffect(() => {
    registerHandler((id) => {
      if (id === 'goal') setShowGoal(true);
      else if (id === 'milestone') setShowCamera(true);
      else if (id === 'task') setShowTask(true);
    });
  }, [registerHandler]);

  const handleCameraClose = async (fileUrl, goal, assetType = 'photo') => {
    setShowCamera(false);
    if (fileUrl && goal) {
      await synkify.entities.Milestone.create({
        goal_id: goal.id,
        goal_title: goal.title,
        idol_name: goal.idol_name,
        idol_group: goal.idol_group,
        asset_url: fileUrl,
        asset_type: assetType,
        caption: '',
      });
      await createCircleMilestonePost({
        user,
        goal,
        assetUrl: fileUrl,
        assetType,
      });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      queryClient.invalidateQueries({ queryKey: ['circle-unified-feed'] });
      navigate('/gallery');
    }
  };

  const handleSaveGoal = async (data) => {
    const { make_public, category, description, ...goalData } = data;

    // Moderate public mission text
    if (make_public) {
      const verdict = await moderate(`${goalData.title}\n${description || ''}`, 'mission');
      if (!verdict.ok) {
        toast.error(verdict.reason);
        return;
      }
    }

    let mission = null;
    if (make_public && user) {
      mission = await synkify.entities.Mission.create({
        title: goalData.title,
        description: description || '',
        creator_email: user.email,
        creator_name: user.full_name || user.email.split('@')[0],
        idol_group: goalData.idol_group,
        idol_name: goalData.idol_name,
        timeline_value: goalData.timeline_value,
        timeline_unit: goalData.timeline_unit,
        category: category || 'other',
        member_count: 1,
        members: [{
          user_email: user.email,
          user_name: user.full_name || user.email.split('@')[0],
          joined_date: new Date().toISOString(),
        }],
        status: 'active',
        moderation_status: 'approved',
      });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success('Mission published! Other fans can now join.');
    }

    await synkify.entities.Goal.create({
      ...goalData,
      mission_id: mission?.id || '',
      is_mission_creator: !!make_public,
    });

    queryClient.invalidateQueries({ queryKey: ['goals'] });
    setShowGoal(false);
  };

  return (
    <>
      {children}

      <NewGoalModal
        isOpen={showGoal}
        onClose={() => setShowGoal(false)}
        onSave={handleSaveGoal}
        defaultIdol={user ? { idol_name: user.favorite_idol, idol_group: user.favorite_group } : null}
        activeGoalCount={goals.filter(g => g.status === 'active').length}
      />

      <MilestoneNativeCapture
        isOpen={showCamera}
        onClose={handleCameraClose}
        goals={goals}
      />

      <TaskModal
        isOpen={showTask}
        onClose={() => setShowTask(false)}
        onSave={async (data) => {
          await synkify.entities.Task.create(data);
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          setShowTask(false);
        }}
        goals={goals}
      />
    </>
  );
}
