module.exports = {
  q: 29,
  title: 'OtB · Q.29 Self-Assessment Mock (current theme)',
  h1: 'Q.29 · Self-Assessment · NEW CONCEPT',
  sub: `Fully playable. Replaces the 2 + 2 × 2 order-of-operations riddle. The paper shows one statement, "The candidate has answered Question 29 correctly," and asks you to grade it. There are no answer buttons. Two rubber stamps sit on the desk beside the paper: the game's own INCORRECT and CORRECT stamps, with handles. Drag one onto the statement to stamp it. The honest instinct is to stamp it INCORRECT (you have not answered anything yet), which slams the red impression, costs a heart, and earns "Honesty noted. Standing reduced." SUBMIT FOR GRADING is free once ("The examiner is on break. Grade it yourself.") and costs a heart after that. Stamping the statement CORRECT makes it true, because that is how grading works, and passes the item. New concept, built from the stamp furniture that no level has ever let you hold. The examiner's remarks escalate toward the answer after each failure.`,
  css: `
  .directive.q29{position:absolute; left:0; right:0; top:9%;}
  .statement{position:absolute; left:50%; top:24%; transform:translateX(-50%); width:720px; padding:26px 34px;
    border:2px solid var(--stroke); background:var(--bg); font-family:var(--display); font-size:29px; line-height:1.3;
    text-align:center; color:var(--ink); box-shadow:0 3px 9px var(--shadow); transition:background .4s, border-color .4s;}
  .statement.true{background:rgba(62,107,79,.10); border-color:var(--pass);}
  .grade{position:absolute; left:0; right:0; top:62%; text-align:center; font-family:var(--mono); font-size:13px; letter-spacing:.14em; color:var(--fgDim);}
  .submitrow{position:absolute; left:0; right:0; bottom:8%; display:flex; justify-content:center;}
  .submitrow .btn{height:44px; font-size:13px;}

  /* rubber stamps on the desk (live in the frame, outside the paper) */
  .rstamp{position:absolute; width:74px; height:96px; cursor:grab; z-index:4; touch-action:none; user-select:none;
    filter:drop-shadow(0 6px 8px rgba(40,25,5,.35)); transition:transform .15s;}
  .rstamp.drag{cursor:grabbing; transform:scale(1.06) rotate(-4deg); z-index:9; filter:drop-shadow(0 16px 18px rgba(40,25,5,.45));}
  .rstamp .handle{position:absolute; left:26px; top:0; width:22px; height:44px; border-radius:11px 11px 4px 4px;
    background:linear-gradient(90deg,#8a5a2b,#c9915a 45%,#8a5a2b); border:1px solid #4a2e12;}
  .rstamp .neck{position:absolute; left:19px; top:42px; width:36px; height:12px; background:#5a3a1a; border-radius:3px;}
  .rstamp .base{position:absolute; left:0; top:52px; width:74px; height:30px; border-radius:4px; background:linear-gradient(#3a2b22,#241a14); border:1px solid #120c08;}
  .rstamp .plate{position:absolute; left:6px; top:58px; width:62px; height:18px; background:var(--panel); border:1px solid var(--stroke); border-radius:2px;
    font-family:var(--mono); font-weight:bold; font-size:8.5px; letter-spacing:.06em; text-align:center; line-height:16px;}
  .rstamp .rubber{position:absolute; left:2px; top:82px; width:70px; height:10px; background:#9a2b25; border-radius:2px; opacity:.85;}
  .rstamp.good .rubber{background:#3E6B4F;}
  .rstamp .plate{color:var(--danger);} .rstamp.good .plate{color:var(--pass);}
  .desklbl{position:absolute; left:1178px; top:172px; width:90px; text-align:center; font-family:var(--mono); font-size:9px; letter-spacing:.14em; color:var(--fgDim);}

  /* impressions left on the paper */
  .imp{position:absolute; transform:translate(-50%,-50%) rotate(var(--rot)); border:4px solid var(--danger); border-radius:8px; color:var(--danger);
    font-family:var(--mono); font-weight:bold; font-size:34px; letter-spacing:.1em; padding:12px 26px; z-index:4; pointer-events:none;
    background:rgba(251,248,239,.35); animation:impSlam .5s ease-out both;}
  .imp::after{content:""; position:absolute; inset:5px; border:1.5px solid currentColor; border-radius:5px;}
  .imp.pass{border-color:var(--pass); color:var(--pass);}
  @keyframes impSlam{0%{opacity:0; transform:translate(-50%,-50%) rotate(var(--rot)) scale(1.5);} 30%{opacity:1; transform:translate(-50%,-50%) rotate(var(--rot)) scale(.97);} 100%{opacity:.92; transform:translate(-50%,-50%) rotate(var(--rot)) scale(1);}}
`,
  html: `
      <div class="directive q29">SELF-ASSESSMENT</div>
      <div class="statement" id="statement">The candidate has answered Question 29 correctly.</div>
      <div class="grade">GRADE THIS STATEMENT.</div>
      <div class="submitrow"><button class="btn mono" id="submitBtn">SUBMIT FOR GRADING</button></div>
`,
  js: `
M.q = 29; M.next = 30; M.nextName = 'Checkpoint';
M.level = { fails: 0, submits: 0, stamped: [] };

const LADDER = [
  'Grade the statement. The stamps are on the desk.',
  'You marked yourself wrong. I have recorded that you agree with me.',
  'There is a second stamp. It is green. Nobody uses it.',
  'Stamp the statement CORRECT. It becomes true when you do. That is how grading works.',
];
M.retype(LADDER[0]);
const ladder = () => M.retype(LADDER[Math.min(M.level.fails, LADDER.length - 1)]);

// the two rubber stamps live on the desk in the frame's right margin
const frame = $('frame'), paper = $('paper'), statement = $('statement');
const lbl = document.createElement('div'); lbl.className = 'desklbl'; lbl.textContent = 'GRADING STAMPS'; frame.appendChild(lbl);
const HOME = { INCORRECT: { x: 1186, y: 200 }, CORRECT: { x: 1186, y: 330 } };
const mkStamp = (kind) => {
  const s = document.createElement('div');
  s.className = 'rstamp' + (kind === 'CORRECT' ? ' good' : ''); s.id = 'stamp' + kind; s.dataset.kind = kind;
  s.innerHTML = '<div class="handle"></div><div class="neck"></div><div class="base"></div><div class="plate">' + kind + '</div><div class="rubber"></div>';
  s.style.left = HOME[kind].x + 'px'; s.style.top = HOME[kind].y + 'px';
  frame.appendChild(s);
  return s;
};
const stamps = { INCORRECT: mkStamp('INCORRECT'), CORRECT: mkStamp('CORRECT') };

// frame-unit coordinates from a pointer event (the frame scales with the page)
const fpt = (e) => { const r = frame.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1280 / r.width, y: (e.clientY - r.top) * 860 / r.height }; };
let drag = null;
for (const s of Object.values(stamps)) {
  s.addEventListener('pointerdown', (e) => {
    if (M.solved || M.ended || M.paused) return;
    const p = fpt(e);
    drag = { el: s, dx: p.x - parseFloat(s.style.left), dy: p.y - parseFloat(s.style.top) };
    s.classList.add('drag'); s.setPointerCapture(e.pointerId); e.preventDefault();
  });
  s.addEventListener('pointermove', (e) => {
    if (!drag || drag.el !== s) return;
    const p = fpt(e);
    s.style.left = (p.x - drag.dx) + 'px'; s.style.top = (p.y - drag.dy) + 'px';
  });
  const release = (e) => {
    if (!drag || drag.el !== s) return;
    s.classList.remove('drag'); drag = null;
    // the rubber face is the bottom of the stamp; test that point against the statement box
    const rubberX = parseFloat(s.style.left) + 37, rubberY = parseFloat(s.style.top) + 88;
    const pr = paper.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    const sx = 1280 / fr.width, sy = 860 / fr.height;
    const sr = statement.getBoundingClientRect();
    const box = { l: (sr.left - fr.left) * sx, t: (sr.top - fr.top) * sy, r: (sr.right - fr.left) * sx, b: (sr.bottom - fr.top) * sy };
    if (rubberX >= box.l && rubberX <= box.r && rubberY >= box.t - 12 && rubberY <= box.b + 12) stampStatement(s.dataset.kind, rubberX, rubberY);
    goHome(s);
  };
  s.addEventListener('pointerup', release);
  s.addEventListener('pointercancel', release);
}
function goHome(s) { const h = HOME[s.dataset.kind]; s.style.transition = 'left .35s, top .35s'; s.style.left = h.x + 'px'; s.style.top = h.y + 'px'; setTimeout(() => s.style.transition = '', 400); }

function stampStatement(kind, fx, fy) {
  if (M.solved || M.ended) return;
  // impression lands on the paper at the rubber's position (paper-relative units)
  const imp = document.createElement('div');
  imp.className = 'imp' + (kind === 'CORRECT' ? ' pass' : '');
  imp.style.setProperty('--rot', ((Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 5)).toFixed(1) + 'deg');
  imp.style.left = (fx - 115) + 'px'; imp.style.top = (fy - 122 - 10) + 'px';
  imp.textContent = kind;
  paper.appendChild(imp);
  M.level.stamped.push(kind);
  M.events.push('impression:' + kind);
  if (kind === 'INCORRECT') {
    M.loseLife();
    M.level.fails++;
    M.retype(M.level.fails === 1 ? 'Honesty noted. Standing reduced.' : LADDER[Math.min(M.level.fails, LADDER.length - 1)]);
    if (M.level.fails === 1) setTimeout(() => { if (!M.solved && !M.ended) ladder(); }, 3200);
  } else {
    statement.classList.add('true');
    setTimeout(() => M.win('SELF-CERTIFIED.', 'The statement was false until you stamped it. Corporate calls this empowerment.'), 500);
  }
}

$('submitBtn').onclick = () => {
  if (M.solved || M.ended) return;
  M.level.submits++;
  if (M.level.submits === 1) { M.retype('The examiner is on break. Grade it yourself.'); return; }
  M.level.fails++;
  M.wrong();
  setTimeout(() => { if (!M.solved && !M.ended) ladder(); }, 900);
};
`,
};
