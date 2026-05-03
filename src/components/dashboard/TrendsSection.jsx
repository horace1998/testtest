import React from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isSameDay } from 'date-fns';

function buildLast14({ goals = [], milestones = [], tasks = [] }) {
  return Array.from({ length: 14 }, (_, index) => {
    const date = subDays(new Date(), 13 - index);
    const goalCount = goals.filter((goal) => goal.created_date && isSameDay(new Date(goal.created_date), date)).length;
    const captureCount = milestones.filter((milestone) => milestone.created_date && isSameDay(new Date(milestone.created_date), date)).length;
    const taskCount = tasks.filter((task) => {
      const taskDate = task.created_date || task.due_date;
      return taskDate && isSameDay(new Date(taskDate), date);
    }).length;

    return {
      date,
      goalCount,
      captureCount,
      taskCount,
      total: goalCount + captureCount + taskCount,
    };
  });
}

function heatColor(total) {
  if (total >= 6) return '#0d1117';
  if (total >= 4) return '#1a3aad';
  if (total >= 2) return '#4d7fff';
  if (total >= 1) return '#a9c0ff';
  return 'rgba(0,0,0,0.055)';
}

export default function TrendsSection({ goals = [], milestones = [], tasks = [] }) {
  const data = buildLast14({ goals, milestones, tasks });
  const stats = data.reduce(
    (acc, day) => {
      acc.goals += day.goalCount;
      acc.captures += day.captureCount;
      acc.tasks += day.taskCount;
      acc.total += day.total;
      if (day.total > 0) acc.activeDays += 1;
      return acc;
    },
    { goals: 0, captures: 0, tasks: 0, total: 0, activeDays: 0 }
  );
  const consistency = Math.round((stats.activeDays / 14) * 100);

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
          }}
        >
          Almanac / Last Fortnight
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.1)' }} />
      </div>

      <div
        style={{
          borderRadius: 16,
          background: 'rgba(0,0,0,0.02)',
          border: '1px solid rgba(0,0,0,0.07)',
          padding: '18px 18px 16px',
        }}
      >
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p
              style={{
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 44,
                color: '#0d1117',
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}
            >
              {String(stats.total).padStart(2, '0')}
            </p>
            <p
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.35)',
                marginTop: 2,
              }}
            >
              Total Uses
            </p>
          </div>
          <div className="text-right">
            <p
              style={{
                fontFamily: 'Bebas Neue, Impact, sans-serif',
                fontSize: 44,
                color: '#1a3aad',
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}
            >
              {consistency}<span style={{ fontSize: 18, color: 'rgba(0,0,0,0.3)' }}>%</span>
            </p>
            <p
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.35)',
                marginTop: 2,
              }}
            >
              Active Days
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {data.map((day) => (
            <div key={day.date.toISOString()} className="min-w-0">
              <div
                title={`${format(day.date, 'MMM d')}: ${day.total} uses, ${day.goalCount} goals, ${day.captureCount} captures, ${day.taskCount} tasks`}
                className="aspect-square rounded-md border"
                style={{
                  background: heatColor(day.total),
                  borderColor: day.total ? 'rgba(26,58,173,0.24)' : 'rgba(0,0,0,0.06)',
                  boxShadow: day.total ? 'inset 0 0 0 1px rgba(255,255,255,0.18)' : 'none',
                }}
              />
              <p className="mt-1 text-center text-[9px] font-heading font-bold text-foreground/35">
                {format(day.date, 'd')}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[9px] font-heading font-bold uppercase tracking-[0.22em] text-foreground/30">Less</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 4, 6].map((level) => (
              <span
                key={level}
                className="block rounded-[3px]"
                style={{ width: 11, height: 11, background: heatColor(level), border: '1px solid rgba(0,0,0,0.06)' }}
              />
            ))}
          </div>
          <span className="text-[9px] font-heading font-bold uppercase tracking-[0.22em] text-foreground/30">More</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: 'Goals', value: stats.goals },
            { label: 'Captures', value: stats.captures },
            { label: 'Tasks', value: stats.tasks },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-foreground/10 bg-white/70 px-3 py-2 text-center">
              <p className="font-display text-xl leading-none text-foreground">{String(item.value).padStart(2, '0')}</p>
              <p className="mt-1 text-[8px] font-heading font-bold uppercase tracking-[0.22em] text-foreground/40">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
