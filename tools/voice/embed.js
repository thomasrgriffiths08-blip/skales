/* The call recordings player, as HTML for a page. The words come from calls.js, the timings from data/voice-cues.json
   (written by render.py). Requiring this file also writes assets/voice/calls.json, the one file the player fetches.
   It looks like the call log of a phone system: pick a call, press play, and the transcript follows the recording
   while what the assistant does (the diary entry, the text message) fills in at the moment it happens. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const calls = require('./calls.js');
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/voice-cues.json'), 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md5 = f => crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 8);

const DATA = { hz: cues.hz, calls: calls.map(c => {
  const q = cues.calls[c.id];
  if (!q || q.lines.length !== c.lines.length) throw new Error(`voice cues are stale for ${c.id}: run tools/voice/render.py`);
  return { id: c.id, biz: c.biz, place: c.place, initial: c.initial, c: c.c, ink: c.ink, clock: c.clock, owner: c.owner, caller: c.caller, from: c.from,
    scene: c.scene, outcome: c.outcome, src: `${c.id}/call.mp3?v=${md5(`assets/voice/${c.id}/call.mp3`)}`, len: q.len, ring: q.ring, env: q.env,
    lines: c.lines.map((l, i) => { if (q.lines[i].id !== l.id) throw new Error(`voice cues are stale at ${c.id}/${l.id}: run tools/voice/render.py`);
      return { who: l.who, text: l.text, t: q.lines[i].t, d: q.lines[i].d, w: q.lines[i].w, acts: l.acts || [] }; }),
    result: c.result };
}) };
const json = JSON.stringify(DATA);
fs.mkdirSync(path.join(ROOT, 'assets/voice'), { recursive: true });
if (!fs.existsSync(path.join(ROOT, 'assets/voice/calls.json')) || fs.readFileSync(path.join(ROOT, 'assets/voice/calls.json'), 'utf8') !== json) fs.writeFileSync(path.join(ROOT, 'assets/voice/calls.json'), json);
const VER = crypto.createHash('md5').update(json).digest('hex').slice(0, 8);

const mss = s => { s = Math.floor(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const svg = (d, w = 18) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true">${d}</svg>`;
const I = {
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>', 20),
  sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path class="vp-on" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path class="vp-off" d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  phone: svg('<path d="M6.6 3.5h2.7l1.5 4.2-2 1.6a12.5 12.5 0 0 0 5.9 5.9l1.6-2 4.2 1.5v2.7a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>', 16),
  diary: svg('<rect x="4" y="5.5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>', 16),
  sms: svg('<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>', 16),
};

/* the player. `b` is the page's base path. Everything a visitor sees before pressing play is in the HTML; the
   transcript and the waveform come from calls.json */
function stage(b){
  const c = DATA.calls[0];
  return `<div class="vp" data-vp data-src="${b}assets/voice/calls.json?v=${VER}" data-base="${b}assets/voice/">
  <div class="vp-bar"><span class="vp-app">${I.phone}Call recordings</span><span class="vp-bar-r">Answered by the AI assistant</span></div>
  <div class="vp-body">
    <div class="vp-log" role="tablist" aria-label="Pick a call">
      ${DATA.calls.map((x, i) => `<button type="button" role="tab" id="vp-t-${x.id}" aria-selected="${i ? 'false' : 'true'}" tabindex="${i ? -1 : 0}" data-i="${i}">
        <span class="vp-av" style="background:${x.c};color:${x.ink}" aria-hidden="true">${esc(x.initial)}</span>
        <span class="vp-log-m"><b>${esc(x.caller)}</b><span>${esc(x.biz)}</span></span>
        <span class="vp-log-r"><span>${esc(x.clock)}</span><span>${mss(x.len)}</span></span>
        <span class="vp-log-o">${esc(x.outcome)}</span>
      </button>`).join('\n      ')}
    </div>
    <div class="vp-main" role="tabpanel" aria-labelledby="vp-t-${c.id}" data-vp-panel>
      <div class="vp-head">
        <span class="vp-av vp-av-l" data-vp-av style="background:${c.c};color:${c.ink}" aria-hidden="true">${esc(c.initial)}</span>
        <div class="vp-head-m">
          <h3><span data-vp-caller>${esc(c.caller)}</span> <span class="vp-num" data-vp-from>${esc(c.from)}</span></h3>
          <p>Called <b data-vp-biz>${esc(c.biz)}</b> · <span data-vp-place>${esc(c.place)}</span> · <span data-vp-clock>${esc(c.clock)}</span></p>
        </div>
        <span class="vp-out" data-vp-out>${esc(c.outcome)}</span>
      </div>
      <div class="vp-play">
        <button type="button" class="vp-go" data-vp-go aria-label="Play the call">${I.play}<span class="vp-pause" aria-hidden="true"><i></i><i></i></span></button>
        <div class="vp-wave">
          <div class="vp-scrub" data-vp-scrub role="slider" tabindex="0" aria-label="Position in the call" aria-valuemin="0" aria-valuemax="${Math.round(c.len)}" aria-valuenow="0" aria-valuetext="0 seconds"><canvas data-vp-canvas aria-hidden="true"></canvas></div>
          <div class="vp-meta"><span class="vp-time"><span data-vp-now>0:00</span> / <span data-vp-len>${mss(c.len)}</span></span><span class="vp-key"><span><i class="k-a"></i>AI assistant</span><span><i class="k-c"></i><span data-vp-key>${esc(c.caller)}</span></span></span>
            <span class="vp-tools"><button type="button" class="vp-ib vp-rate" data-vp-rate aria-label="Playback speed, now normal">1×</button><button type="button" class="vp-ib" data-vp-mute aria-label="Turn the sound off" aria-pressed="false">${I.sound}</button></span></div>
        </div>
      </div>
      <div class="vp-grid">
        <div class="vp-tx">
          <p class="vp-h">Transcript <span data-vp-state>Press play to listen</span></p>
          <div class="vp-roll" data-vp-roll tabindex="0" aria-label="Transcript">
            <p class="vp-scene" data-vp-scene>${esc(c.scene)}</p>
            <ol class="vp-lines" data-vp-lines></ol>
          </div>
        </div>
        <div class="vp-side">
          <div class="vp-card vp-diary" data-vp-diary>
            <p class="vp-h">${I.diary}<span data-vp-diary-k>Diary</span></p>
            <div class="vp-fill"></div>
          </div>
          <div class="vp-card vp-sms" data-vp-sms>
            <p class="vp-h">${I.sms}Text message to the caller</p>
            <div class="vp-fill"></div>
          </div>
          <div class="vp-card vp-res" data-vp-res>
            <p class="vp-h">After the call</p>
            <div class="vp-fill"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <p class="vp-note">Fictional business · illustrative numbers · a recorded example call, and both voices are AI</p>
</div>`;
}

/* every call as plain text, for people who cannot play sound and for search */
function transcripts(){
  const who = (c, l) => l.who === 'agent' ? 'AI assistant' : c.caller;
  const fill = s => String(s).replace(/\{tomLong\}/g, 'tomorrow').replace(/\{tom\}/g, 'tomorrow');
  return DATA.calls.map(c => `<details class="vc-tx"><summary>${esc(c.caller)} calls ${esc(c.biz)}</summary>
  <p class="vc-tx-s">${esc(c.scene)}</p>
  ${c.lines.map(l => `<p><b>${esc(who(c, l))}:</b> ${esc(l.text)}</p>`).join('\n  ')}
  <p class="vc-tx-r">${esc(fill(c.result.h))}.</p>
</details>`).join('\n');
}
module.exports = { stage, transcripts, DATA, css: 'voice.css', js: 'voice.js' };
