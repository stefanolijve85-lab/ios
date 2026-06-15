'use client';
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';

export default function FlashBanner() {
  const { flash } = useGame();
  const [show, setShow] = useState<typeof flash>(null);

  useEffect(() => {
    if (!flash) return;
    setShow(flash);
    const t = setTimeout(() => setShow(null), 1600);
    return () => clearTimeout(t);
  }, [flash]);

  if (!show) return null;
  return (
    <>
      {show.kind === 'lose' && <div className="redflash" key={`r${show.key}`} />}
      <div className={`flash ${show.kind}`} key={show.key}>
        <div className="card">{show.text}</div>
      </div>
    </>
  );
}
