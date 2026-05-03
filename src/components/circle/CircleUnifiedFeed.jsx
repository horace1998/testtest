import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Newspaper } from 'lucide-react';
import StoryReplies from '@/components/circle/StoryReplies';

export default function CircleUnifiedFeed({ circleId, currentUser }) {
  const queryClient = useQueryClient();
  const [replySignals, setReplySignals] = useState({});

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['circle-unified-feed', circleId],
    queryFn: async () => {
      const circlePosts = circleId
        ? await synkify.entities.FeedPost.filter(
            { support_circle_id: circleId },
            '-updated_date',
            50
          ).catch(() => [])
        : [];

      return circlePosts
        .filter((post) => post.moderation_status !== 'blocked')
        .filter((post) => post.support_circle_id === circleId)
        .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
    },
    enabled: !!circleId,
  });

  const handleLike = async (post) => {
    if (!currentUser?.email) return;
    const cheers = post.cheers || [];
    const existing = cheers.some((cheer) => cheer.user_email === currentUser.email && cheer.reaction === 'heart');
    const nextCheers = existing
      ? cheers.filter((cheer) => !(cheer.user_email === currentUser.email && cheer.reaction === 'heart'))
      : [
          ...cheers.filter((cheer) => cheer.user_email !== currentUser.email),
          { user_email: currentUser.email, reaction: 'heart' },
        ];
    await synkify.entities.FeedPost.update(post.id, { cheers: nextCheers });
    if (!existing && post.user_email && post.user_email !== currentUser.email) {
      await synkify.entities.Notification.create({
        user_email: post.user_email,
        idol_name: post.idol_name || 'Synkify',
        message: `${currentUser.full_name || currentUser.email.split('@')[0]} liked your post.`,
        is_read: false,
        sent_date: new Date().toISOString(),
        type: 'like',
        post_id: post.id,
      }).catch(() => null);
    }
    queryClient.invalidateQueries({ queryKey: ['circle-unified-feed'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const openReply = (postId) => {
    setReplySignals((current) => ({ ...current, [postId]: (current[postId] || 0) + 1 }));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-2xl" style={{ background: 'rgba(0,0,0,0.04)' }} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-2xl py-10 text-center" style={{ border: '1px dashed rgba(0,0,0,0.12)' }}>
        <Newspaper className="mx-auto mb-2 h-7 w-7" style={{ color: 'rgba(0,0,0,0.3)' }} />
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(0,0,0,0.5)' }}>
          No circle activity yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post, index) => {
        const initial = (post.user_name || post.user_email || '?').charAt(0).toUpperCase();
        const likes = (post.cheers || []).filter((cheer) => cheer.reaction === 'heart').length;
        const liked = (post.cheers || []).some((cheer) => cheer.user_email === currentUser?.email && cheer.reaction === 'heart');
        const isVideo = post.asset_type === 'video';
        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #1a3aad, #4d7fff)',
                  color: '#fff',
                  fontFamily: 'Bebas Neue, Impact, sans-serif',
                  fontSize: 12,
                  letterSpacing: '0.04em',
                }}
              >
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, fontWeight: 600, color: '#0d1117' }}>
                  {post.user_name || post.user_email?.split('@')[0]}
                </p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)' }}>
                  {formatDistanceToNow(new Date(post.updated_date || post.created_date), { addSuffix: true })} / circle
                </p>
              </div>
            </div>

            {post.goal_title && (
              <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1a3aad', marginBottom: 6 }}>
                {post.goal_title}
              </p>
            )}

            {post.caption && (
              <p className="whitespace-pre-wrap" style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, color: '#0d1117', lineHeight: 1.5 }}>
                {post.caption}
              </p>
            )}

            {post.asset_url && (
              <div className="mt-2 overflow-hidden rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                {isVideo ? (
                  <video src={post.asset_url} controls className="max-h-80 w-full bg-black object-contain" />
                ) : (
                  <img src={post.asset_url} alt="" className="max-h-80 w-full object-cover" />
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 border-t border-foreground/10 pt-3">
              <button
                onClick={() => handleLike(post)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10"
                style={{ color: liked ? '#1a3aad' : 'rgba(0,0,0,0.55)' }}
                aria-label={liked ? 'Unlike post' : 'Like post'}
                title={liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              {likes > 0 && (
                <span className="text-xs font-heading font-bold" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  {likes}
                </span>
              )}
              <button
                onClick={() => openReply(post.id)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10"
                style={{ color: 'rgba(0,0,0,0.55)' }}
                aria-label="Reply"
                title="Reply"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>

            {currentUser && (
              <StoryReplies
                storyId={post.id}
                currentUser={currentUser}
                openSignal={replySignals[post.id] || 0}
                hideToggle
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
