import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import FeedPostCard from '@/components/feed/FeedPostCard';
import PageShell from '@/components/PageShell';
import MilestoneUploadModal from '@/components/milestones/MilestoneUploadModal';
import { getFanRank, getRankScore } from '@/lib/fanRank';
import { Share2, Waves, X } from 'lucide-react';
import { moderate } from '@/lib/moderation';
import { toast } from 'sonner';

export default function Feed() {
  const queryClient = useQueryClient();
  const [showShare, setShowShare] = useState(false);
  const [filterIdol, setFilterIdol] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => synkify.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['feedposts'],
    queryFn: () => synkify.entities.FeedPost.list('-created_date', 50),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => synkify.entities.Milestone.list('-created_date'),
  });

  // Milestones this user has not yet shared
  const userMilestones = milestones.filter(m => m.created_by === user?.email);
  const sharedIds = new Set(posts.filter(p => p.user_email === user?.email).map(p => p.milestone_id));
  const unsaredMilestones = userMilestones.filter(m => !sharedIds.has(m.id));

  const handleShareMilestone = async (milestone) => {
    if (!user) return;

    // Moderate caption + goal text before publishing
    const text = `${milestone.goal_title} ${milestone.caption || ''}`.trim();
    const verdict = await moderate(text, 'post');
    if (!verdict.ok) {
      toast.error(verdict.reason);
      return;
    }

    const totalCheckins = goals.reduce((s, g) => s + (g.daily_checkins?.filter(c => c.completed).length || 0), 0);
    const rank = getFanRank(totalCheckins, userMilestones.length);
    await synkify.entities.FeedPost.create({
      milestone_id: milestone.id,
      user_email: user.email,
      user_name: user.full_name || user.email.split('@')[0],
      idol_name: milestone.idol_name,
      idol_group: milestone.idol_group || '',
      goal_title: milestone.goal_title,
      asset_url: milestone.asset_url || '',
      asset_type: milestone.asset_type || 'badge',
      caption: milestone.caption || '',
      fan_rank: rank.id,
      cheers: [],
    });
    queryClient.invalidateQueries({ queryKey: ['feedposts'] });
    setShowShare(false);
  };

  // Hide blocked / pending posts AND circle-only stories from public view (creator can still see their own)
  const visiblePosts = posts.filter(p =>
    p.moderation_status !== 'blocked' &&
    (p.moderation_status !== 'pending' || p.user_email === user?.email) &&
    p.post_type !== 'circle_story'
  );

  const groups = ['all', ...new Set(visiblePosts.map(p => p.idol_group).filter(Boolean))];
  const idols = ['all', ...new Set(visiblePosts.map(p => p.idol_name).filter(Boolean))];

  let filtered = visiblePosts;
  if (filterGroup !== 'all') filtered = filtered.filter(p => p.idol_group === filterGroup);
  if (filterIdol !== 'all') filtered = filtered.filter(p => p.idol_name === filterIdol);

  return (
    <div className="min-h-screen relative pb-28">
      <PageShell goals={goals} user={user}>
      <ThreeBackground />

      <div className="relative z-10 px-5 pt-[3.5rem]">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-start justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <div>
            <p className="editorial-eyebrow mb-1">Community</p>
            <h1 className="font-display text-4xl tracking-tight text-foreground" style={{ fontWeight: 800 }}>FEED</h1>
          </div>

          {unsaredMilestones.length > 0 && (
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 bg-foreground text-background rounded-full px-4 py-2 text-xs font-heading font-bold mb-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              Post
            </button>
          )}
        </motion.div>

        {/* Group filter pills */}
        {groups.length > 1 && (
          <div className="mb-2">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-1.5">Group</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {groups.map(g => (
                <button
                  key={g}
                  className={`rounded-full px-3 py-1.5 text-xs font-heading font-medium flex-shrink-0 transition-all ${
                    filterGroup === g
                      ? 'bg-foreground text-background'
                      : 'border border-foreground/15 text-muted-foreground'
                  }`}
                  onClick={() => setFilterGroup(g)}
                >
                  {g === 'all' ? 'All Groups' : g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Idol filter pills */}
        {idols.length > 1 && (
          <div className="mb-5">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-1.5">Bias</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {idols.map(idol => (
                <button
                  key={idol}
                  className={`rounded-full px-3 py-1.5 text-xs font-heading font-medium capitalize flex-shrink-0 transition-all ${
                    filterIdol === idol
                      ? 'bg-foreground text-background'
                      : 'border border-foreground/15 text-muted-foreground'
                  }`}
                  onClick={() => setFilterIdol(idol)}
                >
                  {idol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-foreground/10 overflow-hidden">
                <div className="aspect-[4/5] bg-foreground/5 animate-pulse" />
                <div className="p-3 h-12 bg-foreground/3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-foreground/15 rounded-2xl p-10 text-center">
            <Waves className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
            <p className="font-heading font-semibold mb-1">No posts yet</p>
            <p className="text-sm text-muted-foreground mb-5">Be the first to share a milestone!</p>
            {unsaredMilestones.length > 0 && (
              <button onClick={() => setShowShare(true)} className="bg-foreground text-background rounded-full px-6 py-2.5 text-sm font-heading font-bold mx-auto flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share Now
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((post, i) => (
              <FeedPostCard key={post.id} post={post} userEmail={user?.email} currentUser={user} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Share milestone picker */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-none" />
            <motion.div
              className="relative w-full max-w-lg mx-4"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <GlassCard variant="strong" className="p-6 rounded-3xl" animate={false}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-heading text-lg font-bold">Share to Fan Feed</p>
                  <button onClick={() => setShowShare(false)} className="border border-foreground/15 rounded-full p-1.5">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Choose a milestone to share publicly</p>
                <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                  {unsaredMilestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">All milestones already shared!</p>
                  ) : (
                    unsaredMilestones.map(m => (
                      <motion.button
                        key={m.id}
                        className="w-full border border-foreground/10 rounded-2xl p-3 flex items-center gap-3 text-left hover:border-foreground/30 transition-all"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleShareMilestone(m)}
                      >
                        {m.asset_url && (
                          <img src={m.asset_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-heading font-semibold truncate">{m.goal_title}</p>
                          <p className="text-xs text-muted-foreground">{m.idol_name}</p>
                          {m.caption && <p className="text-[10px] text-muted-foreground/60 italic truncate">"{m.caption}"</p>}
                        </div>
                        <Share2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    ))
                  )}
                </div>
                <button onClick={() => setShowShare(false)} className="w-full mt-4 border border-foreground/15 rounded-2xl py-2.5 text-sm font-heading font-medium text-foreground">
                  Cancel
                </button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </PageShell>
    </div>
  );
}