#!/usr/bin/env python3
"""Mix the recorded lines of each example call in tools/voice/calls.js into one call recording, and write its cue sheet.

  python3 tools/voice/render.py [path/to/takes.mp3]

The lines were recorded with ElevenLabs (the v4 model, one British voice per person, chosen in calls.js) and joined
into one file, tools/voice/takes.mp3: every line in name order (boiler-a1 ... physio-x2), each followed by a second of
silence. tools/voice/takes.json gives where each line starts and how long it is (in samples), and the start of every
word as ElevenLabs' own transcription heard it, which is how the page lights the words as they are said.
To re-record a line: generate it again, rebuild takes.mp3 and takes.json, then run this.

How it is made to sound like a real call recording rather than two voices taking turns:
- Two tracks, one per side, each with its own phone line. The assistant is the business's line (wideband VoIP, 16 kHz,
  a little squashed). The caller is a mobile: 300 to 3400 Hz, through a low bit rate voice codec and G.711, so it has
  the smeared edges of a real call. Each track goes through its line as a whole, pauses and all.
- The caller's room is on their track (a quiet house at night, a workshop, a corridor), ducked the way a phone's
  noise suppression ducks it, so it is there under their words and nearly gone between them.
- Lines are placed on a timeline, not butted together: the assistant answers after a short think, people jump in,
  a negative `gap` starts a line before the last one has finished, and `asides` (the "mm-hm"s a listener makes
  while the other person talks) sit in the pauses of the other side's lines. Asides are heard, not transcribed.

Writes assets/voice/<call>/call.mp3 and data/voice-cues.json: for each line its start, its length and a start time for
each word shown, plus a 40 Hz loudness curve so the page draws the waveform without decoding the audio.
"""
import difflib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools/voice/takes.mp3')
SR = 44100
ENV_HZ = 40
# the pause before a line when calls.js gives no `gap`: the assistant thinks for a moment, people come straight in
GAP = {'agent': .62, 'caller': .3}
LEVEL = {'agent': -20.0, 'caller': -21.0}

calls = json.loads(subprocess.check_output(['node', '-e', 'console.log(JSON.stringify(require("./tools/voice/calls.js")))'], cwd=ROOT))
takes = json.load(open(os.path.join(ROOT, 'tools/voice/takes.json')))
rng = np.random.default_rng(7)


def decode(path):
    out = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
    return np.frombuffer(out, dtype='<f4').copy()


def ff(a, filt):
    with tempfile.TemporaryDirectory() as td:
        i, o = os.path.join(td, 'i.wav'), os.path.join(td, 'o.wav')
        sf.write(i, a, SR, subtype='FLOAT')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', filt, '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_f32le', o])
        b, _ = sf.read(o, dtype='float32')
        return b[:len(a)] if len(b) >= len(a) else np.pad(b, (0, len(a) - len(b)))


def codec(a, pre, enc, post):
    """send audio through a real voice codec and back: `pre` filters, `enc` is the ffmpeg encoder and its rate, `post` filters"""
    with tempfile.TemporaryDirectory() as td:
        i, m, o = os.path.join(td, 'i.wav'), os.path.join(td, 'm.' + enc[0]), os.path.join(td, 'o.wav')
        sf.write(i, a, SR, subtype='FLOAT')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', pre, '-ac', '1'] + enc[1:] + [m])
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', m, '-af', post, '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_f32le', o])
        b, _ = sf.read(o, dtype='float32')
    # codecs add a few ms of delay at the front; line it back up with the input so the cue times stay true
    n = min(len(a), len(b), SR * 4)
    x = np.correlate(np.abs(b[:n]), np.abs(a[:n])[:n - 2000], mode='valid') if n > 4000 else [0]
    lag = int(np.argmax(x)) if len(x) else 0
    b = b[lag:]
    return b[:len(a)] if len(b) >= len(a) else np.pad(b, (0, len(a) - len(b)))


def rms_frames(a, hz):
    n = SR // hz
    m = len(a) // n
    return np.sqrt((a[:m * n].reshape(m, n) ** 2).mean(axis=1) + 1e-12) if m else np.zeros(0)


def voiced_rms(a):
    e = rms_frames(a, 100)
    v = e[e > e.max() * .1] if len(e) else e
    return float(np.sqrt((v ** 2).mean())) if len(v) else 1e-6


def level(a, db):
    """bring speech to a loudness (RMS of the voiced part only, so a long pause does not make a line louder)"""
    a = a * (10 ** (db / 20) / max(voiced_rms(a), 1e-6))
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


def coloured(n, slope):
    """noise with a spectral slope: 0 white, 1 pink, 2 brown"""
    w = rng.standard_normal(n).astype('float32')
    f = np.fft.rfft(w)
    k = np.arange(len(f)); k[0] = 1
    f = f / (k ** (slope / 2))
    x = np.fft.irfft(f, n).astype('float32')
    return x / (np.sqrt((x ** 2).mean()) + 1e-12)


def room(kind, n):
    """the room the caller is standing in, before it reaches their phone"""
    t = np.arange(n) / SR
    if kind == 'house':      # a kitchen at night: fridge hum and the air in the room
        x = .5 * coloured(n, 2) + .25 * coloured(n, 1)
        x += .18 * (np.sin(2 * np.pi * 100 * t) + .5 * np.sin(2 * np.pi * 200 * t + 1) + .25 * np.sin(2 * np.pi * 300 * t + 2)).astype('float32')
    elif kind == 'work':     # a workshop or yard: a wide wash with a slow swell, like traffic beyond a wall
        swell = (1 + .35 * np.sin(2 * np.pi * t / 7.3) + .2 * np.sin(2 * np.pi * t / 2.9 + 1)).astype('float32')
        x = (.6 * coloured(n, 1.4) + .3 * coloured(n, .6)) * swell
    else:                    # a corridor at work: an air vent and a soft hard-walled room
        x = .55 * coloured(n, 1.2) + .2 * coloured(n, 2)
    return x.astype('float32')


def ring():
    """one UK ring: 400 + 450 Hz, 0.4 s on, 0.2 s off, 0.4 s on, as the caller hears it"""
    def burst(sec):
        t = np.arange(int(SR * sec)) / SR
        b = .5 * (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t))
        f = int(SR * .012); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)
        return b.astype('float32')
    return np.concatenate([burst(.4), silence(.2), burst(.4)]) * .05


def click():
    """the call connecting: a short knock"""
    n = int(SR * .03)
    k = rng.standard_normal(n).astype('float32') * np.exp(-np.arange(n) / (SR * .004)).astype('float32')
    return k * .02


# the business's line: wideband VoIP. The caller's: a mobile, narrow band, a low bit rate voice codec, then G.711
AGENT_PRE = 'highpass=f=120,lowpass=f=7000,acompressor=threshold=-22dB:ratio=2.6:attack=6:release=120:makeup=1,aresample=16000'
AGENT_ENC = ['opus', '-c:a', 'libopus', '-b:a', '28k', '-application', 'voip']
AGENT_POST = 'highpass=f=100,equalizer=f=2600:t=q:w=1.4:g=1.5'
CALLER_PRE = 'highpass=f=300,lowpass=f=3400,acompressor=threshold=-26dB:ratio=3.4:attack=4:release=90:makeup=1,aresample=8000'
CALLER_ENC = ['opus', '-c:a', 'libopus', '-b:a', '12k', '-application', 'voip']
CALLER_POST = 'highpass=f=280,lowpass=f=3450,equalizer=f=1700:t=q:w=1.2:g=3'


def g711(a):
    """the G.711 A-law step a call takes between networks: 8 kHz, companded to 8 bits"""
    with tempfile.TemporaryDirectory() as td:
        i, m, o = os.path.join(td, 'i.wav'), os.path.join(td, 'm.wav'), os.path.join(td, 'o.wav')
        sf.write(i, a, SR, subtype='FLOAT')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', i, '-ar', '8000', '-ac', '1', '-c:a', 'pcm_alaw', m])
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', m, '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_f32le', o])
        b, _ = sf.read(o, dtype='float32')
    return b[:len(a)] if len(b) >= len(a) else np.pad(b, (0, len(a) - len(b)))


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


def take(master, key):
    if key not in takes['clips']:
        raise SystemExit(f'no recording for {key} in tools/voice/takes.json: record it, or take it out of calls.js')
    tk = takes['clips'][key]
    a, cut = trim(master[tk['s']:tk['s'] + tk['n']])
    return a, (tk['s'] + cut) / takes['sr'], [(w[0], w[1]) for w in tk['w']]


master = decode(SRC)
print(f'takes: {len(master) / SR:.1f}s')
cues, total = {}, 0
for c in calls:
    cid = c['id']; os.makedirs(os.path.join(ROOT, 'assets/voice', cid), exist_ok=True)
    place = []            # (side, start in seconds, audio)
    ring_at = .3; pick = ring_at + 1.0 + .5
    t = pick + .45        # the assistant's greeting, a beat after the call connects
    lines, prev, at = [], None, {}
    for ln in c['lines']:
        who = ln['who']
        a, off, heard = take(master, f'{cid}-{ln["id"]}')
        a = level(a, LEVEL[who] + (rng.normal(0, .8) if who == 'caller' else 0))   # a caller drifts nearer and further from the phone
        if prev:
            g = ln['gap'] if 'gap' in ln else GAP[who] + float(np.clip(rng.normal(0, .07), -.12, .12))
            t = max(pick + .2, t + g)
        w = word_times(ln['text'], heard, off)
        lines.append({'id': ln['id'], 't': round(t, 2), 'd': round(len(a) / SR, 2), 'w': w})
        at[ln['id']] = (t, len(a) / SR, w, ln['text'].split())
        place.append((who, t, a))
        t += len(a) / SR; prev = who
    end = t + .8
    # the "mm-hm"s: placed in a pause of the other side's line, just before its next word
    for x in c.get('asides', []):
        a, _, _ = take(master, f'{cid}-{x["id"]}')
        a = level(a, LEVEL[x['who']] - 4)
        t0, d, w, words = at[x['on']]
        k = next(i for i, s in enumerate(words) if norm(s) == norm(x['after']))
        nxt = t0 + (w[k + 1] if k + 1 < len(w) else d)
        place.append((x['who'], max(t0 + w[k] + .25, nxt - .55 * len(a) / SR), a))

    n = int(end * SR) + SR
    tr = {'agent': np.zeros(n, dtype='float32'), 'caller': np.zeros(n, dtype='float32')}
    talk = np.zeros(n, dtype='float32')
    for who, s, a in place:
        i = int(round(s * SR)); tr[who][i:i + len(a)] += a[:n - i]
        if who == 'caller': talk[i:i + len(a)] = 1
    # the caller's room, ducked by their phone's noise suppression: up under their words, nearly gone between them
    p0 = int(pick * SR)
    env = np.convolve(talk, np.ones(int(SR * .25), dtype='float32') / int(SR * .25), mode='same')
    duck = (10 ** (-58 / 20)) + ((10 ** (-44 / 20)) - (10 ** (-58 / 20))) * np.clip(env * 1.4, 0, 1)
    rm = room(c.get('room', 'house'), n) * duck.astype('float32'); rm[:p0] = 0
    tr['caller'] += rm
    # the ring is heard down the caller's line; the click is the call connecting
    r = ring(); i = int(ring_at * SR); tr['caller'][i:i + len(r)] += r
    k = click(); tr['agent'][p0:p0 + len(k)] += k

    agent = codec(tr['agent'], AGENT_PRE, AGENT_ENC, AGENT_POST)
    caller = g711(codec(tr['caller'], CALLER_PRE, CALLER_ENC, CALLER_POST))
    # bring each side back to its talking level after the line has squashed it, then sum
    for side, x in (('agent', agent), ('caller', caller)):
        on = np.zeros(n, dtype=bool)
        for who, s, a in place:
            if who == side: on[int(s * SR):int(s * SR) + len(a)] = True
        g = 10 ** (LEVEL[side] / 20) / max(voiced_rms(x[on]), 1e-6)
        x *= g
    hiss = coloured(n, .8); hiss = ff(hiss, 'highpass=f=300,lowpass=f=3400'); hiss *= 10 ** (-64 / 20) / (np.sqrt((hiss ** 2).mean()) + 1e-12)
    hiss[:p0] = 0
    mix = (agent + caller + hiss)[:int(end * SR)]
    f = int(SR * .25); mix[-f:] *= np.linspace(1, 0, f)
    p = np.abs(mix).max()
    if p > .95: mix *= .95 / p

    envl = rms_frames(mix, ENV_HZ)
    envl = np.clip(np.sqrt(envl / .16) * 35, 0, 35).astype(int)
    with tempfile.TemporaryDirectory() as td:
        wv = os.path.join(td, 'p.wav'); sf.write(wv, mix, SR)
        mp3 = os.path.join(ROOT, 'assets/voice', cid, 'call.mp3')
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', wv, '-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', '-ar', '32000', '-map_metadata', '-1', mp3])
        total += os.path.getsize(mp3)
    cues[cid] = {'len': round(len(mix) / SR, 2), 'ring': [round(ring_at, 2), round(pick, 2)],
                 'env': ''.join('0123456789abcdefghijklmnopqrstuvwxyz'[v] for v in envl), 'lines': lines}
    print(f'{cid}: {cues[cid]["len"]}s, {len(lines)} lines, {len(c.get("asides", []))} asides')

with open(os.path.join(ROOT, 'data/voice-cues.json'), 'w') as f:
    json.dump({'hz': ENV_HZ, 'calls': cues}, f, separators=(',', ':'))
print(f'audio: {total / 1024:.0f} KB')
