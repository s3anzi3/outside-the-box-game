module.exports = {
  q: 18,
  title: 'OtB · Q.18 Binary Logic Mock (current theme)',
  h1: 'Q.18 · Binary Logic · TYPE-IN REWORK',
  sub: `Fully playable. Reworked per your verdict: the base-2 fine print is gone and so are the multiple-choice buttons. The paper shows only "1 + 1 = ?" and a blank to type into. The only hint is the examiner, who mentions in passing that the machine grading this counts in binary. Type 2 and it slams INCORRECT with "Two. The machine disagrees. It only knows two digits." Type 10 and it passes. Anything else costs a heart with a drier line. Enter or SUBMIT both work. Q49's lock can still draw on this item (the digits in "10" are two).`,
  css: `
  .q18prompt{position:absolute; left:0; right:0; top:16%; text-align:center; font-family:var(--display); font-weight:bold; font-size:72px; color:var(--ink);}
  .typein{position:absolute; left:50%; top:52%; transform:translateX(-50%); width:260px; height:58px; background:var(--bg); border:1.5px solid var(--hairline); border-radius:5px;
    font-family:var(--display); font-weight:bold; font-size:30px; color:var(--ink); text-align:center; outline:none; user-select:text;}
  .typein:focus{border:3px solid var(--accent);}
  .typein::placeholder{color:var(--hairline); font-weight:normal;}
  .q18submit{position:absolute; left:50%; top:74%; transform:translateX(-50%); width:200px; height:48px; font-size:18px; padding:0;}
  .q18note{position:absolute; left:0; right:0; top:91%; text-align:center; font-family:var(--mono); font-size:10px; letter-spacing:.14em; color:var(--fgDim);}
`,
  html: `
      <div class="q18prompt">1 &nbsp;+&nbsp; 1 &nbsp;=&nbsp; ?</div>
      <input class="typein" id="answerInput" placeholder="…" autocomplete="off" spellcheck="false" maxlength="6">
      <button class="btn q18submit" id="submitBtn">SUBMIT →</button>
      <div class="q18note">WRITE YOUR ANSWER IN THE SPACE PROVIDED</div>
`,
  js: `
M.q = 18; M.next = 19; M.nextName = 'The Pattern';
M.level = { fails: 0, answer: '10' };
const input = $('answerInput');
function submit() {
  if (M.solved || M.ended || M.paused) return;
  const v = input.value.trim();
  if (!v) return;
  M.events.push('typed:' + v);
  if (v === '10') return M.win('TEN.', 'One plus one is 10. In the only language the grader speaks.');
  input.value = ''; M.level.fails++;
  if (v === '2') M.wrong('Two. The machine disagrees. It only knows two digits.');
  else if (/^0b?10$/i.test(v) || v.toLowerCase() === 'ten') M.wrong('Close. Write it the way the machine would.');
  else M.wrong(M.level.fails < 2 ? 'That is not even close.' : 'One plus one. Think like the machine. It has exactly two digits to work with.');
  input.focus();
}
$('submitBtn').onclick = submit;
input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); submit(); } });
setTimeout(() => input.focus(), 300);
M.retype('Simple arithmetic. One plus one. ...the machine that grades this counts in binary, by the way. Not that it matters.');
`,
};
