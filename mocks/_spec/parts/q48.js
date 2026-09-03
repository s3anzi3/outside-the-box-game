module.exports = {
  q: 48,
  title: 'OtB · Q.48 The Cheat Mock (current theme)',
  h1: 'Q.48 · The Cheat · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level48.ts: "What is the correct answer to this question?" with the admission underneath that there is not a fair one. YES, NO, MAYBE and 42 each slam INCORRECT and cost a heart. Below them pulses a dark red ⛔ CHEAT button, the forbidden control the exam has been training you toward since the Q20 OVERRIDE and Q21's "maybe this time you need to cheat". Press it and the item passes, stamped CHEATED in green. Kept as-is; it is the payoff of the whole exam. The footer line is from the real build: "You've earned the right to break one rule. Take it."`,
  css: `
  .q48q{position:absolute; left:0; right:0; top:10%; text-align:center; font-family:var(--display); font-weight:bold; font-size:26px; color:var(--ink);}
  .q48sub{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--body); font-size:14px; color:var(--fgDim);}
  .q48traps{position:absolute; left:50%; top:36%; transform:translateX(-50%); display:flex; gap:32px;}
  .q48traps .btn{width:168px; height:60px; font-size:22px; padding:0;}
  .cheat{position:absolute; left:50%; top:66%; transform:translateX(-50%); width:272px; height:60px; font-size:22px; padding:0; color:#ffe0e0; border-color:#3a0d0d;
    animation:cheatpulse 1.6s ease-in-out infinite;}
  .cheat:hover{color:#fff; border-color:#3a0d0d; animation-play-state:paused; background:#B4342A;}
  @keyframes cheatpulse{0%,100%{background:#7A1E1E} 50%{background:#B4342A}}
  .q48foot{position:absolute; left:0; right:0; top:90%; text-align:center; font-family:var(--body); font-size:13px; color:var(--fgDim);}
`,
  html: `
      <div class="q48q">What is the correct answer to this question?</div>
      <div class="q48sub">(there isn't one. not a fair one, anyway.)</div>
      <div class="q48traps" id="traps"></div>
      <button class="btn cheat" id="cheatBtn">⛔&nbsp; CHEAT</button>
      <div class="q48foot">You've earned the right to break one rule. Take it.</div>
`,
  js: `
M.q = 48; M.next = 49; M.nextName = 'The Lock';
const REMARKS = ['No. There is no fair answer. I told you that.', 'Still no. You know what to do.', 'The red one. The one they told you never to press.'];
M.level = { fails: 0 };
['YES', 'NO', 'MAYBE', '42'].forEach(lab => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = lab; b.id = 'trap' + lab;
  b.onclick = () => { if (M.solved || M.ended || M.paused) return; M.level.fails++; M.wrong(REMARKS[Math.min(M.level.fails - 1, REMARKS.length - 1)]); };
  $('traps').appendChild(b);
});
$('cheatBtn').onclick = () => { if (M.solved || M.ended || M.paused) return; M.events.push('cheat'); M.win('YOU CHEATED.', 'There was never a fair answer. The exam taught you to stop playing fair.', 'CHEATED'); };
M.retype('There is no fair answer to this one. None. You know what to do. Do the thing they told you never to do.');
`,
};
