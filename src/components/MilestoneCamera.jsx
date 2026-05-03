import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, RotateCcw, Download } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import { synkify } from '@/api/synkifyClient';

export default function MilestoneCamera({ isOpen, onClose, goals = [] }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [captured, setCaptured] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(goals[0] || null);
  const [facingMode, setFacingMode] = useState('environment');
  const [uploading, setUploading] = useState(false);

  const activeGoals = goals.filter(g => g.status === 'active');

  const getStreak = (goal) => {
    if (!goal?.daily_checkins) return 0;
    const sorted = [...goal.daily_checkins]
      .filter(c => c.completed)
      .map(c => c.date)
      .sort()
      .reverse();
    let streak = 0;
    let current = new Date();
    for (const dateStr of sorted) {
      const d = new Date(dateStr);
      const diff = Math.floor((current - d) / 86400000);
      if (diff <= 1) { streak++; current = d; }
      else break;
    }
    return streak;
  };

  useEffect(() => {
    if (isOpen && !captured) startCamera();
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth, h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Draw video frame
    ctx.drawImage(video, 0, 0, w, h);

    // Iridescent overlay at bottom (soft pastel)
    const grad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    grad.addColorStop(0, 'rgba(196,181,253,0)');
    grad.addColorStop(1, 'rgba(196,181,253,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Streak badge
    const streak = getStreak(selectedGoal);
    const bx = w / 2, by = h - 80;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx - 110, by - 30, 220, 56, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(w * 0.045)}px "Space Grotesk", sans-serif`;
    ctx.fillText(`${streak} Day Streak`, bx, by + 4);

    const goalLabel = selectedGoal?.title || '';
    ctx.font = `${Math.round(w * 0.028)}px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(goalLabel, bx, by + 22);

    // SYNKIFY logo watermark
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold ${Math.round(w * 0.032)}px "Space Grotesk", sans-serif`;
    ctx.fillText('SYNKIFY', 20, 36);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  const save = async () => {
    if (!captured) return;
    setUploading(true);
    const blob = await (await fetch(captured)).blob();
    const file = new File([blob], 'milestone.jpg', { type: 'image/jpeg' });
    const { file_url } = await synkify.integrations.Core.UploadFile({ file });
    setUploading(false);
    onClose(file_url, selectedGoal);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: '#000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => { stopCamera(); onClose(null); }} className="glass rounded-full p-2">
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="font-heading font-bold text-white text-sm tracking-widest">MILESTONE CAM</span>
        {!captured && (
          <button onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')} className="glass rounded-full p-2">
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative overflow-hidden">
        {!captured ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        ) : (
          <img src={captured} alt="captured" className="w-full h-full object-cover" />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Goal selector */}
        {activeGoals.length > 1 && (
          <div className="absolute top-20 left-0 right-0 px-4 flex gap-2 overflow-x-auto no-scrollbar">
            {activeGoals.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-heading font-semibold text-white border transition-all ${
                  selectedGoal?.id === g.id
                    ? 'bg-violet-400/70 border-violet-200'
                    : 'bg-black/30 border-white/20'
                }`}
              >
                {g.title}
              </button>
            ))}
          </div>
        )}

        {/* Live streak overlay preview */}
        {!captured && selectedGoal && (
          <div className="absolute bottom-28 left-0 right-0 flex justify-center pointer-events-none">
            <div className="glass rounded-full px-5 py-2 text-center">
              <p className="text-white font-heading font-bold text-sm">{getStreak(selectedGoal)} Day Streak</p>
              <p className="text-white/70 text-[10px]">{selectedGoal.title}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-8 px-8">
        {!captured ? (
          <button
            onClick={capture}
            className="w-18 h-18 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        ) : (
          <div className="flex gap-4">
            <GlassButton variant="secondary" onClick={retake}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retake
            </GlassButton>
            <GlassButton variant="primary" onClick={save} disabled={uploading}>
              {uploading ? 'Saving...' : <><Download className="w-4 h-4 mr-2" /> Save</>}
            </GlassButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}
