import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Trophy, Heart, Flame, Sparkles, Crown, HandHeart, MessageCircle, Flag, Trash2, X } from 'lucide-react';
import CommentsThread from '@/components/feed/CommentsThread';
import ReportDialog from '@/components/feed/ReportDialog';
import { Link } from 'react-router-dom';

const REACTIONS = [
  { id: 'heart', label: 'Heart', icon: Heart },
  { id: 'fire', label: 'Fire', icon: Flame },
  { id: 'star', label: 'Star', icon: Sparkles },
  { id: 'crown', label: 'Crown', icon: Crown },
  { id: 'cheer', label: 'Cheer', icon: HandHeart },
];

const REACTION_MAP = REACTIONS.reduce((m, r) => { m[r.id] = r; return m; }, {});

export default function FeedPostCard({ post, userEmail, currentUser, index = 0 }) {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localCount, setLocalCount] = useState(post.comment_count || 0);

  const isOwner = userEmail && post.user_email === userEmail;

  const cheerCounts = (post.cheers || []).reduce((acc, c) => {
    acc[c.reaction] = (acc[c.reaction] || 0) + 1;
    return acc;
  }, {});

  const totalCheers = Object.values(cheerCounts).reduce((s, n) => s + n, 0);
  const userReaction = (post.cheers || []).find(c => c.user_email === userEmail)?.reaction;

  const handleReact = async (id) => {
    if (!userEmail) return;
    setShowPicker(false);
    setAnimatingReaction(id);
    setTimeout(() => setAnimatingReaction(null), 800);

    const existing = (post.cheers || []).filter(c => c.user_email !== userEmail);
    const newCheers = userReaction === id
      ? existing
      : [...existing, { user_email: userEmail, reaction: id }];
    await synkify.entities.FeedPost.update(post.id, { cheers: newCheers });
    if (userReaction !== id && post.user_email && post.user_email !== userEmail) {
      await synkify.entities.Notification.create({
        user_email: post.user_email,
        idol_name: post.idol_name || 'Synkify',
        message: `${currentUser?.full_name || userEmail.split('@')[0]} cheered your post.`,
        is_read: false,
        sent_date: new Date().toISOString(),
        type: 'cheer',
        post_id: post.id,
      }).catch(() => null);
    }
    queryClient.invalidateQueries({ queryKey: ['feedposts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await synkify.entities.FeedPost.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ['feedposts'] });
  };

  const date = post.created_date ? format(new Date(post.created_date), 'MMM d') : '';

  return (
    <>
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: index * 0.06 }}
      >
        {/* Card - full-bleed image with overlay UI, magazine style */}
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">

          {/* Full image */}
          {post.asset_url ? (
            <div className="relative">
              <img src={post.asset_url} alt={post.goal_title} className="w-full aspect-[4/5] object-cover" />

              {/* Reaction burst */}
              <AnimatePresence>
                {animatingReaction && REACTION_MAP[animatingReaction] && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                  >
                    {(() => {
                      const Icon = REACTION_MAP[animatingReaction].icon;
                      return <Icon className="w-20 h-20 text-white drop-shadow-2xl" />;
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top overlay: user info + actions */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
                <Link to={post.user_email ? `/u/${encodeURIComponent(post.user_email)}` : '#'} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-heading font-bold text-white leading-none">
                      {post.user_name || post.user_email?.split('@')[0]}
                    </p>
                    {post.fan_rank && (
                      <p className="text-[9px] text-white/60 uppercase tracking-wider">{post.fan_rank}</p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50">{date}</span>
                  {isOwner ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="bg-black/40 backdrop-blur-sm rounded-full p-1.5"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-3 h-3 text-white/80" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setReportOpen(true)}
                      className="bg-black/40 backdrop-blur-sm rounded-full p-1.5"
                      aria-label="Report"
                    >
                      <Flag className="w-3 h-3 text-white/80" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom overlay: idol label + goal */}
              <div className="absolute bottom-0 left-0 right-0 p-3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-heading mb-0.5">
                  {post.idol_group || 'Fan'}{post.idol_name ? ` - ${post.idol_name}` : ''}
                </p>
                <p className="text-sm font-heading font-bold text-white leading-tight">{post.goal_title}</p>
                {post.caption && (
                  <p className="text-xs text-white/70 italic mt-0.5">"{post.caption}"</p>
                )}
              </div>
            </div>
          ) : (
            /* Text-only post */
            <div className="p-4 bg-foreground/5 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-heading mb-1">
                    {post.idol_group || 'Fan'}{post.idol_name ? ` - ${post.idol_name}` : ''}
                  </p>
                  <p className="font-heading font-bold text-base text-foreground">{post.goal_title}</p>
                  {post.caption && <p className="text-xs text-muted-foreground italic mt-1">"{post.caption}"</p>}
                </div>
                {isOwner && (
                  <button onClick={() => setConfirmDelete(true)} className="ml-2 p-1.5 rounded-full border border-foreground/15" aria-label="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Interaction bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-foreground/8">
            {/* Cheer button */}
            <div className="relative">
              <motion.button
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-heading font-semibold transition-all ${
                  userReaction ? 'bg-foreground text-background' : 'border border-foreground/15 text-foreground'
                }`}
                whileTap={{ scale: 0.88 }}
                onClick={() => setShowPicker(p => !p)}
              >
                <Heart className={`w-3 h-3 ${userReaction ? 'fill-current' : ''}`} />
                <span>{totalCheers > 0 ? totalCheers : 'Cheer'}</span>
              </motion.button>

              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    className="absolute bottom-10 left-0 bg-background border border-foreground/15 rounded-2xl p-2 flex gap-1.5 z-20 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  >
                    {REACTIONS.map(r => {
                      const Icon = r.icon;
                      return (
                        <motion.button
                          key={r.id}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                            userReaction === r.id ? 'bg-foreground border-foreground' : 'border-foreground/10 hover:bg-foreground/5'
                          }`}
                          onClick={() => handleReact(r.id)}
                          whileTap={{ scale: 0.85 }}
                          aria-label={r.id}
                        >
                          <Icon className={`w-4 h-4 ${userReaction === r.id ? 'text-background' : 'text-foreground'}`} />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comments */}
            <motion.button
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-heading border border-foreground/15 text-foreground"
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowComments(s => !s)}
            >
              <MessageCircle className="w-3 h-3" />
              <span>{localCount || 0}</span>
            </motion.button>

            {/* Reaction breakdown */}
            {Object.entries(cheerCounts).length > 0 && (
              <div className="flex gap-1 ml-auto">
                {Object.entries(cheerCounts).map(([id, count]) => {
                  const r = REACTION_MAP[id];
                  if (!r) return null;
                  const Icon = r.icon;
                  return (
                    <motion.button
                      key={id}
                      className={`rounded-full px-2 py-1 flex items-center gap-1 text-[10px] font-heading border transition-all ${
                        userReaction === id ? 'bg-foreground text-background border-foreground' : 'border-foreground/10 text-muted-foreground'
                      }`}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleReact(id)}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{count}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comments thread */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-foreground/8"
              >
                <CommentsThread
                  postId={post.id}
                  currentUser={currentUser}
                  onCountChange={setLocalCount}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none" />
            <motion.div
              className="relative w-full max-w-sm bg-background border border-foreground/15 rounded-3xl p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-heading font-bold text-base">Delete post?</p>
                <button onClick={() => setConfirmDelete(false)} className="border border-foreground/15 rounded-full p-1.5">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-5">This will permanently remove this post from the fan feed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-foreground/15 rounded-2xl py-2.5 text-sm font-heading">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-foreground text-background rounded-2xl py-2.5 text-sm font-heading font-bold">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportDialog
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="feedpost"
        targetId={post.id}
        snapshot={`${post.goal_title} - ${post.caption || ''}`}
      />
    </>
  );
}
