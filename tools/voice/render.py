#!/usr/bin/env python3
"""Mix the recorded lines of each example call in tools/voice/calls.js into one call recording, and write its cue sheet.

  python3 tools/voice/render.py [path/to/takes.mp3]

The lines were recorded with ElevenLabs (the v4 model, one British voice per person, chosen in calls.js) and joined
into one file, tools/voice/takes.mp3: every line in name order (boiler-a1 ... physio-c4), each followed by a second of
silence. tools/voice/takes.json gives where each line starts and how long it is (in samples), and the start of every
word as ElevenLabs' own transcription heard it, which is how the page lights the words as they are said.
To re-record a line: generate it again, rebuild takes.mp3 and takes.json, then run this.

Writes assets/voice/<call>/call.mp3 (one ring, the pick-up, then both sides of the call: the assistant clean, the
caller through a narrow phone line with a little line noise) and data/voice-cues.json: for each line its start, its
length and a start time for each word shown, plus a 40 Hz loudness curve so the page draws the waveform without
decoding the audio.
"""
import difflib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools/voice/takes.mp3')
SR = 44100
ENV_HZ = 40
GAP = {'agent': .55, 'caller': .36}   # silence before a line when calls.js gives no `gap`: the assistant takes a breath, people jump in

calls = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tools/voice/calls.js")))'], cwd=ROOT))
takes = json.load(open(os.path.join(ROOT, 'tools/voice/takes.json')))

def decode(path):
    out = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
    return np.frombuffer(out, dtype='<f4').copy()

def ff(a, filt):
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, 'i.wav'), os.path.join(td, 'o.wav')
        sf.write(i, a, SR, subtype='FLOAT')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', filt, '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_f32le', o])
        b, _ = sf.read(o, dtype='float32')
        return b

def rms_frames(a, hz):
    n = SR // hz
    m = len(a) // n
    return np.sqrt((a[:m * n].reshape(m, n) ** 2).mean(axis=1) + 1e-12) if m else np.zeros(0)

def level(a, db):
    """bring speech to a loudness (RMS of the voiced part only, so a long pause does not make a line louder)"""
    e = rms_frames(a, 100)
    v = e[e > e.max() * .1] if len(e) else e
    r = float(np.sqrt((v ** 2).mean())) if len(v) else 1e-6
    a = a * (10 ** (db / 20) / max(r, 1e-6))
    p = np.abs(a).max()
    return a * (.95 / p) if p > .95 else a

def trim(a):
    """cut the silence the take has before and after the words; returns the audio and how much was cut at the front"""
    e = rms_frames(a, 100)
    on = np.where(e > e.max() * .035)[0]
    if not len(on): return a, 0
    s = max(0, on[0] * 441 - 1300); t = min(len(a), (on[-1] + 1) * 441 + 5300)
    a = a[s:t].copy()
    f = 300
    a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    return a, s

def silence(sec): return np.zeros(int(round(SR * sec)), dtype='float32')

rng = np.random.default_rng(7)
def noise(sec, db):
    """line hiss: pink-ish noise, phone band"""
    n = int(round(SR * sec))
    w = rng.standard_normal(n + 64).astype('float32')
    p = np.convolve(w, np.ones(8, dtype='float32') / 8, mode='same')[:n]
    p = ff(p, 'highpass=f=300,lowpass=f=3400')
    r = np.sqrt((p ** 2).mean() + 1e-12)
    return (p * (10 ** (db / 20) / r)).astype('float32')

def ring():
    """one UK ring: 400 + 450 Hz, 0.4 s on, 0.2 s off, 0.4 s on, heard down the line"""
    def burst(sec):
        t = np.arange(int(SR * sec)) / SR
        b = .5 * (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t))
        f = int(SR * .012); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
        return b.astype('float32')
    r = np.concatenate([burst(.4), silence(.2), burst(.4)])
    return level(ff(r, 'highpass=f=300,lowpass=f=3400'), -28)

def click(db):
    """the receiver being picked up: a short knock, band limited"""
    n = int(SR * .03)
    k = rng.standard_normal(n).astype('float32') * np.exp(-np.arange(n) / (SR * .004)).astype('float32')
    k = ff(k, 'highpass=f=250,lowpass=f=3000')
    return (k * (10 ** (db / 20) / (np.abs(k).max() + 1e-9))).astype('float32')

# the assistant is the business's own line: clean, a little compressed. The caller is a mobile on a phone line:
# narrow band, squashed, and resampled to 8 kHz and back so it has the dull edge of a real call
AGENT = 'highpass=f=85,lowpass=f=7600,acompressor=threshold=-21dB:ratio=2.2:attack=8:release=140:makeup=1'
CALLER = 'highpass=f=290,lowpass=f=3450,aresample=8000,aresample=44100,acompressor=threshold=-24dB:ratio=3.2:attack=4:release=90:makeup=1,equalizer=f=1800:t=q:w=1.2:g=3'

def norm(w): return re.sub(r'[^a-z0-9]', '', w.lower().replace('’', "'"))
def word_times(text, heard, off):
    """a start time (seconds from the start of the line) for each word shown on the page, from the words the
    transcription heard. Words written differently from how they are said (£95, F28, Kerb) take the time of the
    first word heard in their place; a shown word not heard at all sits just before the next one."""
    shown = text.split()
    a = [norm(w) for w in shown]; b = [norm(w) for _, w in heard]
    out = [None] * len(shown)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1): out[i1 + k] = heard[j1 + k][0]
        elif tag == 'replace':
            for k in range(i2 - i1): out[i1 + k] = heard[j1 + (k * (j2 - j1)) // (i2 - i1)][0]
    nxt = None
    for i in range(len(out) - 1, -1, -1):
        if out[i] is None: out[i] = (nxt - .12) if nxt is not None else (heard[-1][0] if heard else 0)
        nxt = out[i]
    res, prev = [], 0
    for x in out:
        x = max(prev, round(x - off, 2)); res.append(max(0, x)); prev = x
    return res

master = decode(SRC)
print(f'takes: {len(master) / SR:.1f}s')
cues, total = {}, 0
for c in calls:
    cid = c['id']; os.makedirs(os.path.join(ROOT, 'assets/voice', cid), exist_ok=True)
    voice, who_at, t = [], [], 0.0
    def push(a, who=None):
        global t
        voice.append(a); who_at.append((t, t + len(a) / SR, who)); t += len(a) / SR
    push(silence(.3)); ring_at = t; push(ring()); push(silence(.5)); pick = t; push(click(-30)); push(silence(.28))
    lines, prev = [], None
    for ln in c['lines']:
        tk = takes['clips'][f'{cid}-{ln["id"]}']
        raw = master[tk['s']:tk['s'] + tk['n']]
        a, cut = trim(raw)
        off = (tk['s'] + cut) / takes['sr']
        heard = [(w[0], w[1]) for w in tk['w']]
        a = level(ff(a, AGENT), -20) if ln['who'] == 'agent' else level(ff(a, CALLER), -21.5)
        if prev: push(silence(ln.get('gap', GAP[ln['who']])))
        lines.append({'id': ln['id'], 't': round(t, 2), 'd': round(len(a) / SR, 2), 'w': word_times(ln['text'], heard, off)})
        push(a, ln['who']); prev = ln['who']
    push(silence(.7))
    mix = np.concatenate(voice)
    # the line itself: a faint hiss from the pick-up to the end, a little more under the caller (their phone's mic)
    bed = np.zeros_like(mix)
    p0 = int(pick * SR); bed[p0:] += noise((len(mix) - p0) / SR, -60)
    for s0, s1, who in who_at:
        if who != 'caller': continue
        i0, i1 = max(0, int((s0 - .06) * SR)), min(len(mix), int((s1 + .06) * SR))
        n = noise((i1 - i0) / SR, -53); f = min(len(n) // 2, int(SR * .05))
        n[:f] *= np.linspace(0, 1, f); n[-f:] *= np.linspace(1, 0, f)
        bed[i0:i1] += n[:i1 - i0]
    f = int(SR * .25); bed[-f:] *= np.linspace(1, 0, f)
    mix = mix + bed
    env = rms_frames(mix, ENV_HZ)
    env = np.clip(np.sqrt(env / .16) * 35, 0, 35).astype(int)
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, 'p.wav'); sf.write(w, mix, SR)
        mp3 = os.path.join(ROOT, 'assets/voice', cid, 'call.mp3')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w, '-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', '32000', '-map_metadata', '-1', mp3])
        total += os.path.getsize(mp3)
    cues[cid] = {'len': round(len(mix) / SR, 2), 'ring': [round(ring_at, 2), round(pick, 2)],
                 'env': ''.join('0123456789abcdefghijklmnopqrstuvwxyz'[v] for v in env), 'lines': lines}
    print(f'{cid}: {cues[cid]["len"]}s, {len(lines)} lines')

with open(os.path.join(ROOT, 'data/voice-cues.json'), 'w') as f:
    json.dump({'hz': ENV_HZ, 'calls': cues}, f, separators=(',', ':'))
print(f'audio: {total / 1024:.0f} KB')
