import { synkify } from '@/api/synkifyClient';

export const assetTypeFromFile = (file) => (
  file?.type?.startsWith('video/') ? 'video' : 'photo'
);

export const createCircleMilestonePost = async ({
  user,
  goal,
  assetUrl,
  assetType = 'photo',
  caption = '',
}) => {
  if (!user?.email || !goal?.mission_id || !assetUrl) return null;

  return synkify.entities.FeedPost.create({
    user_email: user.email,
    user_name: user.full_name || user.email.split('@')[0],
    idol_name: goal.idol_name || '',
    idol_group: goal.idol_group || '',
    goal_title: goal.title || '',
    asset_url: assetUrl,
    asset_type: assetType,
    caption,
    support_circle_id: goal.mission_id,
    post_type: 'circle_story',
    moderation_status: 'approved',
    cheers: [],
  });
};
