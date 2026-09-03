module.exports = {
  q: 47,
  title: 'OtB · Q.47 Change the Facts Mock (current theme)',
  h1: 'Q.47 · Change the Facts · TWIST',
  sub: `Fully playable. Keeps the Müller-Lyer illusion and removes the honest answer. Two lines with fins, exactly equal, with a live length readout under each. Buttons TOP, BOTTOM and SAME, except SAME is greyed out "(unavailable in your region)" and costs a heart. TOP or BOTTOM while the lines are equal also cost a heart. Each line's endpoints carry small handles: drag one and the line changes length, the readout follows, and once a line is at least twenty millimetres longer the matching button becomes true and passes the item. If the truthful answer is not on the form, you change the facts to fit the form. Twist on the existing illusion level; same drawing, but the puzzle is no longer "which is longer" but "why can't I say so". The hint ladder reaches "grab the end of the top line" by the third failure.`,
  css: `
  .directive.q47{position:absolute; left:0; right:0; top:7%;}
  .q47prompt{position:absolute; left:0; right:0; top:14%; text-align:center; font-family:var(--display); font-size:32px; color:var(--ink);}
  .q47svg{position:absolute; left:0; top:0; width:100%; height:100%;}
  .q47svg line.main{stroke:var(--ink); stroke-width:3; stroke-linecap:round;}
  .q47svg polyline{fill:none; stroke:var(--ink); stroke-width:3; stroke-linecap:round; stroke-linejoin:round;}
  .q47svg circle.h{fill:var(--panel); stroke:var(--hairline); stroke-width:1.5; cursor:ew-resize; transition:stroke .15s, r .15s;}
  .q47svg circle.h:hover, .q47svg circle.h.drag{stroke:var(--accent); r:9;}
  .q47svg text{font-family:var(--mono); font-size:11px; letter-spacing:.12em; fill:var(--fgDim);}
  .answers.q47{gap:28px;}
  .answers.q47 .btn{width:170px; font-size:20px;}
  .btn.unavail{opacity:.45; cursor:not-allowed; position:relative;}
  .btn.unavail:hover{background:var(--bg); color:var(--ink); border-color:var(--stroke);}
  .unavail-note{position:absolute; left:50%; transform:translateX(-50%); top:100%; margin-top:6px; font-family:var(--mono); font-size:9px; letter-spacing:.1em; color:var(--fgDim); white-space:nowrap;}
`,
  html: `
      <div class="directive q47">PERCEPTION</div>
      <div class="q47prompt">Which line is longer?</div>
      <svg class="q47svg" id="lines" viewBox="0 0 1044 381"></svg>
      <div class="answers q47" id="answers"></div>
`,
  js: `
M.q = 47; M.next = 48; M.nextName = 'The Cheat';
const NS = 'http://www.w3.org/2000/svg';
const svg = $('lines');
const LINES = { top: { y: 122, x1: 342, x2: 702, fin: 'in' }, bottom: { y: 206, x1: 342, x2: 702, fin: 'out' } };
M.level = { lines: LINES, fails: 0, touched: false };
const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
const parts = {};
for (const k of ['top', 'bottom']) {
  parts[k] = { line: mk('line', { class: 'main' }), finL: mk('polyline', {}), finR: mk('polyline', {}), h1: mk('circle', { class: 'h', r: 7, 'data-line': k, 'data-end': 'x1' }), h2: mk('circle', { class: 'h', r: 7, 'data-line': k, 'data-end': 'x2' }), label: mk('text', { 'text-anchor': 'middle' }) };
}
const mm = (L) => Math.round((L.x2 - L.x1) * 142 / 360);
function draw() {
  for (const k of ['top', 'bottom']) {
    const L = LINES[k], p = parts[k], d = L.fin === 'in' ? -22 : 22;
    p.line.setAttribute('x1', L.x1); p.line.setAttribute('x2', L.x2); p.line.setAttribute('y1', L.y); p.line.setAttribute('y2', L.y);
    p.finL.setAttribute('points', (L.x1 - d) + ',' + (L.y - 20) + ' ' + L.x1 + ',' + L.y + ' ' + (L.x1 - d) + ',' + (L.y + 20));
    p.finR.setAttribute('points', (L.x2 + d) + ',' + (L.y - 20) + ' ' + L.x2 + ',' + L.y + ' ' + (L.x2 + d) + ',' + (L.y + 20));
    p.h1.setAttribute('cx', L.x1); p.h1.setAttribute('cy', L.y); p.h2.setAttribute('cx', L.x2); p.h2.setAttribute('cy', L.y);
    p.label.setAttribute('x', (L.x1 + L.x2) / 2); p.label.setAttribute('y', L.y + 40); p.label.textContent = mm(L) + ' MM';
  }
}
draw();
let drag = null;
const svgPt = (e) => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) * 1044 / r.width; };
svg.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('circle.h'); if (!h || M.solved || M.ended || M.paused) return;
  drag = { L: LINES[h.dataset.line], end: h.dataset.end, el: h }; h.classList.add('drag'); h.setPointerCapture(e.pointerId); e.preventDefault();
});
svg.addEventListener('pointermove', (e) => {
  if (!drag) return; const x = svgPt(e); const L = drag.L;
  if (drag.end === 'x1') L.x1 = Math.max(60, Math.min(L.x2 - 80, x)); else L.x2 = Math.min(984, Math.max(L.x1 + 80, x));
  if (!M.level.touched) { M.level.touched = true; M.events.push('touched'); M.retype('...You are moving the question. Nobody said you could. Nobody said you could not.'); }
  draw();
});
const up = () => { if (!drag) return; drag.el.classList.remove('drag'); drag = null; };
svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);

const L = ['They are equal and you cannot say so. That is the situation.', 'Nothing on this page is fixed. Not even the question.', 'Grab the end of the top line. Make it longer. Then say it is.'];
function fail(line) { M.level.fails++; M.wrong(); const t = line || L[Math.min(M.level.fails - 1, L.length - 1)]; setTimeout(() => { if (!M.solved && !M.ended) M.retype(t); }, 700); }
const diff = () => (LINES.top.x2 - LINES.top.x1) - (LINES.bottom.x2 - LINES.bottom.x1);
[['TOP', () => diff() >= 20], ['BOTTOM', () => diff() <= -20], ['SAME', null]].forEach(([lab, ok]) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = lab; b.id = 'ans' + lab;
  if (!ok) { b.classList.add('unavail'); const n = document.createElement('span'); n.className = 'unavail-note'; n.textContent = '(UNAVAILABLE IN YOUR REGION)'; b.appendChild(n); }
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (!ok) return fail('Unavailable. In your region.');
    if (ok()) M.win('AMENDED.', 'You changed the facts to fit the buttons. Corporate does this every quarter.');
    else fail();
  };
  $('answers').appendChild(b);
});
M.retype("Which line is longer? Don't trust your eyes. SAME is unavailable in your region.");
`,
};
