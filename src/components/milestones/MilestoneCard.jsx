import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ImageIcon, Trash2, X } from 'lucide-react';
import { synkify } from '@/api/synkifyClient';
import { useQueryClient } from '@tanstack/react-query';

export default function MilestoneCard({ milestone, index = 0, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = milestone.created_date
    ? format(new Date(milestone.created_date), 'MMM d, yyyy')
    : '';

  const isOwner = currentUserEmail && milestone.created_by === currentUserEmail;

  const handleDelete = async () => {
    setDeleting(true);
    await synkify.entities.Milestone.delete(milestone.id);
    queryClient.invalidateQueries({ queryKey: ['milestones'] });
  };

  return (
    <>
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-foreground/5 border border-foreground/10"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: index * 0.07 }}
        whileHover={{ scale: 1.02, y: -2 }}
      >
        {/* Asset image */}
        <div className="relative aspect-square">
          {milestone.asset_url ? (
            milestone.asset_type === 'video' ? (
              <video
                src={milestone.asset_url}
                controls
                className="w-full h-full bg-black object-contain"
              />
            ) : (
              <img
                src={milestone.asset_url}
                alt={milestone.goal_title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-foreground/5">
              <ImageIcon className="w-10 h-10 text-foreground/30" />
            </div>
          )}

          {/* Delete button for owner */}
          {isOwner && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white"
              aria-label="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          {/* Type badge */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
            <span className="text-[9px] font-heading font-bold uppercase tracking-wider text-white">
              {milestone.asset_type}
            </span>
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="font-heading font-bold text-xs text-white line-clamp-1">{milestone.goal_title}</p>
            <p className="text-[10px] text-white/70">{milestone.idol_name}</p>
          </div>
        </div>

        {milestone.caption && (
          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">"{milestone.caption}"</p>
          </div>
        )}
      </motion.div>

      {/* Delete confirm dialog */}
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
                <p className="font-heading font-bold text-base">Delete milestone?</p>
                <button onClick={() => setConfirmDelete(false)} className="border border-foreground/15 rounded-full p-1.5">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-5">This will permanently remove this milestone from your wall.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-foreground/15 rounded-2xl py-2.5 text-sm font-heading"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-foreground text-background rounded-2xl py-2.5 text-sm font-heading font-bold"
                >
              {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
