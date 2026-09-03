module.exports = {
  q: 33,
  title: 'OtB · Q.33 Misplaced Mock (current theme)',
  h1: 'Q.33 · Misplaced · TWIST',
  sub: `Fully playable. Keeps "one word on this page is wrong" but drops the misspelling. The paragraph is flawless Institute boilerplate, except that the word "because" is sitting in the middle of a sentence where it makes no sense. Meanwhile the examiner's own remark has a hole in it: "Read it like it matters, ______ it does." Every word can be picked up. Clicking a word accuses it and costs a heart (clicking "because" is free: "That is the word. It is not wrong. It is lost."). Drag any other word into the examiner's gap and he rejects it with a heart: "That is not my word." Drag "because" down into the gap and his sentence completes, the paragraph closes up, and the item passes. Twist on the old proofreading level; the wrong word is the examiner's, and the fix is handing it back. The remarks panel becomes a drop target for the first time.`,
  css: `
  .directive.q33{position:absolute; left:0; right:0; top:8%;}
  .doc{position:absolute; left:50%; top:22%; transform:translateX(-50%); width:820px; padding:28px 36px 30px;
    border:1.5px solid var(--hairline); background:var(--bg); font-family:var(--display); font-size:21px; line-height:1.65; color:var(--ink); text-align:justify;}
  .doc .w{display:inline-block; padding:0 2px; border-radius:3px; cursor:grab; transition:background .15s;}
  .doc .w:hover{background:rgba(122,46,46,.10);}
  .doc .w.lifted{opacity:.25;}
  .doc .w.gone{display:none;}
  .ghost{position:absolute; z-index:9; pointer-events:none; font-family:var(--display); font-size:21px; color:var(--ink);
    background:var(--panel); padding:2px 8px; border:1.5px solid var(--stroke); border-radius:4px; box-shadow:0 8px 16px rgba(40,25,5,.3); transform:translate(-50%,-50%) rotate(-3deg);}
  .gap{display:inline-block; min-width:44px; height:20px; border-bottom:2px solid var(--fgDim); vertical-align:-3px; margin:0 3px; transition:background .15s, border-color .15s;}
  .gap.hot{background:rgba(122,46,46,.14); border-color:var(--accent);}
  .gap.filled{border-bottom:none; min-width:0; height:auto; color:var(--accent); font-style:italic;}
  .hintline{display:block; margin-top:4px; color:var(--fgMid); font-size:15px;}
`,
  html: `
      <div class="directive q33">QUALITY&nbsp;CONTROL</div>
      <div class="doc" id="doc"></div>
`,
  js: `
M.q = 33; M.next = 34; M.nextName = 'The Fourth Heart';
M.level = { fails: 0, dragging: null };

const TEXT = 'The Institute of Lateral Cognition certifies candidates on the basis of demonstrated thinking. Each item is reviewed twice. Results are final. The Institute because issues certificates annually, and reserves the right to revise any verdict without notice. Candidates who disagree with a verdict may submit an appeal in writing, which will be read, filed, and forgotten in that order.';
const doc = $('doc');
TEXT.split(' ').forEach((w, i) => {
  const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.dataset.w = w.replace(/[^A-Za-z]/g, '').toLowerCase(); s.dataset.i = i;
  doc.appendChild(s); doc.appendChild(document.createTextNode(' '));
});

// remarks: a permanent first line with the gap, and a typed hint line under it
const remarks = $('remarks');
const LINE1 = 'Quality control. One word on this page is wrong. Read it like it matters, ______ it does.';
function typeLine1() {
  clearInterval(M._typeT);
  let i = 0;
  M._typeT = setInterval(() => {
    i++;
    if (i >= LINE1.length) {
      clearInterval(M._typeT);
      remarks.innerHTML = 'Quality control. One word on this page is wrong. Read it like it matters, <span class="gap" id="gap"></span> it does. <span class="cursor">|</span><span class="hintline" id="hintline"></span>';
      return;
    }
    remarks.innerHTML = LINE1.slice(0, i) + '<span class="cursor">|</span>';
  }, 22);
}
typeLine1();
function hint(text) {
  const el = $('hintline'); if (!el) { M.retype(text); return; }
  M.events.push('remark:' + text);
  clearInterval(M._hintT); let i = 0;
  M._hintT = setInterval(() => { i++; el.textContent = text.slice(0, i); if (i >= text.length) clearInterval(M._hintT); }, 22);
}
const LADDER = [
  'Wrong is not the same as misspelled. Some words are simply not where they belong.',
  'I seem to be missing one. Look at my remarks. Look at the gap.',
  'The word because is in your paragraph. It is mine. Drag it down here.',
];
const failed = (line) => { M.level.fails++; M.wrong(); const l = line || LADDER[Math.min(M.level.fails - 1, LADDER.length - 1)]; setTimeout(() => { if (!M.solved && !M.ended) hint(l); }, 700); };

const frame = $('frame');
const fpt = (e) => { const r = frame.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1280 / r.width, y: (e.clientY - r.top) * 860 / r.height }; };
let ghost = null;
doc.addEventListener('pointerdown', (e) => {
  const w = e.target.closest('.w'); if (!w || M.solved || M.ended || M.paused) return;
  const p = fpt(e);
  M.level.dragging = { w, x0: p.x, y0: p.y, moved: false };
  w.setPointerCapture(e.pointerId); e.preventDefault();
});
doc.addEventListener('pointermove', (e) => {
  const d = M.level.dragging; if (!d) return;
  const p = fpt(e);
  if (!d.moved && Math.hypot(p.x - d.x0, p.y - d.y0) > 6) {
    d.moved = true; d.w.classList.add('lifted');
    ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.textContent = d.w.textContent; frame.appendChild(ghost);
  }
  if (d.moved) {
    ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
    const g = $('gap'); if (g) g.classList.toggle('hot', overGap(p));
  }
});
function overGap(p) {
  const g = $('gap'); if (!g) return false;
  const r = g.getBoundingClientRect(), f = frame.getBoundingClientRect();
  const sx = 1280 / f.width, sy = 860 / f.height;
  const box = { l: (r.left - f.left) * sx - 24, t: (r.top - f.top) * sy - 18, r: (r.right - f.left) * sx + 24, b: (r.bottom - f.top) * sy + 18 };
  return p.x >= box.l && p.x <= box.r && p.y >= box.t && p.y <= box.b;
}
const release = (e) => {
  const d = M.level.dragging; if (!d) return;
  M.level.dragging = null;
  const p = fpt(e);
  const isBecause = d.w.dataset.w === 'because';
  if (!d.moved) {
    // a click accuses the word
    if (isBecause) hint('That is the word. It is not wrong. It is lost.');
    else failed();
    return;
  }
  d.w.classList.remove('lifted'); if (ghost) { ghost.remove(); ghost = null; }
  const g = $('gap'); if (g) g.classList.remove('hot');
  if (overGap(p)) {
    if (isBecause) solve(d.w);
    else failed('That is not my word.');
  }
};
doc.addEventListener('pointerup', release);
doc.addEventListener('pointercancel', release);

function solve(w) {
  M.events.push('returned');
  w.classList.add('gone');
  const g = $('gap'); g.textContent = 'because'; g.classList.add('filled');
  hint('...Thank you. That is mine.');
  setTimeout(() => M.win('RETURNED.', 'The word was fine. It was in the wrong paragraph. Corporate calls that a typo.'), 900);
}
`,
};
