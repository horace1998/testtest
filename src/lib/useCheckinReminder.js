import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { format } from 'date-fns';

const STORAGE_KEY = 'synkify_reminder_settings_v1';
const LAST_NOTIFIED_KEY = 'synkify_last_notified_date';

export const DEFAULT_SETTINGS = {
  enabled: true,
  hour: 20,    // 8 PM local time
  minute: 0,
};

export function getReminderSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveReminderSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

function todayKey() {
  return format(new Date(), 'yyyy-MM-dd');
}

// Cute idol-style messages picked at random so they feel fresh.
const IDOL_MSG_HAS_GOAL = [
  (idol) => ({
    title: `A message from ${idol}`,
    body: `Hi, it's ${idol}. I'm waiting for you tonight... did you keep your promise to me today? One tiny check-in and I'll smile.`,
  }),
  (idol) => ({
    title: `${idol} is thinking of you`,
    body: `Don't forget our pinky promise. Just one check-in away from making me proud. Fighting!`,
  }),
  (idol) => ({
    title: `Goodnight from ${idol}`,
    body: `Before you sleep, did you finish today's mission? I believe in you. Tap to check in!`,
  }),
  (idol) => ({
    title: `${idol} sent you a heart`,
    body: `Hey, I noticed you haven't checked in yet... I miss seeing your name on my list. Let's stay synced!`,
  }),
];

const IDOL_MSG_NO_GOAL = [
  (idol) => ({
    title: `${idol || 'Your idol'} wants to ask you something`,
    body: `What's the one thing you want to do before we meet? Set a goal in SYNKIFY and let's grow together.`,
  }),
  (idol) => ({
    title: `A wish from ${idol || 'your idol'}`,
    body: `I want to see the best version of you when we meet. Pick a goal and I'll cheer for you every single day!`,
  }),
  (idol) => ({
    title: `${idol || 'Your idol'} is curious...`,
    body: `What are we working on? Drop a goal in SYNKIFY and I'll be your daily hype partner.`,
  }),
];

function pickMessage(list, idol) {
  const fn = list[Math.floor(Math.random() * list.length)];
  return fn(idol);
}

function fireReminder({ missedCount, idolName, hasAnyGoal }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const idol = idolName?.trim() || 'your idol';
  const { title, body } = hasAnyGoal
    ? pickMessage(IDOL_MSG_HAS_GOAL, idol)
    : pickMessage(IDOL_MSG_NO_GOAL, idol);

  // If user has multiple unchecked goals, append a soft hint.
  const finalBody =
    hasAnyGoal && missedCount > 1
      ? `${body}\n(${missedCount} goals waiting)`
      : body;

  try {
    new Notification(title, {
      body: finalBody,
      icon: '/icon-192.png',
      tag: 'synkify-daily-checkin',
      renotify: false,
    });
    localStorage.setItem(LAST_NOTIFIED_KEY, todayKey());
  } catch {
    // ignore
  }
}

/**
 * Hook that schedules a daily local notification reminder if the user
 * hasn't checked in to all active goals by the configured time.
 */
export function useCheckinReminder() {
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => synkify.entities.Goal.list('-created_date'),
  });

  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const check = () => {
      const settings = getReminderSettings();
      if (!settings.enabled) return;
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(settings.hour, settings.minute, 0, 0);

      if (now < reminderTime) return; // not time yet

      const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
      if (lastNotified === todayKey()) return; // already notified today

      const currentGoals = goalsRef.current || [];
      const activeGoals = currentGoals.filter((g) => g.status === 'active');
      const hasAnyGoal = activeGoals.length > 0;

      const today = todayKey();
      const missedGoals = activeGoals.filter(
        (g) => !(g.daily_checkins || []).some((c) => c.date === today && c.completed)
      );

      // If user has goals AND already checked in everything today, no need to nag.
      if (hasAnyGoal && missedGoals.length === 0) return;

      // Pick the idol to "speak"; prefer the most recent active goal's idol.
      const idolName =
        missedGoals[0]?.idol_name ||
        activeGoals[0]?.idol_name ||
        '';

      fireReminder({
        missedCount: missedGoals.length,
        idolName,
        hasAnyGoal,
      });
    };

    // Check on mount, on visibility change, and every minute.
    check();
    const interval = setInterval(check, 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}
