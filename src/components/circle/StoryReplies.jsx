import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageCircle, Reply as ReplyIcon, Send } from 'lucide-react';
import { toast } from 'sonner';
import { moderate } from '@/lib/moderation';

const ReplyThread = memo(function ReplyThread({ reply, allReplies, onReply }) {
  const childReplies = allReplies.filter((item) => item.parent_comment_id === reply.id);
  return (
    <div className="space-y-2">
      <div
        className="p-2 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 600, color: '#1a3aad' }}>
            {reply.user_name || reply.user_email?.split('@')[0]}
          </p>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 8, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            {formatDistanceToNow(new Date(reply.created_date), { addSuffix: true })}
          </p>
        </div>
        <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 12, color: '#0d1117', lineHeight: 1.4, marginBottom: 6 }}>
          {reply.content}
        </p>
        <button
          onClick={() => onReply(reply)}
          className="flex items-center gap-1 text-[9px] text-primary/60 hover:text-primary transition-colors"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, letterSpacing: '0.1em' }}
        >
          <ReplyIcon className="w-2.5 h-2.5" /> Reply
        </button>
      </div>
      {childReplies.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-foreground/10 pl-2">
          {childReplies.map((child) => (
            <ReplyThread key={child.id} reply={child} allReplies={allReplies} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
});

export default function StoryReplies({ storyId, currentUser, openSignal = 0, hideToggle = false }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const inputWrapRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (openSignal > 0) setShowReplies(true);
  }, [openSignal]);

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['story-replies', storyId],
    queryFn: () => synkify.entities.Comment.filter(
      { post_id: storyId, moderation_status: 'approved' },
      '-created_date',
      50
    ),
    enabled: !!storyId && showReplies,
  });

  const handleReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const verdict = await moderate(trimmed, 'comment');
      if (!verdict.ok) {
        toast.error(verdict.reason || 'Reply blocked');
        setSending(false);
        return;
      }

      await synkify.entities.Comment.create({
        post_id: storyId,
        parent_comment_id: replyingTo?.id || null,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        content: trimmed,
        moderation_status: 'approved',
      });

      setReplyText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['story-replies', storyId] });
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Could not send reply');
    }
    setSending(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-foreground/10">
      {!hideToggle && (
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1.5 text-xs"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, color: 'rgba(0,0,0,0.5)', letterSpacing: '0.15em' }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </button>
      )}

      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              </div>
            ) : replies.length > 0 ? (
              <div className="space-y-2 mb-3 max-h-64 overflow-y-auto overscroll-contain pr-1">
                {replies.filter((reply) => !reply.parent_comment_id).map((reply) => (
                  <ReplyThread key={reply.id} reply={reply} allReplies={replies} onReply={setReplyingTo} />
                ))}
              </div>
            ) : null}

            <div ref={inputWrapRef} className="flex flex-col gap-2">
              {replyingTo && (
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 600, color: '#1a3aad' }}>
                    Replying to {replyingTo.user_name || replyingTo.user_email?.split('@')[0]}
                  </p>
                  <button onClick={() => setReplyingTo(null)} className="text-primary/60 hover:text-primary text-xs">
                    Cancel
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2 pb-[env(safe-area-inset-bottom)]">
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value.slice(0, 240))}
                  onFocus={() => {
                    window.setTimeout(() => {
                      inputWrapRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }, 250);
                  }}
                  placeholder="Reply..."
                  maxLength={240}
                  rows={1}
                  className="min-w-0 flex-1 resize-none rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    color: '#0d1117',
                    minHeight: 38,
                    maxHeight: 96,
                  }}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="shrink-0 rounded-lg px-3"
                  style={{
                    minHeight: 38,
                    background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
                    color: '#fff',
                    opacity: !replyText.trim() || sending ? 0.5 : 1,
                    cursor: !replyText.trim() || sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
