#!/usr/bin/env python3
"""Shrink the embedded textures of a .glb: every image is resized to at most MAX px and re-encoded
(JPEG for colour maps, which keeps them small; PNG kept only for images with transparency).
usage: python3 tools/shrink_glb.py in.glb out.glb [max_px=1024]"""
import io, json, struct, sys
from PIL import Image

def read_glb(path):
    b = open(path, 'rb').read()
    magic, ver, length = struct.unpack_from('<III', b, 0)
    assert magic == 0x46546C67, 'not a glb'
    off = 12; js = None; bin_ = b''
    while off < length:
        clen, ctype = struct.unpack_from('<II', b, off); off += 8
        chunk = b[off:off + clen]; off += clen
        if ctype == 0x4E4F534A: js = json.loads(chunk)
        elif ctype == 0x004E4942: bin_ = chunk
    return js, bin_

def write_glb(path, js, bin_):
    j = json.dumps(js, separators=(',', ':')).encode()
    j += b' ' * ((4 - len(j) % 4) % 4)
    bin_ += b'\0' * ((4 - len(bin_) % 4) % 4)
    total = 12 + 8 + len(j) + 8 + len(bin_)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(j), 0x4E4F534A)); f.write(j)
        f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)

def main():
    src, dst = sys.argv[1], sys.argv[2]; mx = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
    js, bin_ = read_glb(src)
    views = js['bufferViews']
    blobs = [bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in views]
    for img in js.get('images', []):
        if 'bufferView' not in img: continue
        data = blobs[img['bufferView']]
        im = Image.open(io.BytesIO(data)); im.load()
        if max(im.size) > mx: im = im.resize((min(mx, im.width), min(mx, im.height)), Image.LANCZOS)
        out = io.BytesIO()
        alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
        if alpha: im.save(out, 'PNG', optimize=True); img['mimeType'] = 'image/png'
        else: im.convert('RGB').save(out, 'JPEG', quality=85); img['mimeType'] = 'image/jpeg'
        blobs[img['bufferView']] = out.getvalue()
    # repack every buffer view (4-byte aligned) into one binary chunk
    new = b''
    for v, blob in zip(views, blobs):
        new += b'\0' * ((4 - len(new) % 4) % 4)
        v['byteOffset'] = len(new); v['byteLength'] = len(blob); new += blob
    js['buffers'] = [{'byteLength': len(new)}]
    write_glb(dst, js, new)
    print(f'{src}: {len(bin_) / 1e6:.1f} MB -> {len(new) / 1e6:.2f} MB')

if __name__ == '__main__':
    main()
