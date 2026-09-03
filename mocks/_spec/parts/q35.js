module.exports = {
  q: 35,
  title: 'OtB · Q.35 Institutional Simon Mock (current theme)',
  h1: 'Q.35 · Institutional Simon · TWIST',
  sub: `Fully playable. Keeps the Simon memory test and throws away the four panels. The paper says "Watch. Then repeat." and then the game's own chrome performs the sequence: the logo, the Q.35 label, the pause button, the examiner sprite and the hearts row light up in turn with a gold halo. Your turn: click those actual pieces of furniture in the same order. None of them have ever been clickable (except pause, which today is part of the instrument and refuses to pause: "I disabled it. Do not tell corporate."). Three rounds of 3, 4 and 5; a wrong click slams INCORRECT, costs a heart, and replays the same round. Twist on the existing Level35.ts: same rounds and same failure rule, but "attention to detail" now means attention to the frame. Because the pause control is repurposed, this is the one level where pausing is deliberately unavailable.`,
  css: `
  .directive.q35{position:absolute; left:0; right:0; top:10%;}
  .q35prompt{position:absolute; left:0; right:0; top:24%; text-align:center; font-family:var(--display); font-size:44px; color:var(--ink);}
  .q35state{position:absolute; left:0; right:0; top:50%; text-align:center; font-family:var(--mono); font-size:14px; letter-spacing:.18em; color:var(--fgDim);}
  .q35state b{color:var(--accent); font-weight:normal;}
  .q35dots{position:absolute; left:0; right:0; top:64%; display:flex; justify-content:center; gap:14px;}
  .q35dots i{width:12px; height:12px; border-radius:50%; border:1.5px solid var(--hairline); background:transparent;}
  .q35dots i.on{background:var(--seal); border-color:var(--seal);}
  .q35dots i.bad{background:var(--danger); border-color:var(--danger);}

  /* the instrument: chrome pieces glow */
  .glowable{transition:box-shadow .18s, transform .18s, filter .18s;}
  .logo img.glow{filter:drop-shadow(0 0 4px #D4B05A) drop-shadow(0 0 16px rgba(212,176,90,.95)); transform:scale(1.06);}
  .logo img{transition:filter .18s, transform .18s;}
  #qnum.glow{color:var(--seal); text-shadow:0 0 10px rgba(212,176,90,.9), 0 0 2px #D4B05A; transform:translateY(-50%) scale(1.12);}
  #qnum{transition:color .18s, text-shadow .18s, transform .18s;}
  #pauseBtn.glow{box-shadow:0 0 0 3px #D4B05A, 0 0 18px rgba(212,176,90,.95);}
  #examiner.glow img{filter:drop-shadow(0 0 3px #D4B05A) drop-shadow(0 0 14px rgba(212,176,90,.95)); transform:scale(1.12);}
  #examiner img{transition:filter .18s, transform .18s;}
  #heartRow.glow{filter:drop-shadow(0 0 3px #D4B05A) drop-shadow(0 0 12px rgba(212,176,90,.95)); transform:scale(1.08);}
  #heartRow{transition:filter .18s, transform .18s;}
  .frame.input #qnum, .frame.input .logo img, .frame.input #examiner, .frame.input #heartRow{cursor:pointer;}
`,
  html: `
      <div class="directive q35">ATTENTION&nbsp;TO&nbsp;DETAIL</div>
      <div class="q35prompt">Watch. Then repeat.</div>
      <div class="q35state" id="q35state">ROUND 1 OF 3 &nbsp;·&nbsp; <b>WATCH</b></div>
      <div class="q35dots" id="q35dots"></div>
`,
  js: `
M.q = 35; M.next = 36; M.nextName = 'Recommended';
const KEYS = { logo: document.querySelector('.logo img'), qnum: $('qnum'), pause: $('pauseBtn'), examiner: $('examiner'), hearts: $('heartRow') };
const NAMES = Object.keys(KEYS);
const ROUNDS = [3, 4, 5];
M.level = { round: 0, sequence: [], idx: 0, state: 'idle', keys: NAMES, pauseTold: false };
const frame = $('frame');

function setState(st, label) { M.level.state = st; $('q35state').innerHTML = 'ROUND ' + (M.level.round + 1) + ' OF 3 &nbsp;·&nbsp; <b>' + label + '</b>'; frame.classList.toggle('input', st === 'input'); }
function dots(n, upto, bad) { const d = $('q35dots'); d.innerHTML = ''; for (let i = 0; i < n; i++) { const el = document.createElement('i'); if (i < upto) el.className = 'on'; if (bad === i) el.className = 'bad'; d.appendChild(el); } }
function glow(name, ms) { const el = KEYS[name]; el.classList.add('glow'); return new Promise(r => setTimeout(() => { el.classList.remove('glow'); setTimeout(r, 250); }, ms)); }
function makeSequence(len) { const seq = []; while (seq.length < len) { const k = NAMES[Math.floor(Math.random() * NAMES.length)]; if (seq[seq.length - 1] !== k) seq.push(k); } return seq; }

async function playRound(fresh) {
  if (fresh) M.level.sequence = makeSequence(ROUNDS[M.level.round]);
  M.level.idx = 0; setState('watch', 'WATCH'); dots(M.level.sequence.length, 0);
  await new Promise(r => setTimeout(r, 900));
  for (const k of M.level.sequence) { if (M.solved || M.ended) return; await glow(k, 600); }
  setState('input', 'YOUR TURN');
  M.events.push('input:' + M.level.round);
}
function press(name) {
  if (M.level.state !== 'input' || M.solved || M.ended) return;
  const want = M.level.sequence[M.level.idx];
  if (name !== want) {
    dots(M.level.sequence.length, M.level.idx, M.level.idx);
    setState('replay', 'AGAIN');
    M.level.fails = (M.level.fails || 0) + 1;
    M.wrong(M.level.fails === 1 ? 'The paper is not the instrument. Look at everything that glowed.' : 'The logo. The item number. The pause control. Me. Your hearts. All of them accept a click today.');
    setTimeout(() => { if (!M.ended) playRound(false); }, 1400);
    return;
  }
  KEYS[name].classList.add('glow'); setTimeout(() => KEYS[name].classList.remove('glow'), 220);
  M.level.idx++; dots(M.level.sequence.length, M.level.idx);
  if (M.level.idx >= M.level.sequence.length) {
    M.level.round++;
    if (M.level.round >= ROUNDS.length) { setState('done', 'COMPLETE'); setTimeout(() => M.win('ATTENTIVE.', 'You played the examination like an instrument. Corporate is measuring that too.'), 500); }
    else { setState('watch', 'WATCH'); setTimeout(() => playRound(true), 900); }
  }
}
// wire the furniture; the pause control belongs to the instrument on this level
for (const name of NAMES) {
  const el = KEYS[name];
  if (name === 'pause') {
    el.onclick = () => {
      if (M.level.state === 'input') return press('pause');
      if (!M.level.pauseTold) { M.level.pauseTold = true; M.retype('The suspension control is part of the instrument today. I disabled it. Do not tell corporate.'); }
    };
  } else el.addEventListener('click', () => press(name));
}
M.retype("A simple test of focus. Corporate insists on measuring 'attention to detail.' Watch what lights up. Then touch it, in order.");
setTimeout(() => playRound(true), 2600);
`,
};
