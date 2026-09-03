module.exports = {
  q: 50,
  title: 'OtB · Q.50 Your Name Mock (current theme)',
  h1: 'Q.50 · Your Name · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level50.ts, the finale in three screens. (1) The final item: "What is your name?" with a text field and SUBMIT; the accepted answer is whatever was typed at Q1, which in this mock is registered as "Box" (the cheats overlay's own joke). A wrong name slams INCORRECT, costs a heart, and clears the field. (2) A full-frame CORRECT screen: "That is right. You are Box." and VIEW CERTIFICATE. (3) The certificate: tier-coloured double border with corner diamonds, faint seal watermark, date and serial, a spinning gold medallion (the CORRECT stamp struck in seal gold), tier badge, title, the name, the body text, elapsed time, footnote, two signatures, MAIN MENU. Tier is GOLD under 20 minutes, SILVER under 28, BRONZE after; the mock assumes 17:42. Use the GOLD / SILVER / BRONZE buttons above the frame to preview each. Small additions: the serial line carries STANDING AT COMPLETION with your remaining hearts, and the examiner's last remark on the CORRECT screen.`,
  css: `
  .tierbar{max-width:860px; margin:-10px 0 16px; display:flex; gap:8px; align-items:center; font-size:12px; color:#9c937e;}
  .tierbar button{font-family:"Courier New",monospace; font-size:11px; letter-spacing:.08em; padding:6px 10px; border-radius:4px; border:1px solid #3A3129; background:#241F1A; color:#EEE7D6; cursor:pointer;}
  .tierbar button.on{border-color:#D4B05A; color:#D4B05A;}
  .q50eyebrow{position:absolute; left:0; right:0; top:10%; text-align:center; font-family:var(--mono); font-size:12px; letter-spacing:.16em; color:var(--accent);}
  .q50l1{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--display); font-weight:bold; font-size:26px; color:var(--ink);}
  .q50l2{position:absolute; left:0; right:0; top:35%; text-align:center; font-family:var(--display); font-weight:bold; font-size:22px; color:var(--ink);}
  .q50input{position:absolute; left:50%; top:46%; transform:translateX(-50%); width:520px; height:52px; background:var(--bg); border:1.5px solid var(--hairline); border-radius:5px;
    font-family:var(--body); font-size:22px; color:var(--ink); padding:0 16px; outline:none; user-select:text;}
  .q50input:focus{border:3px solid var(--accent);}
  .q50input::placeholder{color:var(--fgDim);}
  .q50submit{position:absolute; left:50%; top:68%; transform:translateX(-50%); width:220px; height:50px; font-size:20px; padding:0;}

  /* screen 2: full-frame correct */
  .winfull{position:absolute; inset:0; display:none; z-index:5; text-align:center;}
  .winfull.show{display:block;}
  .winfull .t{position:absolute; left:0; right:0; top:34%; transform:translateY(-50%); font-family:var(--display); font-weight:bold; font-size:56px; color:var(--pass);}
  .winfull .b{position:absolute; left:0; right:0; top:46%; transform:translateY(-50%); font-size:22px; color:var(--fgMid);}
  .winfull .c{position:absolute; left:0; right:0; top:53%; transform:translateY(-50%); font-size:15px; color:var(--fgDim);}
  .winfull .btn{position:absolute; left:50%; top:62%; transform:translateX(-50%); width:300px; height:60px; font-size:20px; padding:0;}

  /* screen 3: certificate */
  .certwrap{position:absolute; inset:0; display:none; z-index:6; background:rgba(40,30,15,.12);}
  .frame.dark .certwrap{background:rgba(0,0,0,.34);}
  .certwrap.show{display:block;}
  .cert{position:absolute; left:50%; top:50%; width:780px; height:560px; transform:translate(-50%, calc(-50% - 26px)); background:#FCF9F0; border-radius:4px;
    box-shadow:0 14px 40px rgba(40,25,5,.40); --tc:#C79A2E; --tcd:rgba(199,154,46,.34); color:var(--ink);}
  .frame.dark .cert{background:#221C13;}
  .cert .b1{position:absolute; inset:8px; border:3px solid var(--tc); border-radius:2px;}
  .cert .b2{position:absolute; inset:14px; border:1px solid var(--tcd); border-radius:2px;}
  .cert .dia{position:absolute; width:7px; height:7px; background:var(--tc); transform:rotate(45deg);}
  .cert .dia.a{left:4.5px; top:4.5px;} .cert .dia.b{right:4.5px; top:4.5px;} .cert .dia.c{left:4.5px; bottom:4.5px;} .cert .dia.d{right:4.5px; bottom:4.5px;}
  .cert .wm{position:absolute; left:50%; top:55%; width:170px; height:170px; transform:translate(-50%,-50%); opacity:.05;}
  .cert .meta{position:absolute; top:7.5%; transform:translateY(-50%); font-family:var(--mono); font-size:10px; color:var(--fgDim);}
  .cert .meta.l{left:28px;} .cert .meta.r{right:28px; text-align:right;}
  .cert .meta .hearts{color:var(--accent); letter-spacing:1px;}
  .cert .ey{position:absolute; left:0; right:0; top:14%; transform:translateY(-50%); text-align:center; font-family:var(--mono); font-size:11px; letter-spacing:.14em; color:var(--tc);}
  .medal{position:absolute; left:50%; top:23.5%; width:96px; height:96px; transform:translate(-50%,-50%); perspective:600px;}
  .medal .coin{width:100%; height:100%; border-radius:50%; position:relative; transform-style:preserve-3d; animation:spin 4.2s linear infinite;
    background:radial-gradient(circle at 38% 32%, #F1D98A, #C79A2E 55%, #8E6A18); box-shadow:0 4px 10px rgba(80,55,10,.35), inset 0 0 0 3px rgba(255,240,190,.5), inset 0 0 0 6px rgba(140,100,20,.35);}
  .medal .coin .face{position:absolute; inset:0; display:flex; align-items:center; justify-content:center;}
  .medal .coin .face span{border:2.5px solid #6E4F0E; border-radius:5px; padding:3px 6px; font-family:var(--mono); font-weight:bold; font-size:9px; letter-spacing:.08em; color:#6E4F0E; transform:rotate(-12deg); box-shadow:inset 0 0 0 1px rgba(110,79,14,.6);}
  @keyframes spin{from{transform:rotateY(0)} to{transform:rotateY(360deg)}}
  .cert .tier{position:absolute; left:0; right:0; top:34%; transform:translateY(-50%); text-align:center; font-family:var(--mono); font-weight:bold; font-size:13px; letter-spacing:.1em; color:var(--tc);}
  .cert .title{position:absolute; left:0; right:0; top:42%; transform:translateY(-50%); text-align:center; font-family:var(--display); font-weight:bold; font-size:30px; color:var(--ink);}
  .cert .certify{position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; font-family:var(--display); font-style:italic; font-size:14px; color:var(--fgDim);}
  .cert .name{position:absolute; left:0; right:0; top:58.5%; transform:translateY(-50%); text-align:center; font-family:var(--display); font-weight:bold; font-size:40px; color:var(--tc);}
  .cert .rule{position:absolute; left:50%; top:63%; width:140px; height:1px; background:var(--tcd); transform:translateX(-50%);}
  .cert .body{position:absolute; left:0; right:0; top:68.5%; text-align:center; font-family:var(--body); font-size:12.5px; line-height:1.5; color:var(--fgMid);}
  .cert .div{position:absolute; left:12%; right:12%; top:80%; height:1px; background:var(--tcd);}
  .cert .grade{position:absolute; left:0; right:0; top:84.5%; transform:translateY(-50%); text-align:center; font-family:var(--mono); font-weight:bold; font-size:12px; letter-spacing:.06em; color:var(--tc);}
  .cert .foot{position:absolute; left:0; right:0; top:88.5%; transform:translateY(-50%); text-align:center; font-family:var(--display); font-style:italic; font-size:11px; color:var(--fgDim);}
  .cert .sig{position:absolute; top:95%; width:144px; border-top:1px solid var(--hairline); font-family:var(--mono); font-size:9.5px; color:var(--fgDim); text-align:center; padding-top:4px;}
  .cert .sig.l{left:calc(27% - 72px);} .cert .sig.r{left:calc(73% - 72px);}
  .cert .sig svg{position:absolute; left:50%; bottom:100%; transform:translateX(-50%); width:110px; height:36px; margin-bottom:-6px;}
  .cert .sig path{fill:none; stroke:var(--tc); stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round;}
  .certwrap .btn.menu{position:absolute; left:50%; top:calc(50% + 254px); transform:translateX(-50%); width:240px; height:50px; font-size:18px; padding:0;}
`,
  html: `
      <div class="q50eyebrow">FINAL&nbsp;ITEM&nbsp;&nbsp;·&nbsp;&nbsp;50&nbsp;OF&nbsp;50</div>
      <div class="q50l1">One last question, candidate.</div>
      <div class="q50l2">What is your name?</div>
      <input class="q50input" id="nameInput" placeholder="Type your answer…" autocomplete="off" spellcheck="false">
      <button class="btn q50submit" id="submitBtn">SUBMIT →</button>
`,
  js: `
M.q = 50; M.next = 0; M.nextName = '';
M.level = { registeredName: 'Box', tier: 'gold', finalMs: 17 * 60000 + 42000 };
const TIERS = {
  gold:   { label: 'GOLD',   color: '#C79A2E', dim: 'rgba(199,154,46,.34)', title: 'Distinguished Excellence Award', timeLabel: 'Elite Completion', body: ['This certificate stands as irrefutable proof of your undeniable', 'critical thinking and problem solving prowess.', 'Employers should be drooling at the thought of you joining their team.'], foot: 'Completed in record time. Outstanding.' },
  silver: { label: 'SILVER', color: '#8C97A0', dim: 'rgba(140,151,160,.34)', title: 'Certificate of Achievement', timeLabel: 'Strong Completion', body: ['This certificate is proof of your undeniable critical thinking', 'and problem solving skills.', 'Any employer would be lucky, truly lucky, to have you on their team.'], foot: 'Solid performance. Well earned.' },
  bronze: { label: 'BRONZE', color: '#B0703A', dim: 'rgba(176,112,58,.34)', title: 'Certificate of Completion', timeLabel: 'Completion', body: ['This certificate is proof that you possess critical thinking', 'and problem solving skills.', 'The right employer will recognise your potential. Keep going.'], foot: 'Finished is finished. That counts.' },
};
const TIME = { gold: 17 * 60000 + 42000, silver: 24 * 60000 + 8000, bronze: 33 * 60000 + 51000 };
const fmt = (ms) => { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const serial = (n) => 'No. OTB-50-' + (Math.abs(Array.from(n).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 9000 + 1000);
const today = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const SIG = 'M-41.6,4.8 C-28.8,-19.2 -19.2,16 -9.6,-3.2 C-3.2,-17.6 3.2,14.4 12.8,-1.6 C22.4,-17.6 32,9.6 43.2,-4.8 M-6.4,11.2 L27.2,-8';

// mock-only tier preview bar above the frame
const bar = document.createElement('div'); bar.className = 'tierbar'; bar.innerHTML = 'PREVIEW TIER: ' + ['gold', 'silver', 'bronze'].map(t => '<button data-t="' + t + '"' + (t === 'gold' ? ' class="on"' : '') + '>' + t.toUpperCase() + '</button>').join('') + '<span style="margin-left:10px">registered name: <b style="color:#EEE7D6">Box</b></span>';
document.body.insertBefore(bar, $('frame'));
bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; M.level.tier = b.dataset.t; M.level.finalMs = TIME[b.dataset.t]; bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); if ($('certwrap')) renderCert(); });

// screen 1
const input = $('nameInput');
function submit() {
  if (M.solved || M.ended || M.paused) return;
  const typed = input.value.trim().toLowerCase();
  if (typed === M.level.registeredName.toLowerCase()) { M.events.push('name:ok'); showWin(); }
  else { input.value = ''; M.wrong('That is not the name you gave me. I have it written down.'); }
}
$('submitBtn').onclick = submit;
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } e.stopPropagation(); });

// screen 2: full-frame CORRECT (paper hidden, examiner panel stays)
function showWin() {
  M.solved = true;
  $('paper').style.display = 'none';
  const w = document.createElement('div'); w.className = 'winfull show'; w.id = 'winfull';
  w.innerHTML = '<div class="t">CORRECT.</div><div class="b">That is right. You are ' + esc(M.level.registeredName) + '.</div><div class="c">Examination complete. Your certificate awaits.</div><button class="btn" id="viewCert">VIEW CERTIFICATE&nbsp;&nbsp;→</button>';
  $('frame').appendChild(w);
  $('viewCert').onclick = showCert;
  M.retype('Certified. Corporate would like to remind you this is not a real certificate.');
}

// screen 3: the diploma
function showCert() {
  $('winfull').remove(); $('bottom').style.display = 'none';
  const c = document.createElement('div'); c.className = 'certwrap show'; c.id = 'certwrap'; $('frame').appendChild(c);
  renderCert(); M.events.push('certificate');
}
function renderCert() {
  const tc = TIERS[M.level.tier]; const c = $('certwrap');
  const hearts = '♥'.repeat(M.lives) + '<span style="opacity:.35">' + '♥'.repeat(3 - M.lives) + '</span>';
  c.innerHTML = '<div class="cert" style="--tc:' + tc.color + '; --tcd:' + tc.dim + '">' +
    '<div class="b1"></div><div class="b2"></div><div class="dia a"></div><div class="dia b"></div><div class="dia c"></div><div class="dia d"></div>' +
    '<svg class="wm" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="' + tc.color + '" stroke-width="3" stroke-dasharray="4 2"/><circle cx="50" cy="50" r="36" fill="none" stroke="' + tc.color + '" stroke-width="1.5"/><text x="50" y="55" text-anchor="middle" font-family="Georgia" font-size="16" fill="' + tc.color + '">ILC</text></svg>' +
    '<div class="meta l">' + today() + '</div><div class="meta r">STANDING AT COMPLETION <span class="hearts">' + hearts + '</span> &nbsp;·&nbsp; ' + serial(M.level.registeredName) + '</div>' +
    '<div class="ey">INSTITUTE OF LATERAL COGNITION</div>' +
    '<div class="medal"><div class="coin"><div class="face"><span>CORRECT</span></div></div></div>' +
    '<div class="tier">✦ &nbsp; ' + tc.label + ' TIER &nbsp; ✦</div>' +
    '<div class="title">' + tc.title + '</div>' +
    '<div class="certify">This is to certify that</div>' +
    '<div class="name">' + esc(M.level.registeredName) + '</div><div class="rule"></div>' +
    '<div class="body">' + tc.body.map(esc).join('<br>') + '</div>' +
    '<div class="div"></div>' +
    '<div class="grade">' + tc.timeLabel.toUpperCase() + ' &nbsp; · &nbsp; ' + fmt(M.level.finalMs) + '</div>' +
    '<div class="foot">' + tc.foot + '</div>' +
    '<div class="sig l"><svg viewBox="-55 -22 110 40"><path d="' + SIG + '"/></svg>CHIEF EXAMINER</div>' +
    '<div class="sig r"><svg viewBox="-55 -22 110 40"><path d="' + SIG + '"/></svg>REGISTRAR</div>' +
    '</div><button class="btn menu" id="menuBtn">MAIN MENU</button>';
  $('menuBtn').onclick = () => M.toast('MAIN MENU: would return to the cover sheet (disabled in mock)');
}
M.retype('One final question, candidate. You have earned it. Think back to the very beginning.');
`,
};
