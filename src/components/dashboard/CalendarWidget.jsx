import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function CalendarWidget({ tasks = [], goals = [], milestones = [], selectedDate, onDateSelect, onNewTask }) {
  const [displayMonth, setDisplayMonth] = useState(selectedDate);

  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Grid layout: pad start of month
  const firstDayOfWeek = getDay(monthStart);
  const padding = Array(firstDayOfWeek).fill(null);
  const calendarDays = [...padding, ...monthDays];

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const getDayTasks = (date) => {
    if (!date) return [];
    return tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), date));
  };

  const activityForDate = (date) => {
    const goalCount = goals.filter((goal) => goal.created_date && isSameDay(new Date(goal.created_date), date)).length;
    const checkinCount = goals.reduce((count, goal) => {
      const checkins = goal.daily_checkins || [];
      return count + checkins.filter((checkin) => checkin.completed && checkin.date && isSameDay(new Date(checkin.date), date)).length;
    }, 0);
    const captureCount = milestones.filter((milestone) => milestone.created_date && isSameDay(new Date(milestone.created_date), date)).length;
    const taskCount = tasks.filter((task) => {
      const taskDate = task.created_date || task.due_date;
      return taskDate && isSameDay(new Date(taskDate), date);
    }).length;
    return { goalCount, checkinCount, captureCount, taskCount, total: goalCount + checkinCount + captureCount + taskCount };
  };
  const heatColor = (total) => {
    if (total >= 6) return '#0d1117';
    if (total >= 4) return '#1a3aad';
    if (total >= 2) return '#4d7fff';
    if (total >= 1) return '#a9c0ff';
    return 'rgba(0,0,0,0.055)';
  };
  const monthStats = monthDays.reduce(
    (acc, day) => {
      const activity = activityForDate(day);
      acc.goals += activity.goalCount;
      acc.checkins += activity.checkinCount;
      acc.captures += activity.captureCount;
      acc.tasks += activity.taskCount;
      acc.total += activity.total;
      return acc;
    },
    { goals: 0, checkins: 0, captures: 0, tasks: 0, total: 0 }
  );

  return (
    <GlassCard variant="strong" className="p-6 mb-6" animate={false}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
          className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[0.32em] text-foreground/35">
            Activity Heatmap
          </p>
          <h2 className="mt-1 text-5xl font-display font-bold text-foreground">
            {format(displayMonth, 'MMM').toUpperCase()}
          </h2>
        </div>
        <button
          onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
          className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Monthly heatmap */}
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-[10px] font-heading font-bold text-foreground/40">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weeks.map((week, wi) =>
            week.map((date, di) => {
              const isSelected = date && isSameDay(date, selectedDate);
              const activity = date ? activityForDate(date) : null;

              return (
                <button
                   key={`${wi}-${di}`}
                   onClick={() => date && onDateSelect(date)}
                   disabled={!date}
                   title={date ? `${format(date, 'MMM d')}: ${activity.total} activity` : ''}
                   className="aspect-square rounded-md border text-[10px] font-heading font-bold transition-transform active:scale-95"
                   style={{
                     background: date ? heatColor(activity.total) : 'transparent',
                     borderColor: isSelected ? '#0d1117' : date && activity.total ? 'rgba(26,58,173,0.22)' : 'rgba(0,0,0,0.06)',
                     color: activity?.total >= 4 ? '#fff' : 'rgba(0,0,0,0.52)',
                     boxShadow: isSelected ? '0 0 0 2px rgba(13,17,23,0.18)' : 'none',
                   }}
                 >
                   {date && format(date, 'd')}
                 </button>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-5 mt-5 border-t border-foreground/10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-heading font-bold text-foreground/50 tracking-[0.28em] uppercase">
              Monthly Activity
            </p>
            <h3 className="font-display text-3xl leading-none text-foreground mt-1">
              {String(monthStats.total).padStart(2, '0')} USES
            </h3>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 4, 6].map((level) => (
              <span
                key={level}
                className="block rounded-[3px]"
                style={{ width: 11, height: 11, background: heatColor(level), border: '1px solid rgba(0,0,0,0.06)' }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Checkins', value: monthStats.checkins },
            { label: 'Goals', value: monthStats.goals },
            { label: 'Captures', value: monthStats.captures },
            { label: 'Tasks', value: monthStats.tasks },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-2 py-2 text-center">
              <p className="font-display text-xl leading-none text-foreground">{String(item.value).padStart(2, '0')}</p>
              <p className="mt-1 text-[8px] font-heading font-bold uppercase tracking-[0.22em] text-foreground/40">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task list for currently selected date */}
      {selectedDate && getDayTasks(selectedDate).length > 0 && (
        <div className="mt-6 pt-6 border-t border-foreground/10">
          <p className="text-[10px] font-heading font-bold text-foreground/50 mb-3">TASKS</p>
          <div className="space-y-2">
            {getDayTasks(selectedDate).map(task => (
              <motion.div
                key={task.id}
                className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-foreground/5"
              >
                <div className="w-4 h-4 rounded mt-0.5 border-2 border-foreground/20 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading text-foreground">
                    {task.title}
                  </p>
                  {task.due_time && (
                    <p className="text-[10px] text-foreground/40 mt-0.5">{task.due_time}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
