'use client';

import { useState } from 'react';
import type { FeatureFlag } from '@/lib/types';

export function FeatureFlags({ flags }: { flags: FeatureFlag[] }) {
  const [state, setState] = useState(flags);

  const toggle = (key: string) =>
    setState((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));

  return (
    <div className="flex flex-col gap-2">
      {state.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-4 rounded-xl bg-elevated/40 p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">{f.label}</p>
            <p className="text-xs text-muted">{f.description}</p>
            {f.enabled && f.rollout < 100 && (
              <p className="mt-1 text-[11px] text-warning">Rollout: {f.rollout}%</p>
            )}
          </div>
          <button
            role="switch"
            aria-checked={f.enabled}
            aria-label={`Toggle ${f.label}`}
            onClick={() => toggle(f.key)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${f.enabled ? 'bg-brand' : 'bg-elevated'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                f.enabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
