import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPOP_GROUPS } from '@/lib/kpopGroups';

/**
 * FocusPicker — choose K-pop group (required) and bias member (optional).
 * If no bias is chosen, the group itself is the focus subject.
 */
export default function FocusPicker({ group, bias, onChange }) {
  const selectedGroup = useMemo(
    () => KPOP_GROUPS.find((g) => g.name === group),
    [group]
  );

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-1.5 block">
          K-pop Group
        </label>
        <Select
          value={group || ''}
          onValueChange={(v) => onChange({ group: v, bias: '' })}
        >
          <SelectTrigger className="w-full bg-white/60 border-white/70 rounded-xl">
            <SelectValue placeholder="Select a group..." />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {KPOP_GROUPS.map((g) => (
              <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[10px] tracking-widest uppercase text-muted-foreground font-heading mb-1.5 block">
          Bias <span className="opacity-60 normal-case">(optional)</span>
        </label>
        <Select
          value={bias || '__none__'}
          onValueChange={(v) => onChange({ group, bias: v === '__none__' ? '' : v })}
          disabled={!selectedGroup}
        >
          <SelectTrigger className="w-full bg-white/60 border-white/70 rounded-xl disabled:opacity-50">
            <SelectValue placeholder={selectedGroup ? 'Whole group / no bias' : 'Pick a group first'} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__none__">Whole group (no bias)</SelectItem>
            {selectedGroup?.members.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}