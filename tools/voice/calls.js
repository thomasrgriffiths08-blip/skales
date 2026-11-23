/* The three recorded example calls on /ai/. One source for the words on the page, the audio and the cue sheet.
   `text` is what the transcript shows. `say` is what the voice model is given when it differs: the same words with
   ElevenLabs delivery tags ([sighs], [laughs softly]) and the pauses a real caller makes. Each call plays straight
   through like a call recording; nobody is asked to answer anything.
   Every business is one of the made-up ones already on the site. The recorded lines are in tools/voice/takes.mp3;
   tools/voice/render.py mixes them into one recording per call.
   {tom} and {tomLong} become tomorrow's date in the browser, so the diary never shows an old day.
   `gap` is the silence before a line, in seconds, where a real call would not leave the default.
   `acts` are what the assistant does during a line: [how far into the line (0 to 1), what it did, its icon, and
   'diary' or 'sms' when that is the moment the diary entry or the text message on the page fills in]. */
const A = 'agent', C = 'caller';
module.exports = [
  {
    id: 'boiler', tab: 'Boiler down at 23:10', biz: 'Larchfield Heating', place: 'Heating engineer · Leeds', initial: 'L', c: '#2563EB', ink: '#FFFFFF',
    clock: '23:10', owner: 'Dan', caller: 'Sam Whitfield', from: '07700 900418', scene: 'Dan clocked off at 17:30. The phone rings at 23:10.',
    outcome: 'Job booked', voices: { agent: 'EKpKHSkyNegCyjBRc55p', caller: 'tWZ6sbznORyzWaRkNJTg' },
    lines: [
      { id: 'a1', who: A, text: 'Larchfield Heating, you’re through to Dan’s AI assistant. He’s finished for the night, but I can sort most things. What’s happened?',
        say: '[warmly] Larchfield Heating, you’re through to Dan’s AI assistant. He’s finished for the night, but I can sort most things. What’s happened?',
        acts: [[0, 'Answered on the first ring, and said it is an AI', 'ok']] },
      { id: 'c1', who: C, text: 'Oh, hiya. Sorry, I know it’s late. The boiler’s just gone off, there’s a code on it, F28, and we’ve got no hot water at all.',
        say: '[tired] Oh, hiya. Sorry, I know it’s late. [sighs] The boiler’s just gone off, there’s a code on it, F28... and we’ve got no hot water at all.' },
      { id: 'a2', who: A, text: 'Oh, that’s no fun at this time of night. Before anything else, can you smell gas anywhere?',
        say: '[sympathetic] Oh, that’s no fun at this time of night. [calmly] Before anything else, can you smell gas anywhere?',
        acts: [[.45, 'Dan’s rule: ask about gas before anything else', 'rule']] },
      { id: 'c2', who: C, text: 'No. No, nothing like that.', gap: .3 },
      { id: 'a3', who: A, text: 'Good. And is anything leaking, or is it dry underneath?', gap: .4,
        acts: [[0, 'No gas smell, so a visit is safe to book', 'ok']] },
      { id: 'c3', who: C, text: 'Dry, yeah. The pressure’s on about one and a half, if that helps.',
        say: 'Dry, yeah. The pressure’s on about... one and a half, if that helps.' },
      { id: 'a4', who: A, text: 'It does, that tells Dan what to bring. He’s free tomorrow at eight. A breakdown visit starts at £95. Shall I put you in?',
        acts: [[0, 'Noted for Dan: fault F28, no leak, 1.5 bar', 'note'], [.35, 'Checked Dan’s diary: {tom} 08:00 is free', 'look'], [.62, 'Read the price list: breakdown visit from £95', 'look']] },
      { id: 'c4', who: C, text: 'Yes please. Eight’s fine. It’s Sam, Sam Whitfield, 12 Ash Grove.',
        say: '[relieved] Yes please. Eight’s fine. It’s Sam... Sam Whitfield, 12 Ash Grove.' },
      { id: 'a5', who: A, text: 'Lovely. You’re booked in, Sam. I’ve texted you a link for a £30 deposit, which comes off the bill, and Dan will text you when he’s on his way.',
        acts: [[0, 'Booked Job 0418: {tom} 08:00, Sam Whitfield, LS6', 'done', 'diary'], [.4, 'Texted the £30 deposit link', 'done', 'sms']] },
      { id: 'c5', who: C, text: 'Brilliant. Thanks so much.', say: '[laughs softly] Brilliant. Thanks so much.', gap: .3 },
      { id: 'a6', who: A, text: 'No problem at all. Night, Sam.', say: '[warmly] No problem at all. Night, Sam.', gap: .35,
        acts: [[.6, 'Sent Dan a summary to read in the morning', 'done']] },
    ],
    result: { h: 'A job booked at 23:11 while Dan slept', stats: [['£95', 'job booked'], ['£30', 'deposit link sent'], ['0 min', 'of Dan’s time']],
      card: { k: 'In Dan’s diary', t: '{tomLong}, 08:00', s: 'Breakdown visit · Sam Whitfield, LS6', m: 'Job 0418 · F28, no leak, 1.5 bar' },
      sms: 'Larchfield Heating: you’re booked for {tom} at 08:00. Pay the £30 deposit here and it comes off the bill: larchfieldheating.example.co.uk/pay/0418' },
  },
  {
    id: 'garage', tab: 'A price it will not guess', biz: 'Kerb & Camber', place: 'MOT and service garage · Reading', initial: 'K', c: '#1F2937', ink: '#FFFFFF',
    clock: '14:20', owner: 'Baz', caller: 'Owen Hughes', from: '07700 900611', scene: 'Both mechanics are under a car. The office phone rings.',
    outcome: 'MOT booked, call back set', voices: { agent: 'EtBr43MW0sMHh44Pdij6', caller: '3f6pec3wODJsjTqtcNI2' },
    lines: [
      { id: 'a1', who: A, text: 'Kerb and Camber, you’re through to the garage’s AI assistant. Both mechanics are under a car, so I’m taking the calls. What can I do for you?',
        say: '[warmly] Kerb and Camber, you’re through to the garage’s AI assistant. Both mechanics are under a car, so I’m taking the calls. What can I do for you?',
        acts: [[0, 'Answered on the first ring, and said it is an AI', 'ok']] },
      { id: 'c1', who: C, text: 'Hi, yeah. My MOT runs out next week. Have you got anything before Friday?' },
      { id: 'a2', who: A, text: 'I’ve got Wednesday at nine, or Thursday at half one. An MOT is £54.85.',
        acts: [[0, 'Checked the ramp diary: Wed 09:00 and Thu 13:30 are free', 'look'], [.62, 'Read the price board: MOT £54.85', 'look']] },
      { id: 'c2', who: C, text: 'Wednesday at nine, please. Oh, and while I’ve got you, there’s a sort of knocking noise when I brake. Roughly what’s that going to cost?',
        say: 'Wednesday at nine, please. Oh, and... while I’ve got you, there’s a sort of knocking noise when I brake. [curious] Roughly what’s that going to cost?' },
      { id: 'a3', who: A, text: 'Honestly, I can’t price that until someone’s had a look at it, and I’d rather not guess. I can add a brake check to Wednesday, and get Baz to ring you this afternoon. Would that help?',
        acts: [[.08, 'Not on the price board, so it did not guess', 'stop'], [.6, 'Offered a brake check and a call from Baz', 'rule']] },
      { id: 'c3', who: C, text: 'Yeah, go on then. That’d be great.', gap: .3 },
      { id: 'a4', who: A, text: 'Right. MOT on Wednesday at nine, brake check added, and Baz will call you today. What’s your name?',
        acts: [[0, 'Booked: MOT, Wed 09:00', 'done', 'diary'], [.3, 'Added a brake check to the job', 'done'], [.55, 'Messaged Baz: ring this caller today, knocking under braking', 'done']] },
      { id: 'c4', who: C, text: 'Owen. Owen Hughes.', gap: .3 },
      { id: 'a5', who: A, text: 'Thanks, Owen. I’ve texted you the details. See you Wednesday.', say: '[warmly] Thanks, Owen. I’ve texted you the details. See you Wednesday.',
        acts: [[.4, 'Texted the confirmation', 'done', 'sms']] },
    ],
    result: { h: 'The MOT booked, and the hard question passed to a person', stats: [['£54.85', 'MOT booked'], ['1 call back', 'for Baz, with the details'], ['0', 'prices made up']],
      card: { k: 'On the ramp diary', t: 'Wednesday, 09:00', s: 'MOT and brake check · Owen Hughes', m: 'Baz to ring today: knocking under braking' },
      sms: 'Kerb & Camber: MOT booked for Wednesday at 09:00, with a brake check. Baz will ring you today about the noise. Unit 4, Cardigan Yard, RG1 8HZ.' },
  },
  {
    id: 'physio', tab: 'Moving an appointment', biz: 'Fern Physio', place: 'Physiotherapy clinic · Sheffield', initial: 'F', c: '#8EE6C4', ink: '#10231C',
    clock: '12:40', owner: 'Dev', caller: 'Hannah Price', from: '07700 900142', scene: 'Both physios are with patients. Nobody is at the desk.',
    outcome: 'Appointment moved', voices: { agent: 'Kvz8PYxEASZVHoP2dkYm', caller: 'nLLW6LkVhmOg5RTpbnYS' },
    lines: [
      { id: 'a1', who: A, text: 'Fern Physio, you’re speaking to the clinic’s AI assistant. Both physios are with patients at the minute. How can I help?',
        say: '[warmly] Fern Physio, you’re speaking to the clinic’s AI assistant. Both physios are with patients at the minute. How can I help?',
        acts: [[0, 'Answered on the first ring, and said it is an AI', 'ok']] },
      { id: 'c1', who: C, text: 'Oh, hi. It’s Hannah Price. I’m booked in on Thursday, but they’ve just put me on a late shift, so I can’t make it now.',
        say: 'Oh, hi. It’s Hannah Price. I’m booked in on Thursday, but [sighs] they’ve just put me on a late shift, so... I can’t make it now.' },
      { id: 'a2', who: A, text: 'Ah, that’s annoying. I’ve got you here, Thursday at half four with Dev. Do you want to move it?',
        acts: [[.3, 'Found the booking: Hannah Price, Dev, Thu 16:30', 'look']] },
      { id: 'c2', who: C, text: 'Yeah, if I can. Is there anything on Friday?', gap: .3 },
      { id: 'a3', who: A, text: 'Dev’s got quarter past ten, or two o’clock.', gap: .55,
        acts: [[0, 'Checked Dev’s diary: Fri 10:15 and 14:00 are free', 'look']] },
      { id: 'c3', who: C, text: 'Ooh, two would be perfect.', say: '[happy] Ooh, two would be perfect.', gap: .3 },
      { id: 'a4', who: A, text: 'Done. Friday at two with Dev. I’ve texted you the new time, and Thursday’s slot is free for someone else now.',
        acts: [[0, 'Moved the booking to Fri 14:00', 'done', 'diary'], [.45, 'Texted the new time', 'done', 'sms'], [.7, 'Opened Thu 16:30 for someone else', 'done']] },
      { id: 'c4', who: C, text: 'Amazing. Thank you.', say: '[laughs softly] Amazing. Thank you.', gap: .3 },
      { id: 'a5', who: A, text: 'You’re welcome, Hannah. See you Friday.', say: '[warmly] You’re welcome, Hannah. See you Friday.', gap: .35 },
    ],
    result: { h: 'Moved without anyone leaving the treatment room', stats: [['Fri 14:00', 'new time'], ['Thu 16:30', 'free to book again'], ['0 min', 'at the front desk']],
      card: { k: 'In Dev’s diary', t: 'Friday, 14:00', s: 'Follow-up · Hannah Price', m: 'Moved from Thu 16:30 by phone' },
      sms: 'Fern Physio: your appointment with Dev is now Friday at 14:00. Need to change it? Reply here or ring 0114 496 0142.' },
  },
];
