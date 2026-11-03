// Reduce an image-to-3D .glb (TRELLIS / Hunyuan output: one or more indexed triangle primitives) to a game budget
// with meshoptimizer, and drop the vertices no longer used. Textures are left alone (tools/shrink_glb.py does those).
// usage: node tools/simplify_glb.mjs in.glb out.glb [targetTriangles=20000] [maxError=0.01]
import fs from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

const [, , src, dst, tgtArg, errArg] = process.argv;
if (!src || !dst) { console.error('usage: node tools/simplify_glb.mjs in.glb out.glb [targetTriangles] [maxError]'); process.exit(1); }
const target = Number(tgtArg || 20000), maxErr = Number(errArg || 0.01);

const b = fs.readFileSync(src);
if (b.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a glb');
let off = 12, js = null, bin = null;
while (off < b.length) {
  const len = b.readUInt32LE(off), type = b.readUInt32LE(off + 4); off += 8;
  const chunk = b.subarray(off, off + len); off += len;
  if (type === 0x4e4f534a) js = JSON.parse(chunk.toString('utf8')); else if (type === 0x004e4942) bin = chunk;
}
const COMP = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const read = (ai) => {
  const a = js.accessors[ai], bv = js.bufferViews[a.bufferView]; const T = COMP[a.componentType]; const n = NCOMP[a.type];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0);
  if (bv.byteStride && bv.byteStride !== n * T.BYTES_PER_ELEMENT) throw new Error('interleaved buffers are not handled');
  return { arr: new T(bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + a.count * n * T.BYTES_PER_ELEMENT)), n, a };
};

await MeshoptSimplifier.ready;
const total = js.meshes.reduce((s, m) => s + m.primitives.reduce((t, p) => t + js.accessors[p.indices].count / 3, 0), 0);
const parts = []; // new binary pieces: [Uint8Array, target, componentType, count, type, min?, max?]
const newAccessors = []; const newViews = [];
const addAccessor = (typed, ct, type, count, isIndex, mm) => {
  const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
  newViews.push({ bytes, target: isIndex ? 34963 : 34962 });
  newAccessors.push({ bufferView: newViews.length - 1, componentType: ct, count, type, ...(mm || {}) });
  return newAccessors.length - 1;
};
for (const mesh of js.meshes) for (const p of mesh.primitives) {
  const idx = read(p.indices).arr; const pos = read(p.attributes.POSITION).arr;
  const share = (idx.length / 3) / total; const want = Math.max(300, Math.round(target * share)) * 3;
  const indices = idx instanceof Uint32Array ? idx : Uint32Array.from(idx);
  const [simp, err] = MeshoptSimplifier.simplify(indices, pos, 3, want, maxErr, []);
  // keep only used vertices, in first-use order
  const remap = new Int32Array(pos.length / 3).fill(-1); let nv = 0;
  for (const i of simp) if (remap[i] < 0) remap[i] = nv++;
  const outIdx = new Uint32Array(simp.length); for (let k = 0; k < simp.length; k++) outIdx[k] = remap[simp[k]];
  const attrs = {};
  for (const [name, ai] of Object.entries(p.attributes)) {
    const { arr, n, a } = read(ai); const T = arr.constructor; const out = new T(nv * n);
    for (let v = 0; v < remap.length; v++) if (remap[v] >= 0) for (let c = 0; c < n; c++) out[remap[v] * n + c] = arr[v * n + c];
    let mm;
    if (name === 'POSITION') { const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (let v = 0; v < nv; v++) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], out[v * 3 + c]); mx[c] = Math.max(mx[c], out[v * 3 + c]); } mm = { min: mn, max: mx }; }
    attrs[name] = addAccessor(out, a.componentType, a.type, nv, false, mm);
  }
  p.indices = addAccessor(outIdx, 5125, 'SCALAR', outIdx.length, true);
  p.attributes = attrs;
  console.log(`primitive: ${idx.length / 3} -> ${outIdx.length / 3} triangles, ${pos.length / 3} -> ${nv} vertices (error ${err.toFixed(4)})`);
}
// images keep their original bytes
for (const im of js.images || []) {
  const bv = js.bufferViews[im.bufferView]; const s = bin.byteOffset + (bv.byteOffset || 0);
  newViews.push({ bytes: new Uint8Array(bin.buffer.slice(s, s + bv.byteLength)) }); im.bufferView = newViews.length - 1;
}
// pack the new buffer
let size = 0; const offsets = newViews.map((v) => { const o = size; size += Math.ceil(v.bytes.length / 4) * 4; return o; });
const out = new Uint8Array(size); newViews.forEach((v, i) => out.set(v.bytes, offsets[i]));
js.bufferViews = newViews.map((v, i) => ({ buffer: 0, byteOffset: offsets[i], byteLength: v.bytes.length, ...(v.target ? { target: v.target } : {}) }));
js.accessors = newAccessors; js.buffers = [{ byteLength: size }];
let j = Buffer.from(JSON.stringify(js)); j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + j.length + 8 + size, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(j.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(size, 0); bh.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(dst, Buffer.concat([head, jh, j, bh, Buffer.from(out)]));
console.log(`${dst}: ${(fs.statSync(dst).size / 1024).toFixed(0)} KB`);
