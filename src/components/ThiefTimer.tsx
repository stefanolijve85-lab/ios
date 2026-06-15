'use client';
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { MAX_RUN_MS } from '@/lib/constants';
import { clock } from '@/lib/format';

export default function ThiefTimer() {
  const { stateRef, serverNow } = useGame();
  const timeRef = useRef<HTMLDivElement>(null);
  const [warn, setWarn] = useState(false);
  const [label, setLabel] = useState('THIEVES ARRIVING IN');

  useEffect(() => {
    let raf = 0;
    let lastWarn = false;
    let lastLabel = '';
    const loop = () => {
      const s = stateRef.current;
      let text = '00:00';
      let w = false;
      let lbl = 'THIEVES ARRIVING IN';

      if (s?.phase === 'running' && s.startTime) {
        const remaining = MAX_RUN_MS - (serverNow() - s.startTime);
        text = clock(remaining);
        w = remaining <= 5000;
      } else if (s?.phase === 'crashed') {
        text = 'STOLEN'; w = true; lbl = 'THE VAULT WAS';
      } else if (s?.phase === 'betting') {
        const remaining = (s.phaseEndsAt ?? 0) - serverNow();
        text = clock(remaining); lbl = 'VAULT CLOSES IN';
      }

      if (timeRef.current) timeRef.current.textContent = text;
      if (w !== lastWarn) { setWarn(w); lastWarn = w; }
      if (lbl !== lastLabel) { setLabel(lbl); lastLabel = lbl; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [serverNow, stateRef]);

  return (
    <div className={`thief${warn ? ' warn' : ''}`}>
      <div className="lbl">🚨 {label}</div>
      <div className="time" ref={timeRef}>00:00</div>
    </div>
  );
}
