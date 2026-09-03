module.exports = {
  q: 39,
  title: 'OtB · Q.39 Issued to the Invigilator Mock (current theme)',
  h1: 'Q.39 · Issued to the Invigilator · NEW CONCEPT (v2)',
  sub: `Fully playable. Reworked per your verdict: D is not the answer until you make it one from the pause menu. The paper says the instruction has been issued to the invigilator and offers A B C D; every button, D included, costs a heart while the instruction is unissued ("That has not been issued yet."). Open the pause menu: the INVIGILATOR OVERRIDE field reads "Q.39: PRESS D · NOT YET ISSUED", and the › button beside it, which no level has ever used, is the invigilator's signature. Press it and the field flips to ISSUED with a green tick, the examiner confirms, and only now does D pass. The hint ladder walks from "nothing on this paper is valid until the invigilator signs it" to naming the › button by the third failure. Pausing is free.`,
  css: `
  .directive.q39{position:absolute; left:0; right:0; top:10%;}
  .q39prompt{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--display); font-size:30px; color:var(--ink); line-height:1.35; padding:0 120px;}
  .q39prompt small{display:block; margin-top:14px; font-family:var(--mono); font-size:12px; letter-spacing:.14em; color:var(--fgDim);}
  .pauseov .cheat.unissued{color:var(--fgDim); font-size:13px; white-space:nowrap; overflow:hidden;}
  .pauseov .cheat.issued{color:var(--pass); font-weight:bold; font-size:13px; white-space:nowrap;}
  .pauseov .cheatgo.pulse{animation:gopulse 1.4s ease-in-out 3;}
  @keyframes gopulse{0%,100%{box-shadow:none} 50%{box-shadow:0 0 0 5px rgba(212,176,90,.55)}}
  .pauseov .cheatgo.done{background:var(--pass); color:#fff;}
`,
  html: `
      <div class="directive q39">INSTRUCTION&nbsp;WITHHELD</div>
      <div class="q39prompt">The instruction for this question has been issued to the invigilator.<small>SELECT THE INDICATED BUTTON</small></div>
      <div class="answers" id="answers"></div>
`,
  js: `
M.q = 39; M.next = 40; M.nextName = 'Hold to Reboot';
M.level = { fails: 0, issued: false, opened: false };
const L = ['Not yet. The instruction is in the suspension screen, waiting for a signature.', 'Pause. Find the invigilator\\'s box. Press the button beside it.', 'It says PRESS D. Press the › to issue it. Then press D.'];
['A', 'B', 'C', 'D'].forEach((lab) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = lab; b.id = 'ans' + lab;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (lab === 'D' && M.level.issued) return M.win('ISSUED.', 'The instruction was real once the invigilator signed it. That button has now been used exactly once.');
    M.level.fails++;
    M.wrong(lab === 'D' && !M.level.issued ? 'That has not been issued yet.' : undefined);
    setTimeout(() => { if (!M.solved && !M.ended) M.retype(L[Math.min(M.level.fails - 1, L.length - 1)]); }, 700);
  };
  $('answers').appendChild(b);
});
const box = $('cheatBox'), go = $('cheatGo');
box.textContent = 'PRESS D · NOT YET ISSUED'; box.classList.add('unissued');
box.onclick = () => M.retype('That is my box. It needs a signature. The button beside it.');
go.onclick = () => {
  if (M.level.issued) return;
  M.level.issued = true; M.events.push('issued');
  box.textContent = '✓ PRESS D · ISSUED'; box.classList.remove('unissued'); box.classList.add('issued'); go.classList.remove('pulse'); go.classList.add('done');
  M.retype('Issued. The invigilator has signed it. D is now a real answer.');
};
M.onPause = () => { if (!M.level.opened) { M.level.opened = true; go.classList.add('pulse'); } };
M.retype('Issued to the invigilator. Nothing on this paper is valid until the invigilator signs it.');
`,
};
