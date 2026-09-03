module.exports = {
  q: 26,
  title: 'OtB · Q.26 The Cookie Mock (current theme)',
  h1: 'Q.26 · The Cookie · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level26.ts: "Click the cookie 100 times." A drawn cookie with eight chocolate chips squishes on every click, a big counter and a progress bar keep score, and the hundredth click passes the item. There is no trick, exactly as in the real build, and the examiner says so at 75. Quirks added: every ten clicks a bite disappears from the cookie's edge and crumbs pile up on the paper beneath it; the examiner narrates at 1, 25, 50, 75 and 99 ("Ninety-nine. ...Go on."); at 99 the hearts label briefly reads CANDIDATE CHEWING; the win stamp reads CONSUMED. Calm endurance level between the lights maze and the keyboard riddle.`,
  css: `
  .q26prompt{position:absolute; left:0; right:0; top:9%; text-align:center; font-family:var(--display); font-weight:bold; font-size:26px; color:var(--ink);}
  .cookiewrap{position:absolute; left:50%; top:50%; width:160px; height:160px; transform:translate(-50%,-50%); cursor:pointer; touch-action:manipulation;}
  .cookiewrap svg{width:100%; height:100%; transition:transform .11s;}
  .cookiewrap.squish svg{transform:scale(.92);}
  .crumb{position:absolute; width:5px; height:4px; border-radius:2px; background:#c98a44; border:1px solid #5e3a13; pointer-events:none;}
  .counter{position:absolute; left:0; right:0; top:75%; text-align:center; font-family:var(--display); font-weight:bold; font-size:30px; color:var(--ink);}
  .cbar{position:absolute; left:50%; top:90%; transform:translateX(-50%); width:42%; height:10px; border:1px solid var(--hairline);}
  .cbar i{position:absolute; left:1px; top:1px; bottom:1px; width:0; background:#c98a44;}
`,
  html: `
      <div class="q26prompt">Click the cookie 100 times.</div>
      <div class="cookiewrap" id="cookie">
        <svg viewBox="-100 -100 200 200">
          <defs><mask id="bites"><rect x="-100" y="-100" width="200" height="200" fill="#fff"/><g id="biteg"></g></mask></defs>
          <g mask="url(#bites)">
            <circle r="90" fill="#c98a44" stroke="#5e3a13" stroke-width="4"/>
            <g fill="#3d220b">
              <circle cx="-40" cy="-27" r="9"/><circle cx="27" cy="-36" r="7"/><circle cx="-9" cy="9" r="11"/><circle cx="40" cy="18" r="8"/>
              <circle cx="-31" cy="40" r="9"/><circle cx="13" cy="49" r="7"/><circle cx="49" cy="-4" r="6"/><circle cx="-49" cy="4" r="5"/>
            </g>
          </g>
        </svg>
      </div>
      <div class="counter" id="counter">0 / 100</div>
      <div class="cbar"><i id="cfill"></i></div>
`,
  js: `
M.q = 26; M.next = 27; M.nextName = 'Keys But No Locks';
const TARGET = 100;
M.level = { clicks: 0 };
const wrap = $('cookie'), biteg = $('biteg'), play = $('play');
const SAY = { 1: 'One.', 25: "Twenty-five. Corporate calls this 'engagement'.", 50: 'Halfway. Your wrist is under observation.', 75: 'Seventy-five. There is no trick. I checked.', 99: 'Ninety-nine. ...Go on.' };
const BITES = [[78, -42], [-70, -55], [86, 28], [-88, 14], [30, 84], [-40, 80], [72, 60], [-12, -92], [50, -75]];
let squishT = 0;
wrap.addEventListener('pointerdown', (e) => {
  if (M.solved || M.ended || M.paused) return;
  e.preventDefault();
  M.level.clicks++;
  const n = M.level.clicks;
  wrap.classList.add('squish'); clearTimeout(squishT); squishT = setTimeout(() => wrap.classList.remove('squish'), 110);
  $('counter').textContent = n + ' / ' + TARGET; $('cfill').style.width = (n / TARGET * 100) + '%';
  if (n % 10 === 0 && n / 10 <= BITES.length) {
    const [bx, by] = BITES[n / 10 - 1];
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', bx); c.setAttribute('cy', by); c.setAttribute('r', 30); c.setAttribute('fill', '#000'); biteg.appendChild(c);
    for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.className = 'crumb'; d.style.left = (522 - 90 + Math.random() * 180) + 'px'; d.style.top = (190 + 70 + Math.random() * 14) + 'px'; d.style.transform = 'rotate(' + (Math.random() * 60 - 30) + 'deg)'; play.appendChild(d); }
  }
  if (SAY[n]) M.retype(SAY[n]);
  if (n === 99) { const lbl = document.querySelector('.standing-lbl'); lbl.textContent = 'CANDIDATE CHEWING'; setTimeout(() => lbl.textContent = 'CANDIDATE STANDING', 2500); }
  if (n >= TARGET) M.win('ONE HUNDRED.', 'There was no trick. Sometimes the exam is just a cookie.', 'CONSUMED');
});
M.retype('A simple endurance test. Click the cookie. One hundred times. Earn it.');
`,
};
