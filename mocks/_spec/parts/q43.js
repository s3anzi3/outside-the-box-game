module.exports = {
  q: 43,
  title: 'OtB · Q.43 Ghost Continue Mock (current theme)',
  h1: 'Q.43 · Ghost Continue · NEW CONCEPT',
  sub: `Fully playable. Replaces spot-the-difference. The paper says "Await instructions." and nothing arrives. The examiner is silent for eight seconds, then offers "...", then "Nothing new has arrived," then "Something old has not left." What has not left is the previous question's CONTINUE button: it is still faintly burned into the paper at exactly the spot where every win screen has put it, at thirty percent opacity, and it still works. Click it and the item passes: "Corporate never cleared the last screen. You used it. That was the instruction." A small REFRESH button costs a heart and only makes the ghost fainter. New concept built from the win screen itself, the one piece of furniture every player has pressed forty-two times without looking at it. Timers pause with the exam.`,
  css: `
  .q43await{position:absolute; left:0; right:0; top:12%; text-align:center; font-family:var(--mono); font-size:13px; letter-spacing:.18em; color:var(--fgDim);}
  .ghostbtn{position:absolute; left:50%; top:65%; transform:translate(-50%,-50%); width:200px; height:52px; font-size:21px; padding:0;
    opacity:.30; filter:blur(.35px); box-shadow:none; transition:opacity .4s;}
  .ghostbtn:hover{opacity:.36; background:var(--bg); color:var(--ink); border-color:var(--stroke);}
  .q43refresh{position:absolute; right:26px; bottom:22px; height:38px; font-size:12px;}
`,
  html: `
      <div class="q43await">AWAIT&nbsp;INSTRUCTIONS.</div>
      <button class="btn ghostbtn" id="ghost">CONTINUE&nbsp;&nbsp;→</button>
      <button class="btn mono q43refresh" id="refreshBtn">⟳ REFRESH</button>
`,
  js: `
M.q = 43; M.next = 44; M.nextName = 'Sign the Confession';
M.level = { elapsed: 0, stage: 0, refreshes: 0 };
const ghost = $('ghost');
const OPS = [.30, .22, .15, .10];
ghost.onclick = () => { if (M.solved || M.ended || M.paused) return; M.events.push('ghost'); M.win('CONTINUED.', 'Corporate never cleared the last screen. You used it. That was the instruction.'); };
$('refreshBtn').onclick = () => {
  if (M.solved || M.ended || M.paused) return;
  M.level.refreshes++; ghost.style.opacity = OPS[Math.min(M.level.refreshes, OPS.length - 1)];
  M.wrong(M.level.refreshes === 1 ? 'That refreshed nothing. The ghost is fainter now.' : 'Every refresh makes it fainter. Stop.');
};
const LINES = [[8, '...'], [16, 'Nothing new has arrived.'], [26, 'Something old has not left.'], [40, 'The last screen\\'s CONTINUE button is still there. Faintly. It still works.']];
$('remarks').innerHTML = '<span class="cursor">|</span>';
setInterval(() => {
  if (M.paused || M.solved || M.ended) return;
  M.level.elapsed += 0.5;
  const next = LINES[M.level.stage];
  if (next && M.level.elapsed >= next[0]) { M.level.stage++; M.retype(next[1]); }
}, 500);
`,
};
