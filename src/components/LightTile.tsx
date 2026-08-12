'use client';

import { Light } from '@/lib/types';
import { lightColor, rgbCss } from '@/lib/color';
import { iconFor, ChevronIcon } from './icons';

export default function LightTile({
  light,
  onToggle,
  onOpen,
}: {
  light: Light;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { state } = light;
  const rgb = lightColor(state);
  const status = !state.on
    ? 'Uit'
    : state.mode === 'color'
      ? `${state.brightness}% · Kleur`
      : `${state.brightness}% · ${state.kelvin}K`;

  return (
    <button className={`tile ${state.on ? 'on' : ''}`} onClick={onToggle} aria-label={light.name}>
      {state.on && (
        <div
          className="glow"
          style={{
            background:
              state.mode === 'color'
                ? `radial-gradient(120% 120% at 30% 0%, ${rgbCss(rgb)} 0%, ${rgbCss(rgb, 0.35)} 55%, rgba(255,255,255,0.9) 100%)`
                : `linear-gradient(160deg, ${rgbCss(rgb)} 0%, #ffffff 100%)`,
          }}
        />
      )}
      <div className="row1">
        <div
          className="bulb"
          style={state.on ? { background: rgbCss(rgb), boxShadow: `0 0 18px ${rgbCss(rgb, 0.7)}` } : undefined}
        >
          {iconFor(light.icon, 20)}
        </div>
        <div
          className="expand"
          role="button"
          aria-label="Aanpassen"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <ChevronIcon />
        </div>
      </div>
      <div className="meta">
        <div className="name">{light.name}</div>
        <div className="status">{status}</div>
      </div>
    </button>
  );
}
