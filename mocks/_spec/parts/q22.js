module.exports = {
  q: 22,
  title: 'OtB · Q.22 Did You Catch That Mock (current theme)',
  h1: 'Q.22 · Did You Catch That · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level22.ts: the paper says only "Stay alert." for a random three to eight seconds, then a ten-digit number flashes in 80 px serif for three quarters of a second with MEMORISE NOW under it, then ten empty slots ask you to type it back (digits, Backspace, Enter or SUBMIT). A wrong sequence slams INCORRECT, costs a heart, draws a new number and sends you back to waiting. The trick is the pause button: it freezes the flash timer, and the digits stay readable above the suspension notice with a small SUSPENDED MID-FLASH tag, so you can copy them at leisure. Quirks: if you pause mid-flash the notice reads EXAMINATION SUSPENDED (CONVENIENT) and on resume the examiner says he saw. The hint ladder mentions stopping time after the first miss and names the pause button after the second. Add ?wait=1000 to the URL to shorten the random wait when testing.`,
  css: `
  .alert{position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; font-family:var(--body); font-size:18px; color:var(--fgDim);}
  .flashrow{position:absolute; left:0; right:0; top:50%; transform:translateY(-58%); display:none; text-align:center;}
  .flashrow.show{display:block;}
  .flashrow .digits{display:flex; justify-content:space-evenly; padding:0 40px; font-family:var(--display); font-weight:bold; font-size:80px; color:var(--ink);}
  .flashrow .now{margin-top:10px; font-family:var(--body); font-weight:bold; font-size:14px; color:var(--seal); letter-spacing:.08em;}
  .flashrow .sus{display:none; margin-top:6px; font-family:var(--mono); font-size:10px; letter-spacing:.16em; color:var(--accent);}
  .frame.pausedflash .flashrow{z-index:8; top:auto; bottom:3%; transform:none;} .frame.pausedflash .flashrow .digits{font-size:54px; padding:0 120px;} .frame.pausedflash .flashrow .now{display:none;} .frame.pausedflash .flashrow .sus{display:block; margin-top:2px;}
  .tint{position:absolute; inset:0; background:rgba(0,0,0,.08); opacity:0; pointer-events:none; animation:none;}
  .frame.dark .tint{background:rgba(255,255,255,.08);}
  .tint.show{animation:tintpulse .5s ease-in-out infinite; opacity:1;}
  @keyframes tintpulse{0%,100%{opacity:.5} 50%{opacity:1}}
  .inputph{position:absolute; inset:0; display:none;}
  .inputph.show{display:block;}
  .inputph .ask{position:absolute; left:0; right:0; top:50%; transform:translateY(-118px); text-align:center; font-family:var(--body); font-size:18px; color:var(--fgMid);}
  .slots{position:absolute; left:50%; top:50%; transform:translate(-50%,-58%); width:72%; height:64px; border:2px solid var(--stroke); display:flex;}
  .slot{flex:1; border-left:1px solid var(--hairline); display:flex; align-items:center; justify-content:center; font-family:var(--display); font-weight:bold; font-size:34px; color:var(--ink);}
  .slot:first-child{border-left:none;}
  .slot.empty{color:var(--hairline); padding-top:8px;}
  .slot.cur::after{content:""; width:2px; height:36px; background:var(--ink); animation:blink 1.06s steps(1) infinite;}
  .submit22{position:absolute; left:50%; top:50%; transform:translate(-50%, 34px); width:170px; height:46px; font-size:18px; padding:0; display:none;}
  .submit22.show{display:block;}
  .keyhint{position:absolute; left:0; right:0; bottom:8%; text-align:center; font-family:var(--body); font-size:10px; color:var(--fgDim);}
`,
  html: `
      <div class="tint" id="tint"></div>
      <div class="alert" id="alert">Stay alert.</div>
      <div class="flashrow" id="flashrow"><div class="digits" id="digits"></div><div class="now">MEMORISE NOW</div><div class="sus">SUSPENDED MID-FLASH</div></div>
      <div class="inputph" id="inputph">
        <div class="ask">Enter the sequence you saw:</div>
        <div class="slots" id="slots"></div>
        <button class="btn submit22" id="submit22">SUBMIT →</button>
        <div class="keyhint">type digits 0–9 &nbsp;·&nbsp; Backspace to erase &nbsp;·&nbsp; Enter to submit</div>
      </div>
`,
  js: `
M.q = 22; M.next = 23; M.nextName = 'Truth Table';
const CODE_LEN = 10, FLASH_MS = 750;
const urlWait = Number(new URLSearchParams(location.search).get('wait'));
const genCode = () => { let s = ''; for (let i = 0; i < CODE_LEN; i++) s += Math.floor(Math.random() * 10); return s; };
const randWait = () => urlWait > 0 ? urlWait : 3000 + Math.random() * 5000;
M.level = { phase: 'waiting', code: genCode(), waitMs: randWait(), elapsed: 0, input: '', misses: 0, pausedInFlash: false };
const frame = $('frame');
function show(phase) {
  M.level.phase = phase; M.level.elapsed = 0; M.events.push('phase:' + phase);
  $('alert').style.display = phase === 'waiting' ? '' : 'none';
  $('flashrow').classList.toggle('show', phase === 'flash'); $('tint').classList.toggle('show', phase === 'flash');
  $('inputph').classList.toggle('show', phase === 'input');
  if (phase === 'flash') $('digits').innerHTML = M.level.code.split('').map(d => '<span>' + d + '</span>').join('');
  if (phase === 'input') { M.level.input = ''; renderSlots(); }
}
function renderSlots() {
  const s = $('slots'); s.innerHTML = '';
  for (let i = 0; i < CODE_LEN; i++) { const d = document.createElement('div'); const ch = M.level.input[i]; d.className = 'slot' + (ch ? '' : (i === M.level.input.length ? ' cur' : ' empty')); d.textContent = ch || (i === M.level.input.length ? '' : '_'); s.appendChild(d); }
  $('submit22').classList.toggle('show', M.level.input.length === CODE_LEN);
}
function submit() {
  if (M.level.phase !== 'input' || M.level.input.length !== CODE_LEN || M.solved || M.ended) return;
  if (M.level.input === M.level.code) { M.events.push('code:ok'); M.win('CORRECT!', 'Sharp eyes. Or a quick thumb on the pause button. I do not judge.'); return; }
  M.level.misses++;
  M.wrong(M.level.misses === 1 ? 'Fast, wasn\\'t it. If only there were a way to stop time.' : 'The pause button is right there, candidate. I am not supposed to say that.');
  M.level.code = genCode(); M.level.waitMs = randWait(); show('waiting');
}
$('submit22').onclick = submit;
document.addEventListener('keydown', (e) => {
  if (M.level.phase !== 'input' || M.paused || M.solved || M.ended) return;
  if (e.key === 'Backspace') { M.level.input = M.level.input.slice(0, -1); renderSlots(); e.preventDefault(); }
  else if (e.key === 'Enter') { submit(); e.preventDefault(); }
  else if (/^[0-9]$/.test(e.key) && M.level.input.length < CODE_LEN) { M.level.input += e.key; renderSlots(); e.preventDefault(); }
});
let last = 0;
function loop(ts) {
  const dt = last ? Math.min(50, ts - last) : 0; last = ts;
  if (!M.paused && !M.solved && !M.ended && (M.level.phase === 'waiting' || M.level.phase === 'flash')) {
    M.level.elapsed += dt;
    if (M.level.phase === 'waiting' && M.level.elapsed >= M.level.waitMs) show('flash');
    else if (M.level.phase === 'flash' && M.level.elapsed >= FLASH_MS) show('input');
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
M.onPause = () => { if (M.level.phase === 'flash') { M.level.pausedInFlash = true; frame.classList.add('pausedflash'); document.querySelector('.pauseov .cart').textContent = 'EXAMINATION SUSPENDED (CONVENIENT)'; M.events.push('paused:flash'); } };
M.onResume = () => { if (frame.classList.contains('pausedflash')) { frame.classList.remove('pausedflash'); document.querySelector('.pauseov .cart').textContent = 'EXAMINATION SUSPENDED'; M.retype('did you catch that?? You paused. I saw.'); } };
M.retype('did you catch that??');
`,
};
