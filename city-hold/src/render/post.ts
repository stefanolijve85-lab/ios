import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Blue-hour grade: cool shadows, warm highlights, soft vignette, light film grain.
const GradeShader = {
  name: 'CityHoldGrade',
  uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 cool = vec3(0.86, 0.94, 1.12), warm = vec3(1.18, 1.02, 0.80);
      c.rgb *= mix(cool, warm, smoothstep(0.04, 0.9, l));
      c.rgb = mix(vec3(l), c.rgb, 1.08);
      float d = distance(vUv, vec2(0.5, 0.45));
      c.rgb *= mix(0.62, 1.0, smoothstep(0.82, 0.28, d));
      c.rgb += (h(vUv * 913.0) - 0.5) * 0.012;
      gl_FragColor = c;
    }`,
};

export class Post {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  grade: ShaderPass;
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.75, 0.55, 0.82);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }
  setSize(w: number, h: number, pr: number) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); }
  render(t: number) { this.grade.uniforms.time.value = t % 100; this.composer.render(); }
  dispose() { this.composer.dispose(); }
}
