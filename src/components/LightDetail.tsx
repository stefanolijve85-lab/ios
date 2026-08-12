'use client';

import { useState } from 'react';
import { Light } from '@/lib/types';
import { useStore } from '@/lib/store';
import { lightColor, kelvinToRgb, rgbCss } from '@/lib/color';
import Sheet from './Sheet';
import ColorWheel from './ColorWheel';
import { VBrightness, HSlider } from './Sliders';
import { PowerIcon } from './icons';

export default function LightDetail({ light, onClose }: { light: Light; onClose: () => void }) {
  const { setLightState, toggleLight, renameLight, removeLight, rooms } = useStore();
  const s = light.state;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(light.name);
  const isColor = light.kind === 'rgbcct';
  const hasWhite = light.kind === 'rgbcct' || light.kind === 'cct';

  const color = lightColor({ ...s, on: true });
  const room = rooms.find((r) => r.id === light.roomId);

  const power = (
    <button
      className="sheet-close"
      onClick={() => toggleLight(light.id)}
      aria-label="Aan/uit"
      style={s.on ? { background: rgbCss(color), color: '#000' } : { color: 'var(--text-dim)' }}
    >
      <PowerIcon />
    </button>
  );

  const warm = kelvinToRgb(2700), cool = kelvinToRgb(6500);

  return (
    <Sheet title={light.name} onClose={onClose} headExtra={power}>
      <div style={{ color: 'var(--text-dim)', margin: '-6px 4px 14px', fontSize: 14, fontWeight: 500 }}>
        {room?.name} · {light.backend === 'demo' ? 'Demo' : light.backend === 'tuya' ? 'MiBoxer' : 'Hue'}
        {light.ref.zone ? ` · Zone ${light.ref.zone}` : ''}
      </div>

      {/* Helderheid */}
      <VBrightness
        value={s.brightness}
        color={s.on ? rgbCss(color) : 'rgba(120,120,128,0.5)'}
        onChange={(v) => setLightState(light.id, { brightness: v, on: true })}
      />

      {/* Wit / Kleur */}
      {isColor && (
        <div className="segmented">
          <button className={s.mode === 'white' ? 'active' : ''} onClick={() => setLightState(light.id, { mode: 'white', on: true })}>
            Wit
          </button>
          <button className={s.mode === 'color' ? 'active' : ''} onClick={() => setLightState(light.id, { mode: 'color', on: true })}>
            Kleur
          </button>
        </div>
      )}

      {isColor && s.mode === 'color' ? (
        <ColorWheel
          hue={s.hue}
          saturation={s.saturation}
          onChange={(hue, saturation) => setLightState(light.id, { hue, saturation, mode: 'color', on: true })}
        />
      ) : hasWhite ? (
        <div className="slider-row">
          <div className="lab"><span>Warm</span><span>{s.kelvin}K</span><span>Koel</span></div>
          <HSlider
            value={s.kelvin}
            min={2700}
            max={6500}
            track={`linear-gradient(90deg, ${rgbCss(warm)}, #fff, ${rgbCss(cool)})`}
            onChange={(kelvin) => setLightState(light.id, { kelvin, mode: 'white', on: true })}
          />
        </div>
      ) : null}

      {/* Naam / beheer */}
      {editing ? (
        <div>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Naam" />
          <button
            className="btn"
            onClick={() => {
              renameLight(light.id, name.trim() || light.name);
              setEditing(false);
            }}
          >
            Naam opslaan
          </button>
        </div>
      ) : (
        <button className="btn secondary" onClick={() => setEditing(true)}>
          Naam wijzigen
        </button>
      )}
      <button
        className="btn danger"
        onClick={() => {
          if (confirm(`"${light.name}" verwijderen?`)) {
            removeLight(light.id);
            onClose();
          }
        }}
      >
        Verwijderen
      </button>
    </Sheet>
  );
}
