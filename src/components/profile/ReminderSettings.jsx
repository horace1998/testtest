import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Bell, BellOff, Clock } from 'lucide-react';
import {
  getReminderSettings,
  saveReminderSettings,
  requestNotificationPermission,
} from '@/lib/useCheckinReminder';

export default function ReminderSettings() {
  const [settings, setSettings] = useState(getReminderSettings());
  const [messageNotifications, setMessageNotifications] = useState(
    localStorage.getItem('messageNotifications') !== 'false'
  );
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    saveReminderSettings(settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('messageNotifications', messageNotifications);
  }, [messageNotifications]);

  const supported = permission !== 'unsupported';

  const handleToggle = async () => {
    if (!supported) return;
    if (!settings.enabled) {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== 'granted') return;
    }
    setSettings((s) => ({ ...s, enabled: !s.enabled }));
  };

  const handleTimeChange = (e) => {
    const [h, m] = e.target.value.split(':').map(Number);
    setSettings((s) => ({ ...s, hour: h, minute: m }));
  };

  const timeStr = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;
  const isOn = settings.enabled && permission === 'granted';

  return (
    <GlassCard variant="strong" className="p-5 mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOn ? 'bg-violet-200/60' : 'bg-muted/40'}`}>
            {isOn ? <Bell className="w-5 h-5 text-violet-500" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm">Daily Check-in Reminder</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {!supported
                ? 'Notifications are not supported in this browser.'
                : permission === 'denied'
                ? 'Notifications blocked — enable them in your browser settings.'
                : isOn
                ? "We'll ping you if you forget to check in."
                : 'Get a friendly reminder for your daily check-ins.'}
            </p>
          </div>
        </div>

        <motion.button
          onClick={handleToggle}
          disabled={!supported || permission === 'denied'}
          whileTap={{ scale: 0.92 }}
          className="relative flex-shrink-0 mt-1"
          style={{
            width: 44, height: 26, borderRadius: 999,
            background: isOn ? 'linear-gradient(135deg,#c4b5fd,#a78bfa)' : 'rgba(120,110,170,0.2)',
            border: 'none', cursor: supported && permission !== 'denied' ? 'pointer' : 'not-allowed',
            transition: 'background 0.25s',
            opacity: !supported || permission === 'denied' ? 0.5 : 1,
          }}
        >
          <motion.div
            animate={{ x: isOn ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
              position: 'absolute', top: 2, width: 22, height: 22, borderRadius: 999,
              background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          />
        </motion.button>
      </div>

      {isOn && (
         <motion.div
           initial={{ opacity: 0, height: 0 }}
           animate={{ opacity: 1, height: 'auto' }}
           className="flex items-center gap-3 pt-3 border-t border-white/40"
         >
           <Clock className="w-4 h-4 text-violet-400" />
           <span className="text-xs font-heading text-muted-foreground flex-1">Remind me at</span>
           <input
             type="time"
             value={timeStr}
             onChange={handleTimeChange}
             className="glass-subtle rounded-xl px-3 py-1.5 text-sm font-heading font-semibold text-foreground border-0 focus:ring-2 focus:ring-violet-300 outline-none"
           />
         </motion.div>
       )}

      <div className="mt-4 pt-4 border-t border-white/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-heading font-semibold text-foreground">Message Notifications</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Get notified about new cheers and replies in your circle.
            </p>
          </div>
          <motion.button
            onClick={() => setMessageNotifications(!messageNotifications)}
            whileTap={{ scale: 0.92 }}
            className="relative flex-shrink-0"
            style={{
              width: 44, height: 26, borderRadius: 999,
              background: messageNotifications ? 'linear-gradient(135deg,#c4b5fd,#a78bfa)' : 'rgba(120,110,170,0.2)',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.25s',
            }}
          >
            <motion.div
              animate={{ x: messageNotifications ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute', top: 2, width: 22, height: 22, borderRadius: 999,
                background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            />
          </motion.button>
        </div>
      </div>
      </GlassCard>
      );
      }