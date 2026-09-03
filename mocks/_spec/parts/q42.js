module.exports = {
  q: 42,
  title: 'OtB · Q.42 Entry Fee Mock (current theme)',
  h1: 'Q.42 · Entry Fee · NEW CONCEPT',
  sub: `Fully playable. Replaces "how many times can you subtract 5 from 25". The paper opens with "This item costs one heart to open," and one of your hearts lifts out of CANDIDATE STANDING and flies onto the paper, where it sits in a printed box marked FEE; the HUD shows the empty slot with the note ONE ON THE PAPER. Then the question: "How many hearts has this item cost you?" with 0, 1, 2 and 3. The overthinking instinct (it is a trick, so 0; it will cost more, so 2) is the trap and costs a real heart. The answer is 1, read straight off the fee box. On the win the fee flies home and is refunded: "Corporate is trialling admission charges for questions." The answer stays 1, so Q49's lock keeps its middle digit ("how many hearts Q.42 charged you"). New concept built from the hearts HUD. While the fee is on the paper you are playing with two hearts, which is the point.`,
  css: `
  .q42open{position:absolute; left:0; right:0; top:30%; text-align:center; font-family:var(--display); font-size:34px; color:var(--ink); transition:opacity .5s;}
  .q42q{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--display); font-size:34px; color:var(--ink); opacity:0; transition:opacity .6s;}
  .q42q small{display:block; margin-top:10px; font-family:var(--mono); font-size:12px; letter-spacing:.14em; color:var(--fgDim);}
  .feebox{position:absolute; right:54px; top:26px; width:96px; height:78px; border:1.5px solid var(--hairline); border-radius:4px; background:var(--bg);}
  .feebox span{position:absolute; left:0; right:0; top:-8px; text-align:center; font-family:var(--mono); font-size:9px; letter-spacing:.18em; color:var(--fgDim);}
  .feebox span b{background:var(--panel); padding:0 6px; font-weight:normal;}
  .flyer{position:absolute; width:32px; height:29px; z-index:9; filter:drop-shadow(0 2px 3px rgba(60,45,20,.25)); transition:left 1s cubic-bezier(.4,.1,.3,1), top 1s cubic-bezier(.3,.6,.4,1); pointer-events:none;}
  .flyer path{fill:var(--accent); stroke:var(--accentDeep); stroke-width:1.5;}
  .hp.onpaper{visibility:hidden;}
  .hudnote{font-family:var(--mono); font-size:9px; letter-spacing:.14em; color:var(--fgDim); margin-top:6px; height:12px;}
  .answers.q42{opacity:0; transition:opacity .6s;}
  .answers.q42.show, .q42q.show{opacity:1;}
`,
  html: `
      <div class="q42open" id="q42open">This item costs one heart to open.</div>
      <div class="feebox" id="feebox"><span><b>FEE</b></span></div>
      <div class="q42q" id="q42q">How many hearts has this item cost you?<small>SELECT THE AMOUNT</small></div>
      <div class="answers q42" id="answers"></div>
`,
  js: `
M.q = 42; M.next = 43; M.nextName = 'Ghost Continue';
M.level = { feePaid: false, fails: 0 };
const frame = $('frame'), row = $('heartRow');
const note = document.createElement('div'); note.className = 'hudnote'; note.id = 'hudnote'; row.parentElement.appendChild(note);
const fpos = (el) => { const r = el.getBoundingClientRect(), f = frame.getBoundingClientRect(); return { x: (r.left - f.left) * 1280 / f.width, y: (r.top - f.top) * 860 / f.height }; };
const HEART = row.children[2].innerHTML;
function fly(from, to, done) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 32 29'); s.setAttribute('class', 'flyer'); s.innerHTML = HEART;
  s.style.left = from.x + 'px'; s.style.top = from.y + 'px'; frame.appendChild(s);
  requestAnimationFrame(() => requestAnimationFrame(() => { s.style.left = to.x + 'px'; s.style.top = to.y + 'px'; }));
  setTimeout(() => { s.remove(); done(); }, 1050);
}
const feeSpot = () => { const p = fpos($('feebox')); return { x: p.x + 32, y: p.y + 26 }; };
function chargeFee() {
  const hp = row.children[2]; const from = fpos(hp);
  hp.classList.add('onpaper'); note.textContent = 'ONE ON THE PAPER';
  M.lives = 2;
  fly(from, feeSpot(), () => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 32 29'); s.setAttribute('class', 'flyer'); s.id = 'feeHeart'; s.innerHTML = HEART;
    const t = feeSpot(); s.style.left = t.x + 'px'; s.style.top = t.y + 'px'; frame.appendChild(s);
    M.level.feePaid = true; M.events.push('fee:paid');
    $('q42open').style.opacity = 0;
    setTimeout(() => { $('q42q').classList.add('show'); $('answers').classList.add('show'); M.retype('A little arithmetic. Read it very literally. One heart deducted. How many has this item cost you?'); }, 500);
  });
}
[0, 1, 2, 3].forEach(n => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = n; b.id = 'ans' + n;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused || !M.level.feePaid) return;
    if (n === 1) return refund();
    M.level.fails++; M.wrong();
    const L = ['Do not overthink it. The fee is in the box on the paper. Count it.', 'One heart is on the paper. One.', 'Press 1. You will get it back.'];
    setTimeout(() => { if (!M.solved && !M.ended) M.retype(L[Math.min(M.level.fails - 1, L.length - 1)]); }, 700);
  };
  $('answers').appendChild(b);
});
function refund() {
  M.solved = true; M.events.push('refund');
  const fee = $('feeHeart'); const from = feeSpot(); fee.remove();
  const hp = row.children[2];
  fly(from, fpos(hp), () => {
    hp.classList.remove('onpaper'); note.textContent = ''; M.lives += 1;
    M.solved = false; M.win('ONE.', 'The fee is refunded. Corporate is trialling admission charges for questions.');
  });
}
M.retype('One moment. Admission is being processed.');
setTimeout(chargeFee, 1400);
`,
};
