import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import MilestoneCard from '@/components/milestones/MilestoneCard';
import MilestoneUploadModal from '@/components/milestones/MilestoneUploadModal';
import PageShell from '@/components/PageShell';
import { Trophy, Plus, Grid, List, ImageIcon, Trash2 } from 'lucide-react';

export default function MilestoneGallery() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState(null);
  const [filterIdol, setFilterIdol] = useState('all');

  useEffect(() => {
    synkify.auth.me().then(setUser);
  }, []);

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: () => synkify.entities.Milestone.list('-created_date'),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  // Unique idols from milestones for filtering
  const idols = ['all', ...new Set(milestones.map(m => m.idol_name).filter(Boolean))];

  const filtered = filterIdol === 'all'
    ? milestones
    : milestones.filter(m => m.idol_name === filterIdol);

  const handleAddMilestone = (goal = null) => {
    setSelectedGoal(goal);
    setShowUpload(true);
  };

  return (
    <div className="min-h-screen relative pb-28">
      <PageShell goals={goals} user={user}>
      <ThreeBackground />

      <div className="relative z-10 px-6 pt-[3.5rem]">
        {/* Header */}
        <motion.div
          className="flex items-start justify-between mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <div>
            <p className="editorial-eyebrow mb-1">Station Archive</p>
            <h1 className="font-display text-4xl tracking-tight text-foreground" style={{ fontWeight: 800 }}>WALL</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`border rounded-xl p-2.5 transition-all ${viewMode === 'grid' ? 'bg-foreground text-background border-foreground' : 'border-foreground/15'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`border rounded-xl p-2.5 transition-all ${viewMode === 'list' ? 'bg-foreground text-background border-foreground' : 'border-foreground/15'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats banner */}
        <div className="grid grid-cols-3 mb-5 border-t border-b border-foreground/15">
          {[
            { label: 'Shots', value: milestones.length },
            { label: 'Idols', value: new Set(milestones.map(m => m.idol_name)).size },
            { label: 'Goals', value: new Set(milestones.map(m => m.goal_id)).size },
          ].map((s, i) => (
            <div key={s.label} className={`text-center py-4 ${i < 2 ? 'border-r border-foreground/15' : ''}`}>
              <p className="font-display text-2xl text-foreground" style={{ fontWeight: 700 }}>{String(s.value).padStart(2, '0')}</p>
              <p className="editorial-eyebrow mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add milestone from goal */}
        {goals.filter(g => g.status === 'active').length > 0 && (
          <div className="mb-4">
            <p className="editorial-eyebrow mb-2">Add from goal</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {goals.filter(g => g.status === 'active').map(goal => (
                <motion.button
                  key={goal.id}
                  className="border border-foreground/15 rounded-xl px-3 py-2 flex-shrink-0 text-left"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddMilestone(goal)}
                >
                  <p className="text-xs font-heading font-semibold whitespace-nowrap">{goal.idol_name}</p>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap max-w-28 truncate">{goal.title}</p>
                </motion.button>
              ))}
              <motion.button
                className="border border-dashed border-foreground/20 rounded-xl px-4 py-2 flex items-center gap-2 flex-shrink-0"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddMilestone(null)}
              >
                <Plus className="w-4 h-4 text-foreground" />
                <span className="text-xs font-heading text-muted-foreground">Free upload</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Idol filter */}
        {idols.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {idols.map(idol => (
              <button
                key={idol}
                className={`rounded-full px-3 py-1.5 text-xs font-heading font-medium capitalize flex-shrink-0 transition-all border ${
                  filterIdol === idol
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-foreground/15 text-muted-foreground'
                }`}
                onClick={() => setFilterIdol(idol)}
              >
                {idol}
              </button>
            ))}
          </div>
        )}

        {/* Gallery */}
        {isLoading ? (
          <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-foreground/15 rounded-2xl p-10 text-center">
            <Trophy className="w-8 h-8 text-foreground/20 mx-auto mb-3" />
            <p className="font-heading font-semibold mb-1">No milestones yet</p>
            <p className="text-sm text-muted-foreground mb-5">Complete a goal and upload your shot!</p>
            <button
              onClick={() => handleAddMilestone(null)}
              className="bg-foreground text-background rounded-2xl px-6 py-2.5 text-sm font-heading font-bold flex items-center gap-2 mx-auto"
            >
              <ImageIcon className="w-4 h-4" /> Upload First Shot
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {filtered.map((milestone, i) => (
                <MilestoneCard key={milestone.id} milestone={milestone} index={i} currentUserEmail={user?.email} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <MilestoneUploadModal
        isOpen={showUpload}
        onClose={() => { setShowUpload(false); setSelectedGoal(null); }}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['milestones'] })}
        goal={selectedGoal}
      />
      </PageShell>
    </div>
  );
}