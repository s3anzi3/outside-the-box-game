module.exports = {
  q: 41,
  title: 'OtB · Q.41 Reply Mock (current theme)',
  h1: 'Q.41 · Reply · NEW CONCEPT',
  sub: `Fully playable. Replaces the anagram. The paper says only "Reply to the examiner." There are no buttons and no field. In the remarks panel the examiner says "State your answer. I am listening." and the caret that has blinked at the end of his every remark for forty questions is, today, a live text cursor. Click his remarks (or just start typing) and your letters appear inside his remarks as dictation; press Enter and he replies "Received. I have written it down as my own." and the item passes. Any answer works; the content was never the point. Pressing Enter on nothing gets "Say something. Anything. It is not graded." Clicking the paper three times starts a hint ladder that ends with "It has always been a cursor." Nothing on this level costs a heart. It is the Act V breather after Hold to Reboot, and the first level where the remarks panel takes input.`,
  css: `
  .q41prompt{position:absolute; left:0; right:0; top:40%; text-align:center; font-family:var(--display); font-size:40px; color:var(--ink);}
  .remarks{cursor:text;}
  .dict{color:var(--accent);}
  .hintline{display:block; margin-top:4px; color:var(--fgMid); font-size:15px;}
  .remarks.focus .cursor{animation-duration:.6s;}
  #replyInput{position:absolute; left:-9999px; top:0; opacity:0;}
`,
  html: `
      <div class="q41prompt">Reply to the examiner.</div>
`,
  js: `
M.q = 41; M.next = 42; M.nextName = 'Entry Fee';
M.level = { text: '', paperClicks: 0, done: false };
const remarks = $('remarks');
const input = document.createElement('input'); input.id = 'replyInput'; input.autocomplete = 'off'; $('frame').appendChild(input);
const LINE = 'State your answer. I am listening.';
function render(hint) {
  remarks.innerHTML = esc(LINE) + ' <span class="dict" id="dict">' + esc(M.level.text) + '</span><span class="cursor">|</span>' + (hint ? '<span class="hintline" id="hintline">' + esc(hint) + '</span>' : '');
}
// type line 1 once, then hand the caret over
let i = 0; clearInterval(M._typeT);
M._typeT = setInterval(() => { i++; if (i >= LINE.length) { clearInterval(M._typeT); render(''); M.level.ready = true; return; } remarks.innerHTML = esc(LINE.slice(0, i)) + '<span class="cursor">|</span>'; }, 22);
let hintText = '';
function hint(t) { hintText = t; M.events.push('remark:' + t); render(t); }

const focus = () => { input.focus(); remarks.classList.add('focus'); };
$('bottom').addEventListener('click', (e) => { if (e.target.closest('.hearts')) return; focus(); });
document.addEventListener('keydown', (e) => {
  if (M.solved || M.ended || M.paused || !M.level.ready) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!M.level.text.trim()) { hint('Say something. Anything. It is not graded.'); return; }
    M.level.done = true; M.events.push('reply:' + M.level.text);
    hint('Received. I have written it down as my own.');
    setTimeout(() => M.win('DICTATED.', 'Your answer is now part of the examiner\\'s remarks. He will claim it was his.'), 1100);
    return;
  }
  if (e.key === 'Backspace') { e.preventDefault(); M.level.text = M.level.text.slice(0, -1); render(hintText); return; }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && M.level.text.length < 60) { e.preventDefault(); M.level.text += e.key; remarks.classList.add('focus'); render(hintText); }
});
$('play').addEventListener('click', () => {
  if (M.solved || M.ended) return;
  M.level.paperClicks++;
  if (M.level.paperClicks === 3) hint('There is nothing on the paper to press. Look at where the cursor is.');
  if (M.level.paperClicks === 5) hint('My remarks have a blinking line at the end. It is a cursor. It has always been a cursor.');
  if (M.level.paperClicks === 7) hint('Click my remarks. Type anything. Press Enter.');
});
`,
};
