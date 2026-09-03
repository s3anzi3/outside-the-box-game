module.exports = {
  q: 36,
  title: 'OtB · Q.36 Recommended Mock (current theme)',
  h1: 'Q.36 · Recommended · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level36.ts: "7 × 8 = ?" with four options, 54, 56, 49 and 64. The exam has already selected 54 and labelled it RECOMMENDED; a CONFIRM SELECTION button submits whatever is highlighted. Confirming the recommendation slams INCORRECT and costs a heart ("Corporate has never once multiplied anything."). Select 56 and confirm to pass. Kept as a calm distrust-the-default level in Act IV. One joke added: when you select 56 the RECOMMENDED tag slides across to sit over your answer and gains "(revised)", and the examiner admits "It was always 56. The tag is decorative." Win copy from the real build.`,
  css: `
  .q36prompt{position:absolute; left:0; right:0; top:12%; text-align:center; font-family:var(--display); font-weight:bold; font-size:52px; color:var(--ink);}
  .q36opts{position:absolute; left:50%; top:44%; transform:translateX(-50%); display:flex; gap:32px;}
  .q36opts .btn{width:168px; height:70px; font-size:26px; padding:0; position:relative;}
  .q36opts .btn.sel{background:rgba(62,107,79,.16); box-shadow:0 0 0 4px var(--pass), 0 3px 9px var(--shadow);}
  .q36opts .btn.sel:hover{color:var(--ink); border-color:var(--stroke);}
  .rectag{position:absolute; top:-22px; width:168px; text-align:center; font-family:var(--mono); font-weight:bold; font-size:10px; letter-spacing:.12em; color:var(--seal); transition:left .45s cubic-bezier(.5,0,.3,1); pointer-events:none; white-space:nowrap;}
  .q36confirm{position:absolute; left:50%; top:74%; transform:translateX(-50%); width:300px; height:50px; font-size:16px; padding:0;}
  .q36foot{position:absolute; left:0; right:0; top:91%; text-align:center; font-family:var(--body); font-size:13px; color:var(--fgDim);}
`,
  html: `
      <div class="q36prompt">7 &nbsp;×&nbsp; 8 &nbsp;=&nbsp; ?</div>
      <div class="q36opts" id="opts"><div class="rectag" id="rectag">RECOMMENDED BY CORPORATE</div></div>
      <button class="btn q36confirm" id="confirmBtn">CONFIRM SELECTION</button>
      <div class="q36foot">The exam has already chosen for you. It is wrong.</div>
`,
  js: `
M.q = 36; M.next = 37; M.nextName = 'Trim Marks';
const OPTIONS = ['54', '56', '49', '64'];
M.level = { selected: 0, fails: 0 };
const opts = $('opts'), tag = $('rectag');
const btns = OPTIONS.map((lab, i) => {
  const b = document.createElement('button'); b.className = 'btn' + (i === 0 ? ' sel' : ''); b.textContent = lab; b.id = 'opt' + lab;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    M.level.selected = i; btns.forEach((x, j) => x.classList.toggle('sel', j === i));
    if (i === 1 && !M.level.revised) { M.level.revised = true; tag.style.left = (200 * 1) + 'px'; tag.textContent = 'RECOMMENDED BY CORPORATE (REVISED)'; M.retype('It was always 56. The tag is decorative.'); M.events.push('revised'); }
  };
  opts.appendChild(b); return b;
});
tag.style.left = '0px';
$('confirmBtn').onclick = () => {
  if (M.solved || M.ended || M.paused) return;
  if (M.level.selected === 1) return M.win('OVERRIDDEN.', 'The exam recommended 54. You knew better: 7 × 8 = 56.');
  M.level.fails++;
  M.wrong(M.level.fails === 1 ? 'Corporate has never once multiplied anything.' : 'The recommendation is wrong. Pick what you KNOW is right, then confirm.');
};
M.retype("The exam has pre-selected an answer for you. Do not trust it. It's lying, candidate. Pick what you KNOW is right.");
`,
};
