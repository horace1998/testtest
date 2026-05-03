import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synkify } from '@/api/synkifyClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, CheckCircle2, Circle, Share2, Loader2 } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import PageShell from '@/components/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { toast } from 'sonner';

export default function Tasks() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [shareTaskId, setShareTaskId] = useState(null);

  useEffect(() => {
    synkify.auth.me().then(setUser);
  }, []);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => synkify.entities.Task.list('-due_date'),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list(),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task) => {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      await synkify.entities.Task.update(task.id, { status: newStatus });
      return { ...task, status: newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const shareTaskMutation = useMutation({
    mutationFn: async (task) => {
      const goal = goals.find(g => g.id === task.goal_id);
      if (!goal?.mission_id) {
        toast.error('Goal not linked to a mission');
        return;
      }
      const mission = await synkify.entities.Mission.get(goal.mission_id);
      await synkify.entities.FeedPost.create({
        user_email: user.email,
        user_name: user.full_name || user.email.split('@')[0],
        idol_name: goal.idol_name,
        idol_group: goal.idol_group,
        goal_title: goal.title,
        caption: `Completed: ${task.title}`,
        support_circle_id: goal.mission_id,
        post_type: 'circle_story',
        cheers: [],
      });
      toast.success('Shared to circle!');
      setShareTaskId(null);
    },
    onError: () => toast.error('Could not share'),
  });

  // Tasks for selected date
  const tasksForDate = tasks.filter(t => {
    if (!t.due_date) return false;
    return isSameDay(parseISO(t.due_date), selectedDate);
  });

  // All upcoming tasks (next 30 days)
  const upcomingTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const dueDate = parseISO(t.due_date);
    const now = new Date();
    return dueDate >= now && dueDate.getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <div className="min-h-screen relative pb-32" style={{ background: '#ffffff' }}>
      <PageShell goals={goals} user={user}>
      <div className="relative z-10 px-5 pt-[3.5rem]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="mb-6"
        >
          <p className="editorial-eyebrow mb-1">Agenda</p>
          <h1 className="font-display text-4xl tracking-tight text-foreground" style={{ fontWeight: 800 }}>PLAN</h1>
        </motion.div>

        {/* Calendar picker */}
        <GlassCard variant="strong" className="p-4 mb-6" animate={false}>
          <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground mb-3">Select date</p>
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(35)].map((_, i) => {
              const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - 14);
              const isToday = isSameDay(date, new Date());
              const isSelected = isSameDay(date, selectedDate);
              const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), date));
              const hasDone = dayTasks.some(t => t.status === 'done');
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-lg text-xs font-heading flex flex-col items-center justify-center transition-all border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-foreground/10 text-foreground'
                  } ${isToday ? 'ring-1 ring-primary' : ''}`}
                >
                  <span className="font-bold">{format(date, 'd')}</span>
                  {hasDone && <span className="text-[6px] text-primary">OK</span>}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Timeline for selected date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <p className="font-heading text-sm font-bold mb-3">
            {format(selectedDate, 'MMM d, yyyy')}
          </p>
          
          {tasksForDate.length === 0 ? (
            <GlassCard variant="subtle" className="p-6 text-center" animate={false}>
              <Calendar className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No tasks for this date</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {tasksForDate.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <GlassCard
                    variant={task.status === 'done' ? 'subtle' : 'strong'}
                    className="p-3 flex items-start gap-3"
                    animate={false}
                  >
                    <button
                      onClick={() => toggleTaskMutation.mutate(task)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-foreground/30" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-heading ${
                          task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.due_time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {task.due_time}
                        </p>
                      )}
                    </div>
                    {task.status === 'done' && task.goal_id && (
                      <button
                        onClick={() => setShareTaskId(task.id)}
                        className="flex-shrink-0 text-primary hover:text-primary/80"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming timeline */}
        {upcomingTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="font-heading text-sm font-bold mb-3">Coming up</p>
            <div className="space-y-2">
              {upcomingTasks.slice(0, 8).map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <button
                    onClick={() => setSelectedDate(parseISO(task.due_date))}
                    className="w-full text-left p-3 rounded-2xl glass-strong transition-all hover:border-primary/30"
                  >
                    <p className="text-xs text-muted-foreground font-heading">
                      {format(parseISO(task.due_date), 'MMM d')}
                    </p>
                    <p className="text-sm font-heading text-foreground mt-1">{task.title}</p>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {shareTaskId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            onClick={() => setShareTaskId(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full glass-strong rounded-t-3xl p-6"
            >
              <p className="font-heading font-bold mb-4">Share to circle?</p>
              <p className="text-sm text-muted-foreground mb-6">
                Post this achievement to your support circle.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShareTaskId(null)}
                  className="flex-1 px-4 py-3 rounded-2xl border border-foreground/15 font-heading text-sm"
                >
                  Cancel
                </button>
                <GlassButton
                  variant="primary"
                  onClick={() => shareTaskMutation.mutate(tasks.find(t => t.id === shareTaskId))}
                  disabled={shareTaskMutation.isPending}
                  className="flex-1"
                >
                  {shareTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Share'}
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </PageShell>
    </div>
  );
}
