import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { SLOTS } from '../src/render/assets';
import { CLIP_NAMES } from '../src/render/character';

const root = new URL('../public/models/', import.meta.url);

describe('model slots', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
  test('every slot is filled by a GLB file listed in the manifest', () => {
    for (const s of SLOTS.filter((d) => !d.optional)) {
      const e = manifest.slots[s.slot];
      expect(e, s.slot).toBeTruthy();
      expect(['placeholder', 'final']).toContain(e.status);
      const f = new URL(e.file, root);
      expect(existsSync(f), e.file).toBe(true);
      expect(statSync(f).size).toBeGreaterThan(1000);
      expect(readFileSync(f).subarray(0, 4).toString()).toBe('glTF');
    }
  });
  test('character GLBs contain every animation clip the game uses', () => {
    for (const s of SLOTS.filter((d) => d.group === 'character')) {
      const buf = readFileSync(new URL(manifest.slots[s.slot].file, root));
      const jsonLen = buf.readUInt32LE(12);
      const gltf = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
      const names = (gltf.animations ?? []).map((a: { name: string }) => a.name);
      if (gltf.nodes.some((n: { name?: string }) => n.name === 'Hips')) {
        // auto-rigged final model (Meshy/Higgsfield): needs its idle clip; walk/run/etc. are shared at load time from anim.* slots
        expect(names.some((n: string) => /\|Idle\|/.test(n) || n === 'idle'), `${s.slot} idle clip`).toBe(true);
        expect(manifest.slots['anim.run'], 'anim.run donor for auto-rigged characters').toBeTruthy();
        continue;
      }
      for (const c of CLIP_NAMES) expect(names, `${s.slot} clip ${c}`).toContain(c);
      expect(gltf.nodes.some((n: { name?: string }) => n.name === 'carry'), `${s.slot} carry node`).toBe(true);
    }
  });
});
