import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import CheerModal from './CheerModal';

export default function CircleMembersList({ members = [], currentUser, circleId }) {
  const [target, setTarget] = useState(null);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              color: 'rgba(0,0,0,0.4)',
            }}
          >
            Circle
          </p>
          <p className="text-[10px] font-heading font-bold uppercase tracking-[0.22em] text-foreground/35">
            {members.length} {members.length === 1 ? 'fan' : 'fans'}
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {members.map((member, index) => {
            const isMe = member.user_email === currentUser?.email;
            const initial = (member.user_name || member.user_email || '?').charAt(0).toUpperCase();
            return (
              <motion.div
                key={member.user_email || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="w-28 flex-shrink-0 rounded-2xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #1a3aad, #4d7fff)',
                    color: '#fff',
                    fontFamily: 'Bebas Neue, Impact, sans-serif',
                    fontSize: 18,
                    letterSpacing: '0.04em',
                  }}
                >
                  {initial}
                </div>
                <p
                  className="truncate"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#0d1117',
                  }}
                >
                  {member.user_name || member.user_email?.split('@')[0]}
                </p>
                <p className="mt-1 text-[8px] font-heading font-bold uppercase tracking-[0.18em] text-foreground/35">
                  {isMe ? 'You' : 'Member'}
                </p>
                {!isMe && (
                  <button
                    onClick={() => setTarget(member)}
                    className="mt-2 inline-flex items-center gap-1 text-[8px] font-heading font-bold uppercase tracking-[0.16em] text-primary"
                  >
                    <Heart className="h-3 w-3" /> Cheer
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <CheerModal
        isOpen={!!target}
        onClose={() => setTarget(null)}
        recipient={target}
        circleId={circleId}
        sender={currentUser}
      />
    </>
  );
}
