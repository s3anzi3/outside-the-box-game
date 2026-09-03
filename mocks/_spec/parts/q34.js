module.exports = {
  q: 34,
  title: 'OtB · Q.34 The Fourth Heart Mock (current theme)',
  h1: 'Q.34 · The Fourth Heart · NEW CONCEPT',
  sub: `Fully playable. Replaces the "find the zero among the O's" grid. The paper says "One of these does not belong with the others" above a perfectly uniform grid of 24 Institute seals. Clicking seals costs nothing and only earns "The grid is uniform. I checked." The thing that does not belong is not on the paper: CANDIDATE STANDING shows four hearts today, and the fourth is very slightly wrong (a shade bluer, no shadow, a hair larger, and it pulses). Click your real hearts and the examiner says to leave them alone. Click the impostor and it deflates with a small pfft, the row goes back to three, and the item passes. Nothing on this level costs a heart. The hint ladder reaches "How many hearts do you have? How many should you have?" after twenty idle seconds, so it stays fair for anyone who never looks at the HUD.`,
  css: `
  .directive.q34{position:absolute; left:0; right:0; top:8%;}
  .q34prompt{position:absolute; left:0; right:0; top:15%; text-align:center; font-family:var(--display); font-size:28px; color:var(--ink);}
  .seals{position:absolute; left:50%; top:30%; transform:translateX(-50%); display:grid; grid-template-columns:repeat(6, 54px); gap:9px 52px;}
  .seal{width:54px; height:54px; cursor:default; transition:transform .12s;}
  .seal:active{transform:scale(.96);}
  .heart-row{gap:6px !important;}
  .hp.fake{filter:none; transform:scale(1.05); animation:fakepulse 3s ease-in-out infinite;}
  .hp.fake path{fill:#6E3050; stroke:#5A2222;}
  @keyframes fakepulse{0%,86%,100%{transform:scale(1.05)} 93%{transform:scale(1.12)}}
  .hp.pop{animation:hpop .45s ease-in forwards;}
  @keyframes hpop{0%{transform:scale(1.05); opacity:1} 60%{transform:scale(1.3); opacity:.9} 100%{transform:scale(0); opacity:0}}
  .pfft{position:absolute; font-family:var(--mono); font-size:11px; color:var(--fgDim); letter-spacing:.1em; animation:pfft .9s ease-out forwards; pointer-events:none;}
  @keyframes pfft{0%{opacity:0; transform:translateY(0)} 20%{opacity:1} 100%{opacity:0; transform:translateY(-22px)}}
`,
  html: `
      <div class="directive q34">ITEM&nbsp;34</div>
      <div class="q34prompt">One of these does not belong with the others.</div>
      <div class="seals" id="seals"></div>
`,
  js: `
M.q = 34; M.next = 35; M.nextName = 'Institutional Simon';
M.level = { sealClicks: 0, elapsed: 0, stage: 0 };

const SEAL = '<svg class="seal" viewBox="0 0 66 66"><circle cx="33" cy="33" r="30" fill="none" stroke="#B0892F" stroke-width="2.2" stroke-dasharray="3.4 2.2"/><circle cx="33" cy="33" r="24" fill="none" stroke="#B0892F" stroke-width="1"/><circle cx="33" cy="33" r="20" fill="rgba(176,137,47,.10)"/><text x="33" y="30" text-anchor="middle" font-family="Courier New,monospace" font-size="8" font-weight="bold" fill="#B0892F" letter-spacing="1">ILC</text><text x="33" y="41" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#B0892F" font-style="italic">certified</text></svg>';
const seals = $('seals');
for (let i = 0; i < 24; i++) { const d = document.createElement('div'); d.innerHTML = SEAL; d.firstChild.dataset.i = i; seals.appendChild(d.firstChild); }
seals.addEventListener('click', (e) => {
  if (!e.target.closest('.seal') || M.solved || M.ended || M.paused) return;
  M.level.sealClicks++; M.events.push('seal');
  if (M.level.sealClicks === 1) say(1, 'The grid is uniform. I checked.');
  else say(2, 'The grid is uniform. I checked. Look at what is not on the paper.');
});

// the fourth heart
const row = $('heartRow');
const fake = row.children[0].cloneNode(true); fake.classList.add('fake'); fake.id = 'fakeHeart'; row.appendChild(fake);
for (const hp of row.children) {
  hp.style.cursor = 'default';
  hp.addEventListener('click', () => {
    if (M.solved || M.ended || M.paused) return;
    if (hp === fake) return deflate();
    M.events.push('realheart'); M.retype('That one is yours. Leave it.');
  });
}
function deflate() {
  M.events.push('fake:popped');
  const r = fake.getBoundingClientRect(), f = $('frame').getBoundingClientRect();
  const p = document.createElement('div'); p.className = 'pfft'; p.textContent = 'pfft';
  p.style.left = ((r.left - f.left) * 1280 / f.width + 4) + 'px'; p.style.top = ((r.top - f.top) * 860 / f.height - 14) + 'px';
  $('frame').appendChild(p);
  fake.classList.add('pop');
  setTimeout(() => { fake.remove(); M.win('AUDITED.', 'You had three hearts. You have always had three hearts. Corporate would like the fourth back.'); }, 480);
}

const LINES = { 0: 'One of these does not belong with the others. I did not say which these.', 2: 'The grid is uniform. I checked. Look at what is not on the paper.', 3: 'How many hearts do you have? How many should you have?', 4: 'The fourth heart is not yours. Click it. It will not mind.' };
function say(stage, text) { if (stage > M.level.stage) M.level.stage = stage; M.retype(text); }
M.retype(LINES[0]);
setInterval(() => {
  if (M.paused || M.solved || M.ended) return;
  M.level.elapsed += 0.5;
  if (M.level.elapsed >= 20 && M.level.stage < 2) say(2, LINES[2]);
  if (M.level.elapsed >= 40 && M.level.stage < 3) say(3, LINES[3]);
  if (M.level.elapsed >= 60 && M.level.stage < 4) say(4, LINES[4]);
}, 500);
`,
};
