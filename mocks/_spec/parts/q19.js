module.exports = {
  q: 19,
  title: 'OtB · Q.19 The Pattern Mock (current theme)',
  h1: 'Q.19 · The Pattern · TYPE-IN REWORK',
  sub: `Fully playable. Reworked per your verdict: "O T T F F S S ?" with a blank to type into instead of answer buttons. Only a capital E is accepted. A lowercase e costs a heart ("Case matters. This is an examination."), 8 or "eight" costs a heart ("Say them out loud. Then write the first letter. Capital."), and anything else costs a heart with the opening hint repeated. Enter or SUBMIT both work. The examiner's remark is the real Q19 copy.`,
  css: `
  .q19prompt{position:absolute; left:0; right:0; top:10%; text-align:center; font-family:var(--mono); font-size:13px; letter-spacing:.16em; color:var(--fgDim);}
  .q19seq{position:absolute; left:0; right:0; top:20%; text-align:center; font-family:var(--display); font-weight:bold; font-size:64px; letter-spacing:.18em; color:var(--ink);}
  .q19seq span{color:var(--accent);}
  .typein{position:absolute; left:50%; top:54%; transform:translateX(-50%); width:200px; height:58px; background:var(--bg); border:1.5px solid var(--hairline); border-radius:5px;
    font-family:var(--display); font-weight:bold; font-size:30px; color:var(--ink); text-align:center; outline:none; user-select:text;}
  .typein:focus{border:3px solid var(--accent);}
  .typein::placeholder{color:var(--hairline); font-weight:normal;}
  .q19submit{position:absolute; left:50%; top:76%; transform:translateX(-50%); width:200px; height:48px; font-size:18px; padding:0;}
  .q19note{position:absolute; left:0; right:0; top:92%; text-align:center; font-family:var(--mono); font-size:10px; letter-spacing:.14em; color:var(--fgDim);}
`,
  html: `
      <div class="q19prompt">COMPLETE&nbsp;THE&nbsp;SEQUENCE</div>
      <div class="q19seq">O T T F F S S <span>?</span></div>
      <input class="typein" id="answerInput" placeholder="…" autocomplete="off" spellcheck="false" maxlength="8">
      <button class="btn q19submit" id="submitBtn">SUBMIT →</button>
      <div class="q19note">WRITE YOUR ANSWER IN THE SPACE PROVIDED</div>
`,
  js: `
M.q = 19; M.next = 20; M.nextName = 'System Breach';
M.level = { fails: 0, answer: 'E' };
const input = $('answerInput');
function submit() {
  if (M.solved || M.ended || M.paused) return;
  const raw = input.value; const v = raw.trim();
  if (!v) return;
  M.events.push('typed:' + v);
  if (v === 'E') return M.win('E.', 'One, Two, Three, Four, Five, Six, Seven. Eight. Capital E, as written.');
  input.value = ''; M.level.fails++;
  if (v === 'e') M.wrong('Case matters. This is an examination.');
  else if (v === '8' || v.toLowerCase() === 'eight') M.wrong('Say them out loud. Then write the first letter. Capital.');
  else if (v.toLowerCase() === 'n' || v.toLowerCase() === 't') M.wrong('That is a letter. Not the right one. Count.');
  else M.wrong('Say them out loud, candidate.');
  input.focus();
}
$('submitBtn').onclick = submit;
input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); submit(); } });
setTimeout(() => input.focus(), 300);
M.retype('Continue the pattern. It is not what it looks like. Say them out loud, candidate.');
`,
};
