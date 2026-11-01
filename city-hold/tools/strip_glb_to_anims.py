"""Keep only the skeleton nodes and animations of a GLB (drops meshes, materials, textures, images).
usage: python3 tools/strip_glb_to_anims.py in.glb out.glb"""
import json, struct, sys

def main(src, dst):
    b = open(src, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl])
    bin_ = b[20 + jl + 8:]
    for n in j['nodes']:
        n.pop('mesh', None); n.pop('skin', None)
    for k in ('meshes', 'materials', 'textures', 'images', 'samplers', 'skins'):
        j.pop(k, None)
    used = sorted({s[k] for a in j.get('animations', []) for s in a['samplers'] for k in ('input', 'output')})
    out = bytearray(); views = []; accs = []; remap = {}
    for i in used:
        a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
        off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        comp = {5126: 4, 5123: 2, 5125: 4, 5121: 1}[a['componentType']]
        ncomp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        size = a['count'] * comp * ncomp
        while len(out) % 4: out.append(0)
        views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': size}); out += bin_[off:off + size]
        na = dict(a); na['bufferView'] = len(views) - 1; na.pop('byteOffset', None); remap[i] = len(accs); accs.append(na)
    for a in j.get('animations', []):
        for s in a['samplers']: s['input'] = remap[s['input']]; s['output'] = remap[s['output']]
    j['accessors'] = accs; j['bufferViews'] = views
    while len(out) % 4: out.append(0)
    j['buffers'] = [{'byteLength': len(out)}]
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    total = 12 + 8 + len(js) + 8 + len(out)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(out), 0x004E4942)); f.write(out)

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
