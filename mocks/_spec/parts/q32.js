module.exports = {
  q: 32,
  title: 'OtB · Q.32 Listen Mock (current theme)',
  h1: 'Q.32 · Listen · NEW CONCEPT (replaces Dial to Eleven)',
  sub: `Fully playable. Your concept: four words on the paper, and one of them is being said out loud, over and over, by the examination's speaker. A VOLUME dial sits on the paper. Turn it all the way up and you still hear nothing, because the hall has a second volume: the SOUND slider in the pause menu, which now actually works. Only when both the dial and the pause-menu slider are all the way up does the word become audible (the mock uses the browser's speech voice; a PLAYING ticker on the paper shows that audio is running even when you cannot hear it). Guessing a word costs a heart. The hint ladder goes "turn the dial all the way up first", then "there is a second volume", then "pause and drag SOUND to one hundred". Win: "Two volumes. Both had to be all the way up. Corporate calls that layered security." The spoken word is drawn at random each load.`,
  css: `
  .q32prompt{position:absolute; left:0; right:0; top:9%; text-align:center; font-family:var(--display); font-weight:bold; font-size:28px; color:var(--ink);}
  .ticker{position:absolute; left:0; right:0; top:20%; text-align:center; font-family:var(--mono); font-size:11px; letter-spacing:.18em; color:var(--fgDim);}
  .ticker i{display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent); margin-right:8px; vertical-align:middle; animation:tick 1.6s ease-in-out infinite;}
  @keyframes tick{0%,100%{opacity:.25} 50%{opacity:1}}
  .ticker.audible{color:var(--pass);} .ticker.audible i{background:var(--pass);}
  .vtrack{position:absolute; left:20%; width:60%; top:36%; height:10px; background:var(--hairline); border:2px solid var(--stroke); box-sizing:content-box;}
  .vlbl{position:absolute; left:0; right:0; top:28%; text-align:center; font-family:var(--mono); font-size:10px; letter-spacing:.18em; color:var(--fgDim);}
  .vtick{position:absolute; top:-8px; width:1px; height:6px; background:var(--fgDim);}
  .vnum{position:absolute; top:16px; transform:translateX(-50%); font-family:var(--body); font-size:11px; color:var(--fgDim);}
  .vknob{position:absolute; top:5px; width:32px; height:32px; border-radius:50%; background:var(--ink); border:2px solid var(--stroke); transform:translate(-50%,-50%); cursor:grab; touch-action:none;}
  .vknob.max{background:var(--accent);}
  .words{position:absolute; left:50%; top:62%; transform:translateX(-50%); display:flex; gap:26px;}
  .words .btn{width:190px; height:60px; font-size:21px; padding:0;}
  .q32note{position:absolute; left:0; right:0; top:90%; text-align:center; font-family:var(--body); font-size:12px; color:var(--fgDim);}
`,
  html: `
      <div class="q32prompt">Which word is being said?</div>
      <div class="ticker" id="ticker"><i></i>AUDIO PLAYING · REPEATING</div>
      <div class="vlbl">VOLUME</div>
      <div class="vtrack" id="vtrack"><div class="vknob" id="vknob"></div></div>
      <div class="words" id="words"></div>
      <div class="q32note">Turn it up if you cannot hear it.</div>
`,
  js: `
M.q = 32; M.next = 33; M.nextName = 'Misplaced';
const WORDS = ['CANDLE', 'THISTLE', 'BALLOON', 'MARGIN', 'LANTERN', 'PEBBLE', 'WHISKER', 'TURNIP'];
const pick = WORDS.slice(); for (let i = pick.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pick[i], pick[j]] = [pick[j], pick[i]]; }
const SHOWN = pick.slice(0, 4); const WORD = SHOWN[Math.floor(Math.random() * 4)];
M.level = { word: WORD, shown: SHOWN, dial: 0, audible: false, spoken: 0, fails: 0 };
// paper dial 0..10
const track = $('vtrack'), knob = $('vknob');
for (let i = 0; i <= 10; i++) { const t = document.createElement('div'); t.className = 'vtick'; t.style.left = (i * 10) + '%'; track.appendChild(t); const n = document.createElement('div'); n.className = 'vnum'; n.style.left = (i * 10) + '%'; n.textContent = i; track.appendChild(n); }
function setDial(v) { M.level.dial = Math.max(0, Math.min(10, v)); knob.style.left = (M.level.dial * 10) + '%'; knob.classList.toggle('max', M.level.dial >= 9.6); M.events.push('dial:' + M.level.dial.toFixed(1)); update(); }
let drag = false; const frac = (e) => { const r = track.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
knob.addEventListener('pointerdown', (e) => { if (M.solved || M.ended || M.paused) return; drag = true; knob.setPointerCapture(e.pointerId); e.preventDefault(); });
knob.addEventListener('pointermove', (e) => { if (drag) setDial(frac(e) * 10); });
const up = () => { drag = false; }; knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up);
track.addEventListener('pointerdown', (e) => { if (e.target === knob || M.solved || M.paused) return; setDial(frac(e) * 10); });
setDial(0);
function update() {
  const was = M.level.audible;
  M.level.audible = M.level.dial >= 9.6 && M.volume >= 0.99;
  $('ticker').classList.toggle('audible', M.level.audible);
  $('ticker').innerHTML = '<i></i>' + (M.level.audible ? 'AUDIO PLAYING · AUDIBLE' : 'AUDIO PLAYING · REPEATING');
  if (M.level.audible && !was) { M.events.push('audible'); M.retype('...There. Now you can hear it.'); }
  if (!M.level.audible && M.level.dial >= 9.6 && !M.level.saidSecond) { M.level.saidSecond = true; M.retype('All the way up. And still nothing? There is a second volume. It is not on the paper.'); }
}
M.onVolume = update;
function speak() {
  if (!M.level.audible || M.paused || M.solved || M.ended) return;
  M.level.spoken++; M.events.push('spoke');
  if (!('speechSynthesis' in window)) return;
  try { const u = new SpeechSynthesisUtterance(WORD.toLowerCase()); u.rate = 0.9; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
}
setInterval(speak, 1700);
const L = ['You are guessing. Turn the dial all the way up first.', 'Still nothing? There is a second volume. It is in the pause menu.', 'Pause. Drag SOUND to one hundred. Then listen.'];
SHOWN.forEach(w => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = w; b.id = 'word' + w;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (w === WORD && M.level.audible) return M.win('HEARD.', 'Two volumes. Both had to be all the way up. Corporate calls that layered security.');
    M.level.fails++; M.wrong(w === WORD ? 'A guess. A lucky one. It does not count until you can hear it.' : undefined);
    setTimeout(() => { if (!M.solved && !M.ended) M.retype(L[Math.min(M.level.fails - 1, L.length - 1)]); }, 700);
  };
  $('words').appendChild(b);
});
M.retype('Listen carefully. One of these words is being said, on repeat. If you cannot hear it, something is not all the way up.');
`,
};
