# usage: HF_TOKEN=... python tools/trellis/batch.py <out_dir>   (needs: pip install gradio_client; hosts huggingface.co + *.hf.space allowed)
# image-to-3D for every listed cut-out with TRELLIS.2 (Hugging Face ZeroGPU); skips finished ones, stops on quota
import os, shutil, sys, time
from gradio_client import Client, handle_file
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets'); OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/trellis_out'; os.makedirs(OUT, exist_ok=True)
jobs = [l.split() for l in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jobs.txt')) if l.strip() and not l.startswith('#')]
c = None
for name, img in jobs:
    dst = os.path.join(OUT, name + '.glb')
    if os.path.exists(dst): continue
    for attempt in range(2):
        try:
            if c is None: c = Client('microsoft/TRELLIS.2', verbose=False, token=os.environ.get('HF_TOKEN'))
            t = time.time(); c.predict(api_name='/start_session')
            pre = c.predict(handle_file(os.path.join(A, img)), api_name='/preprocess_image')
            c.predict(handle_file(pre['path'] if isinstance(pre, dict) else pre), 0, '1024', api_name='/image_to_3d')
            g = c.predict(100000, 1024, api_name='/extract_glb'); p = g[0] if isinstance(g, (list, tuple)) else g
            shutil.copy(p if isinstance(p, str) else p['path'], dst); print('OK', name, round(time.time() - t), 's', flush=True); break
        except Exception as e:
            msg = str(e); print('ERR', name, msg[:300], flush=True)
            if 'quota' in msg.lower(): print('QUOTA', flush=True); sys.exit(2)
            c = None; time.sleep(5)
print('DONE', flush=True)
