import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import type { Rect } from '../maps/types';

// Rain-wet street: a planar reflection added on top of the lit cobbles. Reflections are broken up by the
// stone pattern and smeared vertically, which gives the long light streaks seen on wet streets.
const WetShader = {
  name: 'WetStreet',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    tStone: { value: null }, repeat: { value: new THREE.Vector2(20, 20) }, strength: { value: 0.85 },
  },
  vertexShader: `uniform mat4 textureMatrix; uniform vec2 repeat; varying vec4 vR; varying vec2 vUv; varying vec2 vBig;
    void main(){ vR = textureMatrix * vec4(position, 1.0); vUv = uv * repeat; vBig = uv * 3.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform sampler2D tStone; uniform float strength;
    varying vec4 vR; varying vec2 vUv; varying vec2 vBig;
    float n2(vec2 p){ return sin(p.x * 5.1 + sin(p.y * 3.7)) * 0.5 + sin(p.y * 4.3 + sin(p.x * 2.9)) * 0.5; }
    void main(){
      vec3 st = texture2D(tStone, vUv).rgb;
      float lum = dot(st, vec3(0.333));
      vec2 dist = (st.rg - vec2(0.5)) * 0.045;
      vec3 acc = vec3(0.0); float wsum = 0.0;
      float jit = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      for (int i = 0; i < 8; i++) {
        float k = (float(i) + jit) / 8.0;
        vec4 p = vR; p.xy += (dist + vec2((jit - 0.5) * 0.004, -k * 0.13)) * p.w; // long vertical smear: the golden streaks of images 01-03
        float w = 1.0 - k * 0.75;
        acc += texture2DProj(tDiffuse, p).rgb * w; wsum += w;
      }
      acc /= wsum;
      // keep mostly the bright light sources: dull facades should not wash the street out
      float peak = max(acc.r, max(acc.g, acc.b));
      acc *= smoothstep(0.08, 0.85, peak) * 1.3;
      acc = min(acc, vec3(0.9)); // controlled highlights: no blown-out puddles
      float puddle = smoothstep(-0.2, 0.6, n2(vBig * 2.0));
      float wet = strength * mix(0.35, 1.0, puddle) * mix(1.0, 0.55, smoothstep(0.25, 0.6, lum));
      gl_FragColor = vec4(acc * color * wet, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export function buildWetStreet(bounds: Rect, stone: THREE.Texture, pixelW: number, pixelH: number): Reflector {
  const w = bounds.x1 - bounds.x0 + 80, d = bounds.z1 - bounds.z0 + 80;
  const r = new Reflector(new THREE.PlaneGeometry(w, d), {
    textureWidth: Math.round(pixelW * 0.5), textureHeight: Math.round(pixelH * 0.5), color: 0xe0cfb4, multisample: 0, shader: WetShader,
  });
  const m = r.material as THREE.ShaderMaterial;
  m.uniforms.tStone.value = stone; m.uniforms.repeat.value.set(w / 3.5, d / 3.5);
  m.transparent = true; m.blending = THREE.AdditiveBlending; m.depthWrite = false;
  r.rotation.x = -Math.PI / 2;
  r.position.set((bounds.x0 + bounds.x1) / 2, 0.025, (bounds.z0 + bounds.z1) / 2);
  r.renderOrder = 1;
  return r;
}
