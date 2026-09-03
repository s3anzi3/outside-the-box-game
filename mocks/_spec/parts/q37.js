module.exports = {
  q: 37,
  title: 'OtB · Q.37 Trim Marks Mock (current theme)',
  h1: 'Q.37 · Trim Marks · NEW CONCEPT',
  sub: `Fully playable. Replaces count-the-squares. The paper says "The answer to this item is 14. Submit it." and offers 9, 12, 16 and 20, with a fifth button visibly sliced off by the paper's right edge. A mono footer admits that Corporate printed the wrong buttons. Every printed button costs a heart. The oxblood corner ticks that have framed every question since Q1 are crop marks, and crop marks set the trim: grab either right-hand tick and drag it outward and the paper physically widens into the desk margin, revealing the button that was trimmed off in printing: 14. Click it. New concept built from the corner ticks, which no level has ever touched. The hint ladder reaches "drag a right-hand corner tick outward" by the third failure; the ticks also pulse once after twenty idle seconds.`,
  css: `
  .paper{transition:none;}
  .directive.q37{position:absolute; left:0; right:0; top:9%;}
  .q37prompt{position:absolute; left:0; right:0; top:19%; text-align:center; font-family:var(--display); font-size:36px; color:var(--ink);}
  .q37foot{position:absolute; left:0; right:0; top:82%; text-align:center; font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:var(--fgDim); white-space:nowrap;}
  .q37row{position:absolute; left:0; top:52%; height:58px; width:1300px;}
  .q37row .btn{position:absolute; top:0; width:150px; height:58px; font-size:25px; padding:0;}
  .handle{position:absolute; width:40px; height:40px; z-index:4; cursor:default; touch-action:none;}
  .handle.tr{right:-16px; top:-16px;} .handle.br{right:-16px; bottom:-16px;}
  .tick.pulse{animation:tickpulse 1.2s ease-in-out 2;}
  @keyframes tickpulse{0%,100%{border-color:var(--accent)} 50%{border-color:var(--seal); transform:scale(1.6)}}
  .tick.tr.pulse{transform-origin:top right;} .tick.br.pulse{transform-origin:bottom right;}
`,
  html: `
      <div class="directive q37">SUBMIT&nbsp;THE&nbsp;ANSWER</div>
      <div class="q37prompt">The answer to this item is 14. Submit it.</div>
      <div class="q37row" id="q37row"></div>
      <div class="q37foot">CORPORATE PRINTED THE WRONG BUTTONS. CORPORATE HAS BEEN INFORMED.</div>
`,
  js: `
M.q = 37; M.next = 38; M.nextName = 'The Other Button';
M.level = { ext: 0, fails: 0, elapsed: 0, pulsed: false, maxExt: 110 };
const paper = $('paper'), frame = $('frame');
const BASE_W = 1049.6;                       // 82% of 1280, the paper's normal width
paper.style.width = BASE_W + 'px';

const LABELS = [9, 12, 16, 20, 14];
const XS = [256, 442, 628, 814, 1000];       // the 14 starts inside the trim and ends past it
LABELS.forEach((n, i) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = n; b.id = 'ans' + n; b.style.left = XS[i] + 'px';
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (n === 14) return M.win('UNTRIMMED.', 'The fifth button was printed. It was just outside the trim. Corporate saves on paper.');
    M.level.fails++;
    M.wrong();
    const L = ['Corporate trimmed the page. The fifth button did not survive.', 'The little marks in the corners are crop marks. They set the trim.', 'Drag a right-hand corner tick outward. The page grows. The 14 is there.'];
    setTimeout(() => { if (!M.solved && !M.ended) M.retype(L[Math.min(M.level.fails - 1, L.length - 1)]); }, 700);
  };
  $('q37row').appendChild(b);
});

// crop-mark handles on the two right-hand ticks
const fpt = (e) => { const r = frame.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1280 / r.width, y: (e.clientY - r.top) * 860 / r.height }; };
let drag = null;
['tr', 'br'].forEach(pos => {
  const hnd = document.createElement('div'); hnd.className = 'handle ' + pos; hnd.id = 'handle' + pos.toUpperCase(); paper.appendChild(hnd);
  hnd.addEventListener('pointerdown', (e) => { if (M.solved || M.ended || M.paused) return; drag = { x0: fpt(e).x, ext0: M.level.ext }; hnd.setPointerCapture(e.pointerId); e.preventDefault(); });
  hnd.addEventListener('pointermove', (e) => { if (!drag) return; setExt(drag.ext0 + (fpt(e).x - drag.x0)); });
  const up = () => { if (!drag) return; drag = null; if (M.level.ext > 20) M.events.push('trimmed:' + Math.round(M.level.ext)); };
  hnd.addEventListener('pointerup', up); hnd.addEventListener('pointercancel', up);
});
function setExt(v) {
  M.level.ext = Math.max(0, Math.min(M.level.maxExt, v));
  paper.style.width = (BASE_W + M.level.ext) + 'px';
  if (M.level.ext > 60 && !M.level.saidGrow) { M.level.saidGrow = true; M.retype('...The page is growing. I was told that was not possible.'); }
}
M.retype('The answer is 14. Submit it. Something on this row looks cut off.');
setInterval(() => {
  if (M.paused || M.solved || M.ended) return;
  M.level.elapsed += 0.5;
  if (M.level.elapsed >= 20 && !M.level.pulsed) { M.level.pulsed = true; document.querySelectorAll('.tick.tr,.tick.br').forEach(t => t.classList.add('pulse')); }
}, 500);
`,
};
