#!/usr/bin/env python3
"""phones.py [NN ...] — renders assets/phones/NN.webp: each build as it looks on a 390×844 phone.
Headless Chrome clamps narrow windows, so the demo is framed in a 390px <iframe> served from this
site's root (same origin, so the demo lock sees a permitted referrer). Shot at 1.5× and cropped.
Run after tools/demos.js. No args = every build in data/builds.js."""
import http.server, json, subprocess, sys, tempfile, threading, time, shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'phones'; OUT.mkdir(parents=True, exist_ok=True)
W, H, DPR = 390, 844, 1.5
C = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
builds = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./data/builds.js").map(x=>({n:x.n,slug:x.slug}))))'], cwd=ROOT))
want = set(int(a) for a in sys.argv[1:])
if want: builds = [x for x in builds if x['n'] in want]

class Q(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=str(ROOT), **k)
    def log_message(s, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Q); threading.Thread(target=srv.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{srv.server_address[1]}'
for x in builds:
    nn = f"{x['n']:02d}"; harness = ROOT / f'_phone-{nn}.html'
    harness.write_text(f'<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><iframe src="{base}/demos/{x["slug"]}/" style="width:{W}px;height:{H}px;border:0;display:block"></iframe>')
    d = tempfile.mkdtemp(); png = Path(d) / 'shot.png'
    p = subprocess.Popen([C, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--force-device-scale-factor={DPR}', f'--window-size={W + 60},{H + 60}',
                          f'--user-data-dir={d}/p', f'--screenshot={png}', f'{base}/_phone-{nn}.html'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(30):
        time.sleep(1)
        if png.exists() and png.stat().st_size > 0:
            a = png.stat().st_size; time.sleep(1)
            if png.stat().st_size == a: break
    p.kill(); p.wait(); harness.unlink(missing_ok=True)
    if png.exists() and png.stat().st_size > 0:
        im = Image.open(png).convert('RGB').crop((0, 0, int(W * DPR), int(H * DPR)))
        im.save(OUT / f'{nn}.webp', 'WEBP', quality=82, method=6); print('ok', nn, x['slug'], im.size, (OUT / f'{nn}.webp').stat().st_size)
    else: print('FAIL', nn, x['slug'])
    shutil.rmtree(d, ignore_errors=True)
srv.shutdown()
