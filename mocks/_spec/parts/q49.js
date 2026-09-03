module.exports = {
  q: 49,
  title: 'OtB · Q.49 The Lock Mock (current theme)',
  h1: 'Q.49 · The Lock · RANDOMISED REWORK',
  sub: `Fully playable. Reworked per your verdict: the lock now draws three clues at random from a pool of twenty callbacks spanning the whole exam (the die at Q13, points to beat Frodrick at Q6, the calculus answer at Q9, seconds on the do-nothing clock at Q17, hearts in the HUD at Q34, mouse buttons at Q38, and so on), in a random order, so the code is different every time and there are thousands of combinations. Every digit is still something you already answered. Three tumbler dials with ▲ ▼ (the mouse wheel spins them too), SUBMIT, a wrong code clunks and costs a heart. Quirks kept: the examiner faces each dial as it lands on its digit and the caption turns to COMBINATION once all three are right. Reload the page for a different set.`,
  css: `
  .q49q{position:absolute; left:0; right:0; top:6%; text-align:center; font-family:var(--display); font-weight:bold; font-size:23px; color:var(--ink);}
  .q49clues{position:absolute; left:12%; right:12%; top:17%; font-family:var(--body); font-size:14px; line-height:1.75; color:var(--fgMid);}
  .q49clues b{font-family:var(--mono); font-weight:normal; color:var(--fgDim); margin-right:6px;}
  .dials{position:absolute; left:50%; top:47%; transform:translateX(-50%); display:flex; gap:52px;}
  .dial{width:125px; display:flex; flex-direction:column; align-items:center; gap:4px;}
  .dial .btn{width:125px; height:30px; font-size:16px; padding:0;}
  .dial .digit{width:125px; height:68px; background:var(--bg); border:2.5px solid var(--stroke); display:flex; align-items:center; justify-content:center;
    font-family:var(--display); font-weight:bold; font-size:40px; color:var(--ink); cursor:ns-resize;}
  .q49submit{position:absolute; left:50%; top:84%; transform:translateX(-50%); width:250px; height:48px; font-size:18px; padding:0;}
`,
  html: `
      <div class="q49q">Enter the code. You already know every digit.</div>
      <div class="q49clues" id="clues"></div>
      <div class="dials" id="dials"></div>
      <button class="btn q49submit" id="submitBtn">SUBMIT</button>
`,
  js: `
M.q = 49; M.next = 50; M.nextName = 'Your Name';
const POOL = [
  ['the face you turned up on the loaded die (Q13)', 6],
  ['how many hearts the entry fee charged you (Q42)', 1],
  ['how many digits "1 + 1" had in binary (Q18)', 2],
  ['points needed to beat Frodrick at pong (Q6)', 3],
  ['the number you clicked after erasing every F (Q7)', 0],
  ['the answer to the calculus item (Q9)', 9],
  ['seconds on the clock you were told to do nothing about (Q17)', 7],
  ['stamps on the desk at your self-assessment (Q29)', 2],
  ['hearts in your HUD the day one did not belong (Q34)', 4],
  ['rounds of the institutional Simon (Q35)', 3],
  ['buttons printed on the trimmed page, counting the one past the trim (Q37)', 5],
  ['buttons on your mouse (Q38)', 2],
  ['the alphabet position of the letter the invigilator issued (Q39)', 4],
  ['suspects with alibis in the incident report (Q44)', 3],
  ['lines on the page whose facts you changed (Q47)', 2],
  ['rules you were told you could break at the end (Q48)', 1],
  ['gates in the maze that only existed in one light (Q25)', 3],
  ['conditions on the vault (Q23)', 2],
  ['letters in the word you typed instead of clicking (Q27)', 8],
  ['refreshes it took to use the ghost button (Q43)', 0],
];
const pool = POOL.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
const CLUES = pool.slice(0, 3); const CODE = CLUES.map(c => c[1]);
M.level = { digits: [0, 0, 0], code: CODE, clues: CLUES.map(c => c[0]) };
$('clues').innerHTML = CLUES.map((c, i) => '<div><b>DIGIT ' + (i + 1) + '</b>' + c[0] + '</div>').join('');
const FACE = ['Left', 'Down', 'Right'];
const digitEls = [];
[0, 1, 2].forEach(i => {
  const d = document.createElement('div'); d.className = 'dial';
  const up = document.createElement('button'); up.className = 'btn'; up.textContent = '▲'; up.id = 'up' + i;
  const dg = document.createElement('div'); dg.className = 'digit'; dg.id = 'digit' + i; dg.textContent = '0';
  const dn = document.createElement('button'); dn.className = 'btn'; dn.textContent = '▼'; dn.id = 'down' + i;
  up.onclick = () => spin(i, 1); dn.onclick = () => spin(i, -1);
  dg.addEventListener('wheel', (e) => { e.preventDefault(); spin(i, e.deltaY < 0 ? 1 : -1); }, { passive: false });
  d.append(up, dg, dn); $('dials').appendChild(d); digitEls.push(dg);
});
function spin(i, dir) {
  if (M.solved || M.ended || M.paused) return;
  M.level.digits[i] = (M.level.digits[i] + dir + 10) % 10; digitEls[i].textContent = M.level.digits[i];
  if (M.level.digits[i] === CODE[i]) { $('examinerImg').src = '../public/assets/Player/Player_' + FACE[i] + '.png'; setTimeout(() => $('examinerImg').src = '../public/assets/Player/Player_Down.png', 500); }
  const all = M.level.digits.every((v, j) => v === CODE[j]);
  $('caption').innerHTML = all ? '·&nbsp;&nbsp;COMBINATION&nbsp;&nbsp;·' : '·&nbsp;&nbsp;EXAMINATION PAPER&nbsp;&nbsp;·';
  if (all) M.events.push('code:set');
}
$('submitBtn').onclick = () => {
  if (M.solved || M.ended || M.paused) return;
  if (M.level.digits.every((v, j) => v === CODE[j])) M.win('UNLOCKED.', CODE.join(' · ') + '. Every digit something you already knew. One question left.');
  else M.wrong('Clunk. That is not it. Every digit is something you already answered.');
};
M.retype('One lock before the end. Every digit is an answer you already gave. You have everything you need. Set the code.');
`,
};
