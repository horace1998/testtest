import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import StoryReplies from '@/components/circle/StoryReplies';

export default function CircleStoriesFeed({ circleId, currentUser }) {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['circle-stories', circleId],
    queryFn: () => synkify.entities.FeedPost.filter(
      { support_circle_id: circleId, post_type: 'circle_story' },
      '-updated_date',
      50
    ),
    enabled: !!circleId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'rgba(0,0,0,0.04)' }} />
        ))}
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div
        className="text-center py-10 rounded-2xl"
        style={{ border: '1px dashed rgba(0,0,0,0.12)' }}
      >
        <MessageCircle className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(0,0,0,0.3)' }} />
        <p style={{
          fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
          fontSize: 14, color: 'rgba(0,0,0,0.5)',
          }}>No stories yet. Be the first to open up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stories.map((s, i) => {
        const initial = (s.user_name || s.user_email || '?').charAt(0).toUpperCase();
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a3aad, #4d7fff)',
                  color: '#fff',
                  fontFamily: 'Bebas Neue, Impact, sans-serif',
                  fontSize: 12, letterSpacing: '0.04em',
                }}
              >{initial}</div>
              <div className="flex-1 min-w-0">
                <p style={{
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 12,
                  fontWeight: 600, color: '#0d1117',
                }}>{s.user_name || s.user_email?.split('@')[0]}</p>
                <p style={{
                   fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                   fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
                   color: 'rgba(0,0,0,0.35)',
                 }}>{formatDistanceToNow(new Date(s.updated_date || s.created_date), { addSuffix: true })}</p>
              </div>
            </div>

            {s.caption && (
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 14,
                color: '#0d1117', lineHeight: 1.5,
              }} className="whitespace-pre-wrap">{s.caption}</p>
            )}

            {s.asset_url && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <img src={s.asset_url} alt="" className="w-full max-h-80 object-cover" />
              </div>
            )}

            {currentUser && <StoryReplies storyId={s.id} currentUser={currentUser} />}
          </motion.div>
        );
      })}
    </div>
  );
}
