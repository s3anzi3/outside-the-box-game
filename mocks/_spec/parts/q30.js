module.exports = {
  q: 30,
  title: 'OtB · Q.30 Checkpoint Mock (current theme)',
  h1: 'Q.30 · Checkpoint · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level30.ts: the halfway checkpoint asks which colour the examiner leaked back at Question 16, with four colour buttons in the fountain-pen ink palette. BLUE wins; anything else slams INCORRECT, costs a heart, and earns "I told you. Between us. The system was glitching." Kept as a calm callback level. One joke added: the examiner's typewriter starts to say "The answer is BLU", visibly backspaces, and covers with "Corporate says I am not allowed to say it twice." A gold HALFWAY seal sits on the paper. Win copy from the real build: "Halfway there. Twenty-five questions left, and they get stranger."`,
  css: `
  .directive.q30{position:absolute; left:0; right:0; top:9%;}
  .q30prompt{position:absolute; left:0; right:0; top:20%; text-align:center; font-family:var(--display); font-size:30px; color:var(--ink); line-height:1.35; padding:0 140px;}
  .halfseal{position:absolute; right:34px; top:22px; width:92px; height:92px; transform:rotate(-12deg); opacity:.9;}
  .answers.q30 .btn{width:160px; height:60px; color:#F7F1E3; text-shadow:0 1px 1px rgba(0,0,0,.25); border-color:var(--stroke); font-size:21px;}
  .answers.q30 .btn:hover{filter:brightness(1.08);}
  .btn.red{background:#C03A2E;} .btn.blue{background:#2E6BA8;} .btn.green{background:#3F8F55;} .btn.yellow{background:#D8A81F;}
  .btn.red:hover{background:#C03A2E;} .btn.blue:hover{background:#2E6BA8;} .btn.green:hover{background:#3F8F55;} .btn.yellow:hover{background:#D8A81F;}
`,
  html: `
      <div class="directive q30">CHECKPOINT&nbsp;·&nbsp;ITEM&nbsp;30&nbsp;OF&nbsp;50</div>
      <svg class="halfseal" viewBox="0 0 92 92"><circle cx="46" cy="46" r="42" fill="none" stroke="#B0892F" stroke-width="2.5" stroke-dasharray="4 2.4"/><circle cx="46" cy="46" r="34" fill="rgba(176,137,47,.10)" stroke="#B0892F" stroke-width="1"/><text x="46" y="43" text-anchor="middle" font-family="Courier New,monospace" font-size="11" font-weight="bold" fill="#B0892F" letter-spacing="2">HALFWAY</text><text x="46" y="57" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-style="italic" fill="#B0892F">25 of 50</text></svg>
      <div class="q30prompt">Back at Question 16, I told you which one to pick.<br>Which was it?</div>
      <div class="answers q30" id="answers"></div>
`,
  js: `
M.q = 30; M.next = 31; M.nextName = 'Lights Out';
[['RED', 'red'], ['BLUE', 'blue'], ['GREEN', 'green'], ['YELLOW', 'yellow']].forEach(([lab, cls]) => {
  const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = lab; b.id = 'ans' + lab;
  b.onclick = () => { if (M.solved || M.ended || M.paused) return; if (lab === 'BLUE') M.win('YOU REMEMBERED.', 'Halfway there. Twenty-five questions left, and they get stranger.'); else M.wrong('I told you. Between us. The system was glitching.'); };
  $('answers').appendChild(b);
});
// typewriter with a slip: types the answer, backspaces it, covers.
const el = $('remarks');
const A = 'Checkpoint. Past the halfway mark of your certification. Quick: were you actually listening to me earlier? The answer is BLU';
const CUT = 'The answer is BLU'.length;
const B = 'Corporate says I am not allowed to say it twice.';
let i = 0, phase = 0, shown = '';
clearInterval(M._typeT);
M._typeT = setInterval(() => {
  if (phase === 0) { i++; shown = A.slice(0, i); if (i >= A.length) { phase = 1; i = 0; } }
  else if (phase === 1) { i++; shown = A.slice(0, A.length - i); if (i >= CUT) { phase = 2; i = 0; } }
  else { i++; shown = A.slice(0, A.length - CUT) + B.slice(0, i); if (i >= B.length) { clearInterval(M._typeT); M.events.push('remark:slip'); } }
  el.innerHTML = esc(shown) + '<span class="cursor">|</span>';
}, phase === 1 ? 45 : 22);
`,
};
