module.exports = {
  q: 44,
  title: 'OtB · Q.44 Sign the Confession Mock (current theme)',
  h1: 'Q.44 · Sign the Confession · TWIST',
  sub: `Fully playable. Keeps the whodunit format and turns it on the player. CASE FILE #22 lists the crimes: someone held down Frodrick's paddle during Question 21, someone pressed a control marked OVERRIDE during Question 20, and someone declined to help a child during Question 8. Three suspect cards, ADA, BEN and CLEO, each printed with an alibi; accusing any of them costs a heart. There is no fourth card. At the bottom of the form is a line: "I confess. SIGNED: ________". Click it and the candidate's registered name (Box, in this mock; whatever was typed at Q1 in the real game) signs itself in oxblood ink, dated today, and the paper is stamped CONFESSED. Twist on the existing whodunit: same shape, but the culprit is you, the evidence is your own play history, and the answer is a signature rather than a button. It foreshadows Q50 without spending it.`,
  css: `
  .q44head{position:absolute; left:0; right:0; top:6%; text-align:center; font-family:var(--mono); font-size:12px; letter-spacing:.18em; color:var(--accent);}
  .q44facts{position:absolute; left:8%; right:8%; top:14%; font-family:var(--display); font-size:16.5px; line-height:1.55; color:var(--ink);}
  .q44facts div::before{content:"§ "; color:var(--fgDim);}
  .q44cards{position:absolute; left:0; right:0; top:46%; display:flex; justify-content:center; gap:28px;}
  .card{width:220px; height:82px; border:2px solid var(--stroke); border-radius:6px; background:var(--bg); box-shadow:0 3px 9px var(--shadow); cursor:pointer; text-align:center; padding-top:10px; transition:background .15s;}
  .card b{display:block; font-family:var(--display); font-size:22px; color:var(--ink);}
  .card i{display:block; font-family:var(--mono); font-style:normal; font-size:9.5px; letter-spacing:.06em; color:var(--fgDim); margin-top:6px;}
  .card:hover{background:var(--accent);} .card:hover b, .card:hover i{color:var(--btnText);}
  .q44form{position:absolute; left:8%; right:8%; top:78%; font-family:var(--mono); font-size:13px; letter-spacing:.06em; color:var(--fgMid); display:flex; align-items:baseline; gap:14px;}
  .sigline{position:relative; display:inline-block; width:260px; height:30px; border-bottom:1.5px dotted var(--fgDim); cursor:text; vertical-align:bottom;}
  .sig{position:absolute; left:8px; bottom:-2px; white-space:nowrap; overflow:hidden; width:0; font-family:"Segoe Script","Brush Script MT","Lucida Handwriting",cursive; font-size:30px; color:var(--accent); line-height:1;}
  .sig.write{animation:signit .8s ease-out forwards;}
  @keyframes signit{from{width:0} to{width:100%}}
`,
  html: `
      <div class="q44head">CASE FILE #22 &nbsp;·&nbsp; INCIDENT REPORT</div>
      <div class="q44facts">
        <div>During Question 21, someone held down Frodrick's paddle so that it could not move.</div>
        <div>During Question 20, someone pressed a control clearly marked OVERRIDE.</div>
        <div>During Question 8, someone declined to help a child.</div>
      </div>
      <div class="q44cards" id="cards"></div>
      <div class="q44form"><span>I CONFESS.</span><span>SIGNED:</span><span class="sigline" id="sigline"><span class="sig" id="sig">Box</span></span><span>DATE: <span id="today"></span></span></div>
`,
  js: `
M.q = 44; M.next = 45; M.nextName = 'Runaway Submit';
M.level = { fails: 0, registeredName: 'Box' };
$('sig').textContent = M.level.registeredName;
$('today').textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const SUSPECTS = [['ADA', 'in a meeting since Question 1'], ['BEN', 'abroad, Questions 6 to 30'], ['CLEO', 'has never touched a mouse']];
const L = ['That one was in a meeting. Read the cards.', 'The paddle was frozen from your seat. The form at the bottom is for the person in your seat.', 'Click the signature line. Confess.'];
SUSPECTS.forEach(([n, alibi]) => {
  const c = document.createElement('div'); c.className = 'card'; c.id = 'card' + n; c.innerHTML = '<b>' + n + '</b><i>' + alibi + '</i>';
  c.onclick = () => { if (M.solved || M.ended || M.paused) return; M.level.fails++; M.wrong(); setTimeout(() => { if (!M.solved && !M.ended) M.retype(L[Math.min(M.level.fails - 1, L.length - 1)]); }, 700); };
  $('cards').appendChild(c);
});
$('sigline').onclick = () => {
  if (M.solved || M.ended || M.paused) return;
  M.events.push('signed');
  $('sig').classList.add('write');
  M.retype('...Signed. In your own hand. Thank you for your cooperation.');
  setTimeout(() => M.win('CONFESSED.', 'Signed in your own name. The Institute has kept it since Question 1.', 'CONFESSED'), 1000);
};
M.retype('A workplace mystery. Read the clues, name the culprit. Three suspects have alibis. A fourth does not.');
`,
};
