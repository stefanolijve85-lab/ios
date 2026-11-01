// Put a final GLB into a model slot: copies it to public/models/final/<slot>.glb and marks the slot "final" in the manifest.
// usage: node tools/install-model.cjs prop.fountain path/to/model.glb ["note"]
const fs = require('fs'); const path = require('path');
const [, , slot, src, note] = process.argv;
if (!slot || !src) { console.error('usage: node tools/install-model.cjs <slot> <file.glb> ["note"]'); process.exit(1); }
const buf = fs.readFileSync(src);
if (buf.toString('ascii', 0, 4) !== 'glTF') { console.error(src + ' is not a binary glTF (.glb)'); process.exit(1); }
const root = path.join(__dirname, '..', 'public', 'models');
const man = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
fs.mkdirSync(path.join(root, 'final'), { recursive: true });
const file = `final/${slot.replace(/[^a-z0-9._-]/gi, '_')}.glb`;
fs.writeFileSync(path.join(root, file), buf);
man.slots[slot] = { file, status: 'final', note: note || `installed ${new Date().toISOString().slice(0, 10)} from ${path.basename(src)}` };
fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(man, null, 2) + '\n');
console.log(`${slot} -> public/models/${file} (${(buf.length / 1024).toFixed(0)} KB), status final`);
