import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Undo2, Wand2, Eraser, RotateCcw } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import { synkify } from '@/api/synkifyClient';

/**
 * HeroEraser - fully client-side image eraser. Zero AI tokens.
 * - Magic mode: tap to flood-fill remove regions of similar color (great for backgrounds)
 * - Brush mode: drag to erase with a circle brush (size adjustable)
 * - Undo (last step) + Reset to original
 * - Re-uploads the resulting PNG with transparency to Synkify storage.
 */
export default function HeroEraser({ isOpen, imageUrl, onClose, onApply }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null); // visual brush cursor
  const originalImgRef = useRef(null); // Image element of the original
  const historyRef = useRef([]); // ImageData snapshots for undo
  const [mode, setMode] = useState('magic'); // 'magic' | 'brush'
  const [tolerance, setTolerance] = useState(28); // 0-100
  const [brushSize, setBrushSize] = useState(40);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    setReady(false);
    historyRef.current = [];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Cap working resolution for speed (longest edge 1024)
      const maxEdge = 1024;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      originalImgRef.current = img;
      setReady(true);
    };
    img.onerror = () => setReady(true);
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snap);
    if (historyRef.current.length > 12) historyRef.current.shift();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    const snap = historyRef.current.pop();
    ctx.putImageData(snap, 0, 0);
  };

  const resetAll = () => {
    const canvas = canvasRef.current;
    const img = originalImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    historyRef.current = [];
  };

  // Convert client (x,y) on the displayed canvas to canvas pixel coords
  const toCanvasCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x: Math.floor(x), y: Math.floor(y) };
  };

  // Flood-fill erase (magic wand). Iterative stack-based, with tolerance.
  const magicErase = (sx, sy) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
    const img = ctx.getImageData(0, 0, W, H);
    const data = img.data;
    const idx = (x, y) => (y * W + x) * 4;
    const i0 = idx(sx, sy);
    if (data[i0 + 3] === 0) return; // already transparent
    const r0 = data[i0], g0 = data[i0 + 1], b0 = data[i0 + 2];
    const tol2 = (tolerance * 2.55) * (tolerance * 2.55) * 3; // squared distance threshold (R+G+B channels)
    const visited = new Uint8Array(W * H);
    const stack = [sx, sy];
    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const flat = y * W + x;
      if (visited[flat]) continue;
      visited[flat] = 1;
      const i = flat * 4;
      if (data[i + 3] === 0) continue;
      const dr = data[i] - r0, dg = data[i + 1] - g0, db = data[i + 2] - b0;
      if (dr * dr + dg * dg + db * db > tol2) continue;
      data[i + 3] = 0;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    ctx.putImageData(img, 0, 0);
  };

  // Brush erase circle at canvas coords
  const brushErase = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // brushSize is in displayed pixels; convert to canvas pixels
    const rect = canvas.getBoundingClientRect();
    const radius = (brushSize / rect.width) * canvas.width;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Pointer handlers
  const drawingRef = useRef(false);
  const updateOverlay = (clientX, clientY) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    overlay.style.left = `${clientX - rect.left}px`;
    overlay.style.top = `${clientY - rect.top}px`;
  };

  const onPointerDown = (e) => {
    if (!ready) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    pushHistory();
    if (mode === 'magic') {
      magicErase(x, y);
    } else {
      drawingRef.current = true;
      brushErase(x, y);
    }
    updateOverlay(e.clientX, e.clientY);
  };

  const onPointerMove = (e) => {
    if (!ready) return;
    updateOverlay(e.clientX, e.clientY);
    if (mode !== 'brush' || !drawingRef.current) return;
    const { x, y } = toCanvasCoords(e.clientX, e.clientY);
    brushErase(x, y);
  };

  const onPointerUp = (e) => {
    drawingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleApply = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setSaving(false); return; }
      const file = new File([blob], 'hero-edited.png', { type: 'image/png' });
      const { file_url } = await synkify.integrations.Core.UploadFile({ file });
      setSaving(false);
      onApply(file_url);
    }, 'image/png');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-background flex flex-col"
          style={{ height: '100dvh' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 glass-strong border-b border-white/40 px-3 py-2 flex items-center justify-between"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
          >
            <button onClick={onClose} className="glass-subtle rounded-full p-1.5">
              <X className="w-4 h-4" />
            </button>
            <p className="font-heading text-xs font-bold uppercase tracking-wider">Erase Magic</p>
            <div className="flex gap-1.5">
              <button onClick={undo} className="glass-subtle rounded-full p-1.5" title="Undo">
                <Undo2 className="w-4 h-4" />
              </button>
              <button onClick={resetAll} className="glass-subtle rounded-full p-1.5" title="Reset">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Canvas area - checker pattern shows transparency */}
          <div className="flex-1 flex items-center justify-center p-3 min-h-0 relative">
            <div
              className="relative max-h-full max-w-full rounded-2xl overflow-hidden glass-subtle"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, rgba(196,181,253,0.18) 25%, transparent 25%, transparent 75%, rgba(196,181,253,0.18) 75%), linear-gradient(45deg, rgba(196,181,253,0.18) 25%, transparent 25%, transparent 75%, rgba(196,181,253,0.18) 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="block max-h-[58vh] max-w-full touch-none"
                style={{ cursor: mode === 'magic' ? 'crosshair' : 'none' }}
              />
              {/* Brush cursor overlay */}
              {mode === 'brush' && ready && (
                <div
                  ref={overlayRef}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-500/80"
                  style={{ width: brushSize, height: brushSize }}
                />
              )}
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Tools */}
          <div
            className="flex-shrink-0 px-4 pb-3 space-y-3"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {/* Mode toggle */}
            <div className="flex gap-2">
              <ModeButton active={mode === 'magic'} onClick={() => setMode('magic')} icon={Wand2} label="Magic Tap" />
              <ModeButton active={mode === 'brush'} onClick={() => setMode('brush')} icon={Eraser} label="Brush" />
            </div>

            {/* Settings */}
            {mode === 'magic' ? (
              <div className="glass-subtle rounded-2xl px-3 py-2">
                <div className="flex justify-between mb-1">
                  <span className="font-heading text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Tolerance</span>
                  <span className="font-heading text-[10px] tabular-nums">{tolerance}</span>
                </div>
                <input
                  type="range" min={5} max={80} value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Tap an area to erase similar colors. Lower = stricter.</p>
              </div>
            ) : (
              <div className="glass-subtle rounded-2xl px-3 py-2">
                <div className="flex justify-between mb-1">
                  <span className="font-heading text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Brush Size</span>
                  <span className="font-heading text-[10px] tabular-nums">{brushSize}px</span>
                </div>
                <input
                  type="range" min={10} max={120} value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Drag over the image to erase manually.</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-2">
              <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleApply}
                disabled={!ready || saving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Apply'}
              </GlassButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-2xl py-2.5 flex items-center justify-center gap-2 transition ${
        active
          ? 'bg-gradient-to-r from-violet-400 to-indigo-400 text-white shadow-md shadow-violet-300/40'
          : 'glass-subtle text-foreground'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-heading text-xs font-semibold">{label}</span>
    </button>
  );
}
