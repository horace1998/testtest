import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import ModalPortal from '@/components/ui/ModalPortal';
import { format } from 'date-fns';

export default function TaskModal({ isOpen, onClose, onSave, goals = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('');

  const activeGoals = goals.filter(g => g.status === 'active');

  const handleSave = () => {
    if (!title.trim() || !dueDate) return;
    const goal = activeGoals.find(g => g.id === selectedGoalId);
    onSave({
      title: title.trim(),
      description: description.trim(),
      goal_id: selectedGoalId || undefined,
      goal_title: goal?.title || undefined,
      idol_name: goal?.idol_name || undefined,
      due_date: dueDate,
      due_time: dueTime || undefined,
      status: 'pending',
    });
    setTitle('');
    setDescription('');
    setSelectedGoalId('');
    setDueDate(format(new Date(), 'yyyy-MM-dd'));
    setDueTime('');
  };

  return (
    <ModalPortal lockScroll={isOpen}>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg"
            style={{ maxHeight: 'calc(100dvh - 32px)' }}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <GlassCard variant="strong" className="p-5 rounded-3xl overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100dvh - 32px)' }} animate={false}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-foreground" />
                  <h3 className="font-heading text-xl font-bold">New Task</h3>
                </div>
                <button onClick={onClose} className="border border-foreground/15 rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="border border-foreground/10 rounded-xl p-3">
                  <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">Task</label>
                  <input
                    type="text"
                    placeholder="What do you need to do?"
                    className="w-full bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/40"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="border border-foreground/10 rounded-xl p-3">
                  <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">Notes (optional)</label>
                  <textarea
                    placeholder="Add details..."
                    className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40 resize-none"
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {activeGoals.length > 0 && (
                  <div className="border border-foreground/10 rounded-xl p-3">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">Link to Goal (optional)</label>
                    <select
                      className="w-full bg-transparent outline-none text-sm text-foreground"
                      value={selectedGoalId}
                      onChange={e => setSelectedGoalId(e.target.value)}
                    >
                      <option value="">No goal</option>
                      {activeGoals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="border border-foreground/10 rounded-xl p-3 flex-1">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full bg-transparent outline-none text-sm font-medium text-foreground"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="border border-foreground/10 rounded-xl p-3 w-36">
                    <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading block mb-1">
                      <Clock className="w-3 h-3 inline mr-1" />Time
                    </label>
                    <input
                      type="time"
                      className="w-full bg-transparent outline-none text-sm font-medium text-foreground"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={!title.trim() || !dueDate}
                  className="flex-1"
                >
                  Add Task
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </ModalPortal>
  );
}
