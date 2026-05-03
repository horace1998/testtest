import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CheerInbox({ user }) {
  const queryClient = useQueryClient();

  const { data: cheers = [] } = useQuery({
    queryKey: ['cheers-received', user?.email],
    queryFn: () => synkify.entities.Cheer.filter(
      { receiver_email: user.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
  });

  // Mark all as read when inbox is rendered
  useEffect(() => {
    const unread = cheers.filter(c => !c.is_read);
    if (unread.length === 0) return;
    Promise.all(unread.map(c => synkify.entities.Cheer.update(c.id, { is_read: true })))
      .then(() => queryClient.invalidateQueries({ queryKey: ['cheers-received', user?.email] }));
  }, [cheers, queryClient, user?.email]);

  if (!cheers.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <p style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
        fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.4)', marginBottom: 10,
      }} className="flex items-center gap-2">
        <Heart className="w-3 h-3 text-[#1a3aad]" /> Cheers received · {cheers.length}
      </p>

      <div className="space-y-2">
        {cheers.slice(0, 5).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-3 rounded-2xl"
            style={{
              background: c.is_read ? 'rgba(255,255,255,0.85)' : 'linear-gradient(135deg, rgba(26,58,173,0.08), rgba(77,127,255,0.05))',
              border: c.is_read ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(26,58,173,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <p style={{
                fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#1a3aad',
              }}>
                from {c.sender_name || c.sender_email?.split('@')[0]}
              </p>
              <p style={{
                 fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
                 color: 'rgba(0,0,0,0.4)', letterSpacing: '0.15em',
               }}>{formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}</p>
            </div>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 15, color: '#0d1117', lineHeight: 1.4,
            }}>"{c.message}"</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}