import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import FocusPicker from '@/components/FocusPicker';
import { synkify } from '@/api/synkifyClient';
import { Heart, Pencil, Check } from 'lucide-react';

export default function FocusManager({ user }) {
  const [editing, setEditing] = useState(false);
  const [group, setGroup] = useState(user?.favorite_group || '');
  const [bias, setBias] = useState(
    user?.favorite_idol && user.favorite_idol !== user.favorite_group
      ? user.favorite_idol
      : ''
  );
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => synkify.auth.updateMe({
      favorite_group: group,
      favorite_idol: bias || group,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  const subject = user?.favorite_idol || user?.favorite_group || 'Your focus';

  return (
    <GlassCard variant="strong" className="p-5 mb-4" animate={false}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading">My Focus</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="glass-subtle rounded-full p-1.5"
            aria-label="Edit focus"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="flex items-center gap-3">
          <Heart className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          <div>
            <p className="font-display text-lg text-foreground" style={{ fontWeight: 500 }}>{subject}</p>
            {user?.favorite_idol && user.favorite_idol !== user.favorite_group && (
              <p className="editorial-eyebrow mt-0.5">{user.favorite_group}</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <FocusPicker
            group={group}
            bias={bias}
            onChange={({ group: g, bias: b }) => { setGroup(g); setBias(b); }}
          />
          <div className="flex gap-2 mt-4">
            <GlassButton
              variant="ghost"
              onClick={() => {
                setGroup(user?.favorite_group || '');
                setBias(
                  user?.favorite_idol && user.favorite_idol !== user.favorite_group
                    ? user.favorite_idol
                    : ''
                );
                setEditing(false);
              }}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => saveMutation.mutate()}
              disabled={!group || saveMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Save
            </GlassButton>
          </div>
        </>
      )}
    </GlassCard>
  );
}