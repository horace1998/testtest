import React from 'react';
import { createPortal } from 'react-dom';
import BottomNav from '@/components/BottomNav';
import { useNavAction } from '@/lib/NavActionContext';
import { useCheckinReminder } from '@/lib/useCheckinReminder';

export default function RootChrome() {
  const { select } = useNavAction();
  useCheckinReminder();

  const topBar = (
    <div
      className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-between px-5"
      style={{
        height: 48,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      {/* Left tag */}
      <span style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, letterSpacing: '0.35em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>
        EST. MMXXVI
      </span>

      {/* Wordmark */}
      <p
        style={{
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: 22,
          letterSpacing: '0.18em',
          color: '#111',
          lineHeight: 1,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        SYNKIFY
      </p>

      {/* Right tag */}
      <span style={{ fontFamily: 'Space Grotesk', fontSize: 9, fontWeight: 600, letterSpacing: '0.3em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>
        ◉ LIVE
      </span>
    </div>
  );

  return (
    <>
      {typeof document !== 'undefined' && createPortal(topBar, document.body)}
      <BottomNav onSelect={select} />
    </>
  );
}