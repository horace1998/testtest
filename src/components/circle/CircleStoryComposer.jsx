import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Send, Loader2, X } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moderate } from '@/lib/moderation';
import { assetTypeFromFile } from '@/lib/circleFeed';

export default function CircleStoryComposer({ circleId, mission, currentUser }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const queryClient = useQueryClient();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    setPosting(true);
    try {
      if (trimmed) {
        const verdict = await moderate(trimmed, 'circle_story');
        if (!verdict.ok) {
          toast.error(verdict.reason || 'Story blocked');
          setPosting(false);
          return;
        }
      }

      let asset_url = '';
      let asset_type = '';
      if (file) {
        const { file_url } = await synkify.integrations.Core.UploadFile({ file });
        asset_url = file_url;
        asset_type = assetTypeFromFile(file);
      }

      await synkify.entities.FeedPost.create({
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        idol_name: mission?.idol_name || '',
        idol_group: mission?.idol_group || '',
        goal_title: mission?.title || '',
        asset_url,
        asset_type,
        caption: trimmed,
        support_circle_id: circleId,
        post_type: 'circle_story',
        moderation_status: 'approved',
      });

      setText('');
      clearFile();
      queryClient.invalidateQueries({ queryKey: ['circle-stories', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circle-unified-feed', circleId] });
      toast.success('Story shared with the circle.');
    } catch (e) {
      toast.error('Could not share story');
    }
    setPosting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-4 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <p style={{
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 9,
        fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase',
        color: 'rgba(0,0,0,0.4)', marginBottom: 10,
      }}>Share a struggle · or a win</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 600))}
        placeholder="What are you going through today?"
        rows={3}
        className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none mb-2"
        style={{
          fontFamily: 'Space Grotesk, sans-serif',
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.07)',
          color: '#0d1117',
        }}
      />

      {filePreview && (
        <div className="relative mb-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {file?.type?.startsWith('video/') ? (
            <video src={filePreview} controls className="w-full max-h-60 bg-black object-contain" />
          ) : (
            <img src={filePreview} alt="" className="w-full max-h-60 object-cover" />
          )}
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 rounded-full p-1.5"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="cursor-pointer flex items-center gap-1.5" style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
          fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.55)',
        }}>
          <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
          <ImageIcon className="w-3.5 h-3.5" /> Add media
        </label>
        <button
          onClick={handlePost}
          disabled={(!text.trim() && !file) || posting}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl"
          style={{
            fontFamily: 'Space Grotesk, sans-serif', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase',
            background: 'linear-gradient(135deg, #1a3aad, #0d1f6b)',
            color: '#fff',
            opacity: ((!text.trim() && !file) || posting) ? 0.5 : 1,
          }}
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Share
        </button>
      </div>
    </motion.div>
  );
}
