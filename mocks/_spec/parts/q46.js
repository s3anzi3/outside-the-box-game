module.exports = {
  q: 46,
  title: 'OtB · Q.46 Recall Mock (current theme)',
  h1: 'Q.46 · Recall · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level46.ts: a memory check that points back at Question 11's loading bar, the one that froze at 99%. Four answers: WAITED IT OUT, PRESSED RETRY, DRAGGED IT, REFRESHED THE PAGE. DRAGGED IT wins; the others slam INCORRECT and cost a heart. Kept as a calm callback level. Small additions: a tiny frozen 99% bar sits in the corner of the paper as a memento, the DRAGGED IT button shows the grab cursor on hover, and the win screen carries a miniature bar at 100% captioned "Still 100%. You're welcome." Win copy from the real build: "The loading bar was never going to finish on its own. You did."`,
  css: `
  .directive.q46{position:absolute; left:0; right:0; top:8%;}
  .q46prompt{position:absolute; left:0; right:0; top:17%; text-align:center; font-family:var(--display); font-size:27px; color:var(--ink); line-height:1.4; padding:0 130px;}
  .memento{position:absolute; right:30px; top:22px; width:120px; font-family:var(--mono); font-size:9px; letter-spacing:.14em; color:var(--fgDim); text-align:center;}
  .memento .bar{height:8px; border:1.5px solid var(--stroke); margin-top:5px; position:relative; background:var(--bg);}
  .memento .bar i{position:absolute; left:0; top:0; bottom:0; width:99%; background:var(--accent);}
  .q46grid{position:absolute; left:50%; top:52%; transform:translateX(-50%); display:grid; grid-template-columns:repeat(2, 300px); gap:18px 28px;}
  .q46grid .btn{height:58px; font-size:19px;}
  #ansDRAG:hover{cursor:grab;}
  .minibar{width:220px; font-family:var(--mono); font-size:10px; letter-spacing:.12em; color:var(--fgDim); text-align:center;}
  .minibar .bar{height:8px; border:1.5px solid var(--stroke); margin:6px 0; position:relative; background:var(--bg);}
  .minibar .bar i{position:absolute; left:0; top:0; bottom:0; width:100%; background:var(--pass);}
`,
  html: `
      <div class="directive q46">MEMORY&nbsp;CHECK</div>
      <div class="memento">EXHIBIT Q.11<div class="bar"><i></i></div>99%</div>
      <div class="q46prompt">Cast your mind back to Question 11. The loading bar that refused to finish.<br>How did you beat it?</div>
      <div class="q46grid" id="answers"></div>
`,
  js: `
M.q = 46; M.next = 47; M.nextName = 'Change the Facts';
[['WAITED IT OUT', 'WAIT'], ['PRESSED RETRY', 'RETRY'], ['DRAGGED IT', 'DRAG'], ['REFRESHED THE PAGE', 'REFRESH']].forEach(([lab, id]) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = lab; b.id = 'ans' + id;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (id !== 'DRAG') return M.wrong(id === 'RETRY' ? 'Retry cost you a heart then too. Some people never learn.' : 'It never finished on its own. You know that.');
    const mini = document.createElement('div'); mini.className = 'minibar'; mini.innerHTML = 'LOADING<div class="bar"><i></i></div>100% · STILL 100%. YOU ARE WELCOME.';
    $('winscreen').insertBefore(mini, $('winContinue'));
    M.win('YOU DRAGGED IT.', 'The loading bar was never going to finish on its own. You did.');
  };
  $('answers').appendChild(b);
});
M.retype('A memory check. Cast your mind back to Question 11. That loading bar that refused to finish... how did you beat it?');
`,
};
