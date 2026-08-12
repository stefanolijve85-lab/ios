'use client';

import { useEffect } from 'react';
import { CloseIcon } from './icons';

export default function Sheet({
  title,
  onClose,
  children,
  headExtra,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headExtra?: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {headExtra}
            <button className="sheet-close" onClick={onClose} aria-label="Sluiten">
              <CloseIcon />
            </button>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
