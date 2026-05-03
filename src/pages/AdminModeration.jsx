import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { synkify } from '@/api/synkifyClient';
import { useNavigate } from 'react-router-dom';
import ThreeBackground from '@/components/ThreeBackground';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { Shield, CheckCircle2, Trash2, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const REASON_LABEL = {
  spam: 'Spam',
  nsfw: '18+',
  hate: 'Hate',
  off_topic: 'Off-topic',
  other: 'Other',
};

export default function AdminModeration() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    synkify.auth.me().then(u => {
      setUser(u);
      setAuthChecked(true);
      if (u?.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/');
      }
    });
  }, [navigate]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => synkify.entities.Report.filter({ status: 'open' }, '-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const getEntity = (type) =>
    type === 'feedpost' ? synkify.entities.FeedPost :
    type === 'comment' ? synkify.entities.Comment :
    type === 'mission' ? synkify.entities.Mission : null;

  const dismissReport = async (reportId) => {
    await synkify.entities.Report.update(reportId, { status: 'dismissed' });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    toast.success('Report dismissed');
  };

  const removeContent = async (report) => {
    const entity = getEntity(report.target_type);
    if (entity) {
      try { await entity.update(report.target_id, { moderation_status: 'blocked' }); } catch {}
    }
    await synkify.entities.Report.update(report.id, { status: 'actioned' });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    toast.success('Content removed');
  };

  const approveContent = async (report) => {
    const entity = getEntity(report.target_type);
    if (entity) {
      try { await entity.update(report.target_id, { moderation_status: 'approved' }); } catch {}
    }
    await synkify.entities.Report.update(report.id, { status: 'reviewed' });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    toast.success('Content approved');
  };

  if (!authChecked || user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <ThreeBackground />
      <div className="relative z-10 px-6 pt-14 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-heading mb-1">Admin</p>
          <h1 className="font-display text-4xl tracking-wide uppercase flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-500" />
            Moderation Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{reports.length} open reports</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : reports.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-heading font-semibold">All clear!</p>
            <p className="text-sm text-muted-foreground">No open reports right now.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <GlassCard key={r.id} variant="strong" className="p-4" animate={false}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="glass-subtle rounded-full px-2 py-0.5 text-[10px] font-heading uppercase">
                      {r.target_type}
                    </span>
                    <span className="bg-pink-100 text-pink-600 rounded-full px-2 py-0.5 text-[10px] font-heading uppercase">
                      {REASON_LABEL[r.reason] || r.reason}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {r.created_date ? format(new Date(r.created_date), 'MMM d, HH:mm') : ''}
                  </span>
                </div>

                {r.snapshot && (
                  <div className="glass-subtle rounded-xl p-3 mb-3">
                    <p className="text-xs text-foreground italic">"{r.snapshot}"</p>
                  </div>
                )}

                {r.note && (
                  <p className="text-[11px] text-muted-foreground mb-2">
                    <span className="font-heading font-semibold">Reporter note:</span> {r.note}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mb-3">
                  Reported by: {r.reporter_email}
                </p>

                <div className="flex gap-2">
                  <GlassButton variant="ghost" onClick={() => approveContent(r)} className="flex-1 py-2 text-xs flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </GlassButton>
                  <GlassButton variant="ghost" onClick={() => dismissReport(r.id)} className="flex-1 py-2 text-xs flex items-center justify-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" /> Dismiss
                  </GlassButton>
                  <GlassButton variant="primary" onClick={() => removeContent(r)} className="flex-1 py-2 text-xs flex items-center justify-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </GlassButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
