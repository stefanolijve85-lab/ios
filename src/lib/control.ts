// Vertaalt een gewenste lampstand naar echte commando's per backend en stuurt
// die naar onze eigen API-routes. Draait de app in demo-modus (of mist de
// backend-config), dan gebeurt er niets op afstand en blijft alles lokaal.

import { AppConfig, Light, LightState } from './types';

function tuyaCommands(light: Light, s: LightState) {
  const dp = light.ref.dp || {};
  const cmds: { code: string; value: unknown }[] = [];
  cmds.push({ code: dp.switch || 'switch_led', value: s.on });
  // Stekkers/schakelaars kennen alleen aan/uit.
  if (!s.on || light.kind === 'onoff') return cmds;

  const brightCode = dp.bright || 'bright_value_v2';
  const v2 = (code: string) => code.endsWith('_v2');
  const useColour = light.kind === 'rgbcct' && s.mode === 'color';
  if (light.kind === 'rgbcct') {
    cmds.push({ code: dp.mode || 'work_mode', value: useColour ? 'colour' : 'white' });
  }
  // Tuya helderheid: v2 = 10..1000, v1 = 25..255
  const bright = v2(brightCode) ? Math.round(10 + (s.brightness / 100) * 990) : Math.round(25 + (s.brightness / 100) * 230);
  cmds.push({ code: brightCode, value: bright });
  if (light.kind === 'rgbcct' || light.kind === 'cct') {
    if (!useColour) {
      // 2700K..6500K -> 0..1000 (v1: 0..255), 0 = warm
      const tempCode = dp.temp || 'temp_value_v2';
      const frac = Math.max(0, Math.min(1, (s.kelvin - 2700) / (6500 - 2700)));
      cmds.push({ code: tempCode, value: Math.round(frac * (v2(tempCode) ? 1000 : 255)) });
    } else {
      const colourCode = dp.colour || 'colour_data_v2';
      const scale = v2(colourCode) ? 10 : 2.55;
      const v = { h: Math.round(s.hue), s: Math.round(s.saturation * scale), v: Math.round(s.brightness * scale) };
      cmds.push({ code: colourCode, value: v });
    }
  }
  return cmds;
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Fout ${res.status}`);
  }
  return json;
}

export async function applyToDevice(light: Light, next: LightState, config: AppConfig): Promise<void> {
  if (config.demoMode) return;

  if (light.backend === 'tuya') {
    if (!config.tuya) throw new Error('Tuya niet gekoppeld');
    await post('/api/tuya/command', {
      config: config.tuya,
      deviceId: light.ref.deviceId,
      zone: light.ref.zone,
      commands: tuyaCommands(light, next),
    });
    return;
  }

  if (light.backend === 'hue') {
    if (!config.hue) throw new Error('Hue niet gekoppeld');
    await post('/api/hue/light', {
      config: config.hue,
      hueId: light.ref.hueId,
      state: next,
    });
    return;
  }
  // demo: niets te doen
}
