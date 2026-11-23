#!/usr/bin/env python3
"""Render the example calls in tools/voice/calls.js to audio and a cue sheet.

  python3 tools/voice/render.py <models-dir> [--check]

<models-dir> holds kokoro-v1.0.onnx and voices-v1.0.bin (Kokoro, an open model, runs on this machine: no paid
credits). With --check and a sherpa-onnx whisper folder in <models-dir>, each clip is transcribed back and compared
with the words it was given.

Writes one mp3 per part of a call (the opening, then one per answer the visitor can pick) to assets/voice/<call>/ and
data/voice-cues.json: for every line its start, its length and a start time for each word, plus a 40 Hz loudness
curve for the whole part so the page can draw the waveform without decoding audio.
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS = sys.argv[1]
CHECK = '--check' in sys.argv
SR = 24000
ENV_HZ = 40

calls = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tools/voice/calls.js")))'], cwd=ROOT))
k = Kokoro(os.path.join(MODELS, 'kokoro-v1.0.onnx'), os.path.join(MODELS, 'voices-v1.0.bin'))

asr = None
if CHECK:
    import sherpa_onnx
    d = os.path.join(MODELS, 'sherpa-onnx-whisper-base.en') + '/'
    R = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + 'base.en-encoder.int8.onnx', decoder=d + 'base.en-decoder.int8.onnx', tokens=d + 'base.en-tokens.txt', num_threads=4)
    def asr(a):
        s = R.create_stream(); s.accept_waveform(SR, a.astype('float32')); R.decode_stream(s); return s.result.text.strip()

def rms_frames(a, hz):
    n = SR // hz
    m = len(a) // n
    return np.sqrt((a[:m * n].reshape(m, n) ** 2).mean(axis=1) + 1e-12) if m else np.zeros(0)

def trim(a):
    e = rms_frames(a, 100)
    on = np.where(e > e.max() * 0.04)[0]
    if not len(on): return a
    s = max(0, on[0] * 240 - 480); t = min(len(a), (on[-1] + 1) * 240 + 1200)
    a = a[s:t].copy()
    f = 240
    a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    return a

def ff(a, filt):
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, 'i.wav'), os.path.join(td, 'o.wav')
        sf.write(i, a, SR)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', filt, '-ar', str(SR), '-ac', '1', o])
        b, _ = sf.read(o, dtype='float32')
        return b

def level(a, db):
    r = np.sqrt((a ** 2).mean() + 1e-12)
    a = a * (10 ** (db / 20) / r)
    p = np.abs(a).max()
    return a * (0.97 / p) if p > 0.97 else a

def silence(sec): return np.zeros(int(SR * sec), dtype='float32')

def ringback():
    def burst(sec):
        t = np.arange(int(SR * sec)) / SR
        b = 0.5 * (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t))
        f = int(SR * 0.012); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
        return b.astype('float32')
    r = np.concatenate([burst(0.4), silence(0.2), burst(0.4)])
    return level(ff(r, 'highpass=f=300,lowpass=f=3400'), -27)

def weight(w):
    core = re.sub(r'[^0-9A-Za-z£.]', '', w)
    digits = sum(c.isdigit() for c in core)
    return max(2, (len(core) - digits) + digits * 4)

def word_times(text, a):
    """A start time for each shown word. Speech is split at its pauses and the words at their punctuation; when the
    two counts agree the words are placed phrase by phrase, otherwise they are spread across the whole line."""
    words = text.split()
    e = rms_frames(a, 100)
    loud = e > e.max() * 0.05
    segs, s = [], None
    for i, v in enumerate(loud):
        if v and s is None: s = i
        if not v and s is not None: segs.append([s, i]); s = None
    if s is not None: segs.append([s, len(loud)])
    merged = []
    for g in segs:
        if merged and g[0] - merged[-1][1] < 13: merged[-1][1] = g[1]
        else: merged.append(g)
    phrases, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r'[.,?!:]$', w): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    if len(merged) != len(phrases):
        merged = [[merged[0][0] if merged else 0, merged[-1][1] if merged else len(loud)]]
        phrases = [words]
    def place(segs, phs):
        out = []
        for (s0, s1), ph in zip(segs, phs):
            ws = [weight(w) for w in ph]; tot = sum(ws); acc = 0
            for w, x in zip(ph, ws):
                out.append(round((s0 + (s1 - s0) * acc / tot) / 100, 2)); acc += x
        return out
    # a pause inside a phrase can pair the wrong words with the wrong stretch of speech: if any phrase would be
    # spoken more than three times slower than the line as a whole, spread the words across the whole line instead
    whole = [[merged[0][0], merged[-1][1]]]
    pace = (whole[0][1] - whole[0][0]) / max(1, sum(weight(w) for w in words))
    if any((s1 - s0) / sum(weight(w) for w in ph) > 3 * pace for (s0, s1), ph in zip(merged, phrases)):
        merged, phrases = whole, [words]
    return place(merged, phrases), len(merged) > 1

def norm(s): return re.sub(r'[^a-z0-9 ]', '', s.lower().replace('-', ' ').replace('’', '').replace("'", '')).split()

cues, problems, total = {}, [], 0
ring = ringback()
for c in calls:
    cid = c['id']; os.makedirs(os.path.join(ROOT, 'assets/voice', cid), exist_ok=True)
    parts = [('open', c['open'])] + [(p['key'], p['lines']) for p in c['paths']]
    cues[cid] = {}
    for key, lines in parts:
        buf, t, out_lines, prev = [], 0.0, [], None
        def push(a):
            global t
            buf.append(a); t += len(a) / SR
        if key == 'open': push(silence(0.25)); ring_at = t; push(ring); push(silence(0.55))
        else: push(silence(0.12))
        for ln in lines:
            who = ln['who']; say = ln.get('say', ln['text'])
            raw, _ = k.create(say, voice=c['voices'][who], speed=1.0 if who == 'agent' else 1.06, lang='en-gb')
            a = trim(np.asarray(raw, dtype='float32'))
            if asr:
                got, want = norm(asr(a)), norm(say)
                miss = [w for w in want if w not in got]
                if len(miss) > max(1, len(want) // 6): problems.append(f'{cid}/{ln["id"]}: wanted "{say}" heard "{" ".join(got)}"')
            if who == 'caller': a = level(ff(a, 'highpass=f=320,lowpass=f=3300,acompressor=threshold=-20dB:ratio=3:attack=5:release=80'), -21.5)
            else: a = level(ff(a, 'highpass=f=70'), -19)
            if prev: push(silence(0.5 if who == 'agent' else 0.34))
            wt, aligned = word_times(ln['text'], a)
            out_lines.append({'id': ln['id'], 't': round(t, 2), 'd': round(len(a) / SR, 2), 'w': wt})
            push(a); prev = who
        push(silence(0.35))
        mix = np.concatenate(buf)
        env = rms_frames(mix, ENV_HZ)
        env = np.clip(np.sqrt(env / 0.16) * 35, 0, 35).astype(int)
        with tempfile.TemporaryDirectory() as td:
            w = os.path.join(td, 'p.wav'); sf.write(w, mix, SR)
            mp3 = os.path.join(ROOT, 'assets/voice', cid, key + '.mp3')
            subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w, '-c:a', 'libmp3lame', '-b:a', '56k', '-ac', '1', '-ar', str(SR), '-map_metadata', '-1', mp3])
            total += os.path.getsize(mp3)
        part = {'len': round(len(mix) / SR, 2), 'env': ''.join('0123456789abcdefghijklmnopqrstuvwxyz'[v] for v in env), 'lines': out_lines}
        if key == 'open': part['ring'] = [round(ring_at, 2), round(ring_at + len(ring) / SR, 2)]
        cues[cid][key] = part
        print(f'{cid}/{key}: {part["len"]}s, {len(out_lines)} lines')

with open(os.path.join(ROOT, 'data/voice-cues.json'), 'w') as f:
    json.dump({'hz': ENV_HZ, 'calls': cues}, f, separators=(',', ':'))
print(f'audio: {total / 1024:.0f} KB')
if CHECK: print('check:', len(problems), 'clips to listen to'); [print(' ', p) for p in problems]
