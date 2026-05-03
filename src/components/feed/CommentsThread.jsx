import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { format } from 'date-fns';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { moderate } from '@/lib/moderation';
import { toast } from 'sonner';

const CHANTS = ['FIGHTING!', 'You are slaying', 'Proud of you', 'Keep going!'];

export default function CommentsThread({ postId, currentUser, onCountChange }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => synkify.entities.Comment.filter({ post_id: postId }, 'created_date'),
    enabled: !!postId,
  });

  const submit = async (content) => {
    const trimmed = (content || '').trim();
    if (!trimmed || !currentUser || posting) return;
    setPosting(true);

    const verdict = await moderate(trimmed, 'comment');
    if (!verdict.ok) {
      toast.error(verdict.reason);
      setPosting(false);
      return;
    }

    await synkify.entities.Comment.create({
      post_id: postId,
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: trimmed,
    });

    // Bump post comment_count
    try {
      const post = await synkify.entities.FeedPost.get(postId);
      const newCount = (post.comment_count || 0) + 1;
      await synkify.entities.FeedPost.update(postId, { comment_count: newCount });
      onCountChange?.(newCount);
    } catch {}

    setText('');
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    queryClient.invalidateQueries({ queryKey: ['feedposts'] });
    setPosting(false);
  };

  return (
    <div className="border-t border-white/40 px-4 py-3">
      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/70 italic mb-3 text-center">No comments yet. Be the first to cheer.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto no-scrollbar">
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-subtle rounded-2xl px-3 py-2"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-heading font-semibold">{c.user_name || c.user_email?.split('@')[0]}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {c.created_date ? format(new Date(c.created_date), 'MMM d') : ''}
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{c.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick chants */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 pb-1">
        {CHANTS.map((c) => (
          <button
            key={c}
            onClick={() => submit(c)}
            disabled={posting}
            className="flex-shrink-0 glass-subtle rounded-full px-2.5 py-1 text-[10px] font-heading hover:ring-1 hover:ring-violet-300/60 transition-all disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(text); }}
          placeholder="Add a supportive comment..."
          maxLength={500}
          disabled={posting}
          className="flex-1 bg-transparent outline-none text-xs font-medium placeholder:text-muted-foreground/40"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          disabled={!text.trim() || posting}
          onClick={() => submit(text)}
          className="glass-subtle rounded-full p-1.5 disabled:opacity-40"
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" /> : <Send className="w-3.5 h-3.5 text-violet-500" />}
        </motion.button>
      </div>
    </div>
  );
}