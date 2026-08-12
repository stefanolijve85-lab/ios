// Vertaalt een gewenste lampstand naar echte commando's per backend en stuurt
// die naar onze eigen API-routes. Draait de app in demo-modus (of mist de
// backend-config), dan gebeurt er niets op afstand en blijft alles lokaal.

import { AppConfig, Light, LightState } from './types';

function tuyaCommands(light: Light, s: LightState) {
  const dp = light.ref.dp || {};
  const cmds: { code: string; value: unknown }[] = [];
  cmds.push({ code: dp.switch || 'switch_led', value: s.on });
  if (!s.on) return cmds;
  cmds.push({ code: dp.mode || 'work_mode', value: s.mode === 'color' ? 'colour' : 'white' });
  // Tuya helderheid: 10..1000
  const bright = Math.round(10 + (s.brightness / 100) * 990);
  cmds.push({ code: dp.bright || 'bright_value_v2', value: bright });
  if (s.mode === 'white') {
    // 2700K..6500K -> 0..1000 (0 = warm, 1000 = koud)
    const temp = Math.round(Math.max(0, Math.min(1, (s.kelvin - 2700) / (6500 - 2700))) * 1000);
    cmds.push({ code: dp.temp || 'temp_value_v2', value: temp });
  } else {
    const v = { h: Math.round(s.hue), s: Math.round(s.saturation * 10), v: Math.round(s.brightness * 10) };
    cmds.push({ code: dp.colour || 'colour_data_v2', value: v });
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
