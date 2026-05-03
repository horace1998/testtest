import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { formatDistanceToNow } from 'date-fns';
import { Newspaper } from 'lucide-react';

/**
 * Shows public FeedPosts from circle members (creator + joined members)
 * created within the last 7 days, in chronological order (newest first).
 *
 * NOTE: Posts created in this circle (post_type === 'circle_story') are
 * excluded here because they're already shown by CircleStoriesFeed above.
 */
export default function CircleMembersFeed({ members = [], limit, compact = false }) {
  const memberEmails = members.map(m => m.user_email).filter(Boolean);

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['circle-members-feed', memberEmails.sort().join(',')],
    queryFn: async () => {
      if (memberEmails.length === 0) return [];
      // Fetch each member's recent public posts, then merge & sort.
      const lists = await Promise.all(
        memberEmails.map(email =>
          synkify.entities.FeedPost.filter(
            { user_email: email },
            '-created_date',
            20
          ).catch(() => [])
        )
      );
      return lists.flat();
    },
    enabled: memberEmails.length > 0,
  });

  // Filter to last 7 days, exclude circle stories & blocked, sort newest first
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const posts = allPosts
    .filter(p => p.post_type !== 'circle_story')
    .filter(p => p.moderation_status !== 'blocked')
    .filter(p => new Date(p.created_date).getTime() >= sevenDaysAgo)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, limit || undefined);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'rgba(0,0,0,0.04)' }} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div
        className="text-center py-8 rounded-2xl"
        style={{ border: '1px dashed rgba(0,0,0,0.12)' }}
      >
        <Newspaper className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(0,0,0,0.3)' }} />
        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 13, color: 'rgba(0,0,0,0.5)',
        }}>No recent posts from members in the last 7 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p, i) => {
        const initial = (p.user_name || p.user_email || '?').charAt(0).toUpperCase();
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`${compact ? 'p-3' : 'p-4'} rounded-2xl`}
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #4d7fff, #1a3aad)',
                  color: '#fff',
                  fontFamily: 'Bebas Neue, Impact, sans-serif',
                  fontSize: 12, letterSpacing: '0.04em',
                }}
              >{initial}</div>
              <div className="flex-1 min-w-0">
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 12,
                  fontWeight: 600, color: '#0d1117',
                }}>{p.user_name || p.user_email?.split('@')[0]}</p>
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                  fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'rgba(0,0,0,0.35)',
                }}>{formatDistanceToNow(new Date(p.created_date), { addSuffix: true })} · public</p>
              </div>
            </div>

            {p.goal_title && (
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#1a3aad', marginBottom: 6,
              }}>{p.goal_title}</p>
            )}

            {p.caption && (
              <p style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: compact ? 12 : 14,
                color: '#0d1117', lineHeight: 1.5,
              }} className="whitespace-pre-wrap">{p.caption}</p>
            )}

            {p.asset_url && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <img src={p.asset_url} alt="" className="w-full max-h-80 object-cover" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
