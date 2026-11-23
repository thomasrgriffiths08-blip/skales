/* The voice agent player, as HTML for a page. The words come from calls.js, the timings from data/voice-cues.json
   (written by render.py). Requiring this file also writes assets/voice/calls.json, the one file the player fetches. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const calls = require('./calls.js');
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/voice-cues.json'), 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md5 = f => crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 8);

const part = (c, key, lines) => {
  const q = cues.calls[c.id][key];
  return { key, src: `${c.id}/${key}.mp3?v=${md5(`assets/voice/${c.id}/${key}.mp3`)}`, len: q.len, env: q.env, ring: q.ring,
    lines: lines.map((l, i) => { if (q.lines[i].id !== l.id) throw new Error(`voice cues are stale at ${c.id}/${l.id}: run tools/voice/render.py`);
      return { who: l.who, text: l.text, t: q.lines[i].t, d: q.lines[i].d, w: q.lines[i].w, acts: l.acts || [] }; }) };
};
const DATA = { hz: cues.hz, calls: calls.map(c => ({ id: c.id, tab: c.tab, biz: c.biz, place: c.place, initial: c.initial, c: c.c, ink: c.ink, clock: c.clock, caller: c.caller, scene: c.scene, ask: c.ask,
  open: part(c, 'open', c.open), paths: c.paths.map(p => Object.assign(part(c, p.key, p.lines), { label: p.label, result: p.result })) })) };
const json = JSON.stringify(DATA);
fs.mkdirSync(path.join(ROOT, 'assets/voice'), { recursive: true });
if (!fs.existsSync(path.join(ROOT, 'assets/voice/calls.json')) || fs.readFileSync(path.join(ROOT, 'assets/voice/calls.json'), 'utf8') !== json) fs.writeFileSync(path.join(ROOT, 'assets/voice/calls.json'), json);
const VER = crypto.createHash('md5').update(json).digest('hex').slice(0, 8);

const secs = c => Math.round((c.open.len + c.paths[0].len - c.open.ring[1]) / 5) * 5;
const I = {
  phone: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6.6 3.5h2.7l1.5 4.2-2 1.6a12.5 12.5 0 0 0 5.9 5.9l1.6-2 4.2 1.5v2.7a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path class="vc-on" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path class="vc-off" d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  again: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.3-5.2M5 4.5V8h3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* the player. `b` is the page's base path; everything a visitor sees before pressing the button is in the HTML */
function stage(b){
  const c = DATA.calls[0];
  return `<div class="vc" data-vc data-src="${b}assets/voice/calls.json?v=${VER}" data-base="${b}assets/voice/">
  <div class="vc-tabs" role="tablist" aria-label="Pick a call to hear">
    ${DATA.calls.map((x, i) => `<button type="button" role="tab" aria-selected="${i ? 'false' : 'true'}" data-i="${i}"><b>${esc(x.tab)}</b><span>${esc(x.biz)} · about ${secs(x)} seconds</span></button>`).join('\n    ')}
  </div>
  <div class="vc-stage">
    <div class="vc-phone" data-phase="idle">
      <div class="vc-top"><span data-vc-clock>${esc(c.clock)}</span><span class="vc-state" data-vc-state>Not started</span><span data-vc-timer>00:00</span></div>
      <div class="vc-id"><span class="vc-av" data-vc-av style="background:${c.c};color:${c.ink}">${esc(c.initial)}</span><p><b data-vc-biz>${esc(c.biz)}</b><span data-vc-place>${esc(c.place)}</span></p></div>
      <canvas class="vc-wave" data-vc-wave aria-hidden="true"></canvas>
      <div class="vc-cap">
        <p class="vc-who" data-vc-who><i></i><span>Before the call</span></p>
        <p class="vc-line" data-vc-line>${esc(c.scene)}</p>
      </div>
      <p class="vc-act" data-vc-act></p>
      <div class="vc-ask" data-vc-ask hidden>
        <p data-vc-q></p>
        <div class="vc-opts" data-vc-opts></div>
        <span class="vc-count" aria-hidden="true"><i data-vc-count></i></span>
      </div>
      <div class="vc-end" data-vc-end hidden>
        <p class="vc-end-h" data-vc-end-h></p>
        <div class="vc-end-b"><button type="button" class="btn btn-live" data-vc-next></button><button type="button" class="btn btn-glass" data-vc-other></button></div>
      </div>
      <div class="vc-ctl">
        <button type="button" class="btn btn-live btn-lg vc-go" data-vc-go>${I.phone}<span data-vc-go-t>Ring ${esc(c.biz)}</span></button>
        <div class="vc-live" data-vc-live hidden>
          <button type="button" class="vc-ib" data-vc-pause aria-label="Pause the call" aria-pressed="false">${I.pause}</button>
          <button type="button" class="vc-ib" data-vc-mute aria-label="Turn the sound off" aria-pressed="false">${I.sound}</button>
          <button type="button" class="vc-ib" data-vc-again aria-label="Start this call again">${I.again}</button>
        </div>
        <p class="vc-hint" data-vc-hint>Sound on. You answer one question as the caller.</p>
      </div>
    </div>
    <div class="vc-side">
      <div class="vc-feed">
        <h3>The call, and what the assistant does during it</h3>
        <div class="vc-roll" data-vc-roll>
          <ol data-vc-feed></ol>
          <ul class="vc-empty" data-vc-empty>
            <li><b>It answers</b><span>On the first ring, at any hour, and says it is an AI.</span></li>
            <li><b>It checks</b><span>The diary, the price list and the owner's own rules, live on the call.</span></li>
            <li><b>It acts</b><span>Books the job, sends the text, and leaves the owner a note.</span></li>
          </ul>
          <div class="vc-res" data-vc-res hidden></div>
        </div>
      </div>
    </div>
  </div>
  <p class="vc-note">Fictional business · illustrative numbers · a recorded example call, and both voices are AI</p>
</div>`;
}

/* every call as plain text, for people who cannot play sound and for search */
function transcripts(){
  const who = (c, l) => l.who === 'agent' ? 'AI assistant' : c.caller;
  return DATA.calls.map(c => `<details class="vc-tx"><summary>${esc(c.tab)} · ${esc(c.biz)}</summary>
  <p class="vc-tx-s">${esc(c.scene)}</p>
  ${c.open.lines.map(l => `<p><b>${esc(who(c, l))}:</b> ${esc(l.text)}</p>`).join('\n  ')}
  ${c.paths.map(p => `<p class="vc-tx-p">If the caller says: ${esc(p.label)}</p>
  ${p.lines.map(l => `<p><b>${esc(who(c, l))}:</b> ${esc(l.text)}</p>`).join('\n  ')}
  <p class="vc-tx-r">${esc(p.result.h)}.</p>`).join('\n  ')}
</details>`).join('\n');
}
module.exports = { stage, transcripts, DATA, css: 'voice.css', js: 'voice.js' };
