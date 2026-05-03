import React, { useState, useRef, useEffect } from 'react';
import GlassButton from '@/components/ui/GlassButton';

/**
 * CropTool — drag a rectangle on the image to select the area, returns a PNG blob.
 */
export default function CropTool({ imageUrl, onComplete, onCancel }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); // percentages
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    const handler = () => {
      if (imgRef.current) {
        setImgSize({
          w: imgRef.current.clientWidth,
          h: imgRef.current.clientHeight,
        });
      }
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [imageUrl]);

  const onPointerDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    setDrag({
      mode,
      startX: e.clientX,
      startY: e.clientY,
      rect,
      crop: { ...crop },
    });
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / drag.rect.width;
    const dy = (e.clientY - drag.startY) / drag.rect.height;
    let next = { ...drag.crop };

    if (drag.mode === 'move') {
      next.x = Math.min(Math.max(0, drag.crop.x + dx), 1 - drag.crop.w);
      next.y = Math.min(Math.max(0, drag.crop.y + dy), 1 - drag.crop.h);
    } else if (drag.mode === 'br') {
      next.w = Math.min(Math.max(0.1, drag.crop.w + dx), 1 - drag.crop.x);
      next.h = Math.min(Math.max(0.1, drag.crop.h + dy), 1 - drag.crop.y);
    } else if (drag.mode === 'tl') {
      const newX = Math.min(Math.max(0, drag.crop.x + dx), drag.crop.x + drag.crop.w - 0.1);
      const newY = Math.min(Math.max(0, drag.crop.y + dy), drag.crop.y + drag.crop.h - 0.1);
      next.x = newX;
      next.y = newY;
      next.w = drag.crop.w - (newX - drag.crop.x);
      next.h = drag.crop.h - (newY - drag.crop.y);
    }
    setCrop(next);
  };

  const onPointerUp = () => setDrag(null);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [drag]);

  const handleConfirm = async () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await new Promise((res) => { img.onload = res; });

    const sx = crop.x * img.naturalWidth;
    const sy = crop.y * img.naturalHeight;
    const sw = crop.w * img.naturalWidth;
    const sh = crop.h * img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.toBlob((blob) => {
      if (blob) onComplete(blob);
    }, 'image/png');
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-black/80 select-none"
        style={{ touchAction: 'none' }}
      >
        <img ref={imgRef} src={imageUrl} alt="" className="w-full block pointer-events-none" />

        {/* Dim overlay outside crop */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.55) ${crop.x * 100}%, transparent ${crop.x * 100}%, transparent ${(crop.x + crop.w) * 100}%, rgba(0,0,0,0.55) ${(crop.x + crop.w) * 100}%, rgba(0,0,0,0.55) 100%)
          `,
        }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: 0, height: `${crop.y * 100}%`, background: 'rgba(0,0,0,0.55)',
        }} />
        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: `${(crop.y + crop.h) * 100}%`, bottom: 0, background: 'rgba(0,0,0,0.55)',
        }} />

        {/* Crop box */}
        <div
          onPointerDown={(e) => onPointerDown(e, 'move')}
          className="absolute border-2 border-white cursor-move"
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.w * 100}%`,
            height: `${crop.h * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
          }}
        >
          <div
            onPointerDown={(e) => onPointerDown(e, 'tl')}
            className="absolute -left-2 -top-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize"
          />
          <div
            onPointerDown={(e) => onPointerDown(e, 'br')}
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full cursor-nwse-resize"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <GlassButton variant="ghost" onClick={onCancel} className="flex-1">Back</GlassButton>
        <GlassButton variant="primary" onClick={handleConfirm} className="flex-1">Use Crop</GlassButton>
      </div>
    </div>
  );
}