import React, { useRef, useState } from 'react';

/**
 * HeroPreview — pure visual renderer of the hero banner.
 * Used by both the dashboard (live) and the profile editor (preview).
 *
 * settings: { glow, blur, brightness, contrast, saturation, shadow, text_color,
 *             title_line1, title_line2, title_x, title_y }
 *
 * onTitleDrag(xPct, yPct) — optional. When provided, the title becomes draggable.
 */
export default function HeroPreview({
  imageUrl,
  settings,
  idolName = 'YOUR IDOL',
  groupName = 'SYNKIFY',
  compact = false,
  onTitleDrag = null,
}) {
  const {
    glow = 50,
    blur = 0,
    brightness = 100,
    contrast = 100,
    saturation = 100,
    shadow = 50,
    text_color = '#ffffff',
    title_line1,
    title_line2,
    title_x = 5,
    title_y = 8,
  } = settings || {};

  // Defaults: line1 = group, line2 = idol. Preserve user case (no forced uppercase).
  const line1 = (title_line1?.trim() || groupName || 'SYNKIFY');
  const line2 = (title_line2?.trim() || idolName || 'YOUR IDOL');

  const containerRef = useRef(null);
  const draggable = typeof onTitleDrag === 'function';
  const [dragging, setDragging] = useState(false);

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTitleDrag(Math.max(0, Math.min(95, x)), Math.max(0, Math.min(90, y)));
  };

  const startDrag = (e) => {
    if (!draggable) return;
    e.preventDefault();
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const endDrag = (e) => {
    setDragging(false);
    e.currentTarget?.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl overflow-hidden h-full w-full ${compact ? '' : 'aspect-[4/5]'}`}
      style={{ background: 'transparent' }}
    >
      {/* Editorial title — draggable when onTitleDrag is provided */}
      <div
        className={`absolute z-20 px-2 ${draggable ? 'cursor-move touch-none' : 'pointer-events-none'} ${dragging ? 'ring-2 ring-violet-400/60 rounded-xl' : ''}`}
        style={{
          left: `${title_x}%`,
          top: `${title_y}%`,
          maxWidth: `${100 - title_x}%`,
        }}
        onPointerDown={startDrag}
        onPointerMove={dragging ? handlePointerMove : undefined}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <h1
          className="font-display leading-[0.85] tracking-tight break-words select-none"
          style={{
            color: text_color,
            fontSize: compact ? 'clamp(32px,10vw,68px)' : 'clamp(56px,16vw,120px)',
          }}
        >
          {line1}
        </h1>
        <h1
          className="font-display leading-[0.85] tracking-tight break-words select-none"
          style={{
            color: text_color,
            fontSize: compact ? 'clamp(32px,10vw,68px)' : 'clamp(56px,16vw,120px)',
          }}
        >
          {line2}
        </h1>
      </div>

      {imageUrl && (
        <>
          {/* Glow halo */}
          <div
            className="absolute inset-0 z-[8] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 55%, rgba(196,181,253,${0.6 * (glow / 100)}) 0%, rgba(186,230,253,${0.3 * (glow / 100)}) 30%, transparent 60%)`,
              filter: `blur(${20 + glow * 0.4}px)`,
            }}
          />
          <img
            src={imageUrl}
            alt="hero"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain object-bottom z-[10] pointer-events-none"
            style={{
              filter: `
                brightness(${brightness}%)
                contrast(${contrast}%)
                saturate(${saturation}%)
                drop-shadow(0 0 ${blur * 0.6}px rgba(255,255,255,${blur / 200}))
                drop-shadow(0 0 ${10 + glow * 0.6}px rgba(196,181,253,${0.3 + glow / 200}))
                drop-shadow(0 0 ${glow * 0.4}px rgba(186,230,253,${glow / 250}))
                drop-shadow(0 ${10 + shadow * 0.2}px ${20 + shadow * 0.6}px rgba(0,0,0,${shadow / 120}))
              `,
            }}
          />
        </>
      )}

      {/* Bottom fade — soft pastel to blend with dreamy app background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20 z-[18] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(237,233,254,0.6))' }}
      />
    </div>
  );
}