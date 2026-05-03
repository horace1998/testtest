import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Radio, Plus, Camera, CheckSquare, Trophy, User, Image, Calendar } from 'lucide-react';

const NAV_ITEMS_LEFT = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/missions', icon: Users, label: 'Missions' },
];
const NAV_ITEMS_RIGHT = [
  { path: '/feed', icon: Radio, label: 'Feed' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const ACTIONS = [
  { id: 'goal', label: 'Goal', icon: Trophy },
  { id: 'milestone', label: 'Record', icon: Camera },
  { id: 'task', label: 'Plan', icon: CheckSquare },
];

const ns = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
};

export default function BottomNav({ onSelect }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const handleAction = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    onSelect(id);
  };

  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        draggable={false}
        className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 px-0"
        style={ns}
      >
        <div className="relative flex flex-col items-center gap-1 w-full">
          <item.icon
            className="w-[18px] h-[18px] pointer-events-none"
            style={{
              color: isActive ? '#1a3aad' : 'rgba(0,0,0,0.35)',
              transition: 'color 0.2s',
            }}
            strokeWidth={isActive ? 2 : 1.4}
          />
          <span
            className="text-[9px] pointer-events-none"
            style={{
              color: isActive ? '#1a3aad' : 'rgba(0,0,0,0.3)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: isActive ? 700 : 500,
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            {item.label}
          </span>
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute -bottom-1 w-4 h-0.5 rounded-full"
              style={{ background: '#1a3aad', left: '50%', marginLeft: '-8px' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </div>
      </Link>
    );
  };

  const content = (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-3 pb-4" style={ns}>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />
        )}
      </AnimatePresence>

      {/* Action popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            className="flex items-end justify-center gap-5 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{ zIndex: 50, position: 'relative' }}
          >
            {ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  onClick={(e) => handleAction(e, action.id)}
                  initial={{ opacity: 0, y: 24, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28, delay: i * 0.06 }}
                  whileTap={{ scale: 0.85 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'none', border: 'none', ...ns }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: 'linear-gradient(135deg, #1a3aad 0%, #0d1f6b 100%)',
                    boxShadow: '0 8px 32px rgba(26, 58, 173, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(77, 127, 255, 0.3)',
                  }}>
                    <Icon style={{ width: 24, height: 24, color: '#fff', pointerEvents: 'none' }} strokeWidth={1.8} />
                  </div>
                  <span style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontSize: 10, color: 'rgba(0,0,0,0.55)',
                    letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, pointerEvents: 'none',
                  }}>
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav bar */}
      <div
        className="flex items-center justify-center max-w-sm mx-auto px-3"
        style={{
          height: 64, position: 'relative', zIndex: 50,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(0,0,0,0.09)',
          borderRadius: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          gap: 0,
        }}
      >
        <div className="flex flex-1 items-center h-full justify-around">
          {NAV_ITEMS_LEFT.map(renderNavItem)}
        </div>

        {/* FAB center */}
        <div className="flex items-center justify-center" style={{ flexShrink: 0, width: 70, ...ns }}>
          <motion.button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
            whileTap={{ scale: 0.88 }}
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            style={{
              width: 50, height: 50, borderRadius: 14,
              background: 'linear-gradient(135deg, #1a3aad 0%, #0d1f6b 100%)',
              boxShadow: '0 6px 24px rgba(26, 58, 173, 0.6)',
              border: '1px solid rgba(77, 127, 255, 0.4)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...ns,
            }}
          >
            <Plus style={{ width: 22, height: 22, color: '#fff', pointerEvents: 'none' }} strokeWidth={2} />
          </motion.button>
        </div>

        <div className="flex flex-1 items-center h-full justify-around">
          {NAV_ITEMS_RIGHT.map(renderNavItem)}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}