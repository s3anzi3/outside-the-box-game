module.exports = {
  q: 38,
  title: 'OtB · Q.38 The Other Button Mock (current theme)',
  h1: 'Q.38 · The Other Button · NEW CONCEPT',
  sub: `Fully playable. Replaces the arrow-rotation pattern. The paper says "Press the button." and there is exactly one button on it. Press it and the verdict is INCORRECT with "Not that one. The other one." Only that first click costs a heart; every left click after it is free and the examiner escalates: "Still that one." then "Your mouse has two buttons." then a trackpad hint (two-finger tap, or Ctrl and click). The other button is the one on your mouse: right-click THE BUTTON and its right half depresses and the item passes. The browser's context menu is suppressed inside the frame so the moment is not broken. New concept built from an input the exam has never used. It is a ten-second calm level between Trim Marks and the pause-menu reveal at Q39.`,
  css: `
  .directive.q38{position:absolute; left:0; right:0; top:12%;}
  .q38prompt{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--display); font-size:40px; color:var(--ink);}
  .bigbtn{position:absolute; left:50%; top:52%; transform:translateX(-50%); width:320px; height:96px; font-size:30px; padding:0; overflow:hidden;}
  .bigbtn::before{content:""; position:absolute; left:0; top:0; bottom:0; width:50%; background:rgba(30,26,21,.06); pointer-events:none;}
  .bigbtn:hover::before{background:rgba(0,0,0,.10);}
  .bigbtn.pressedR{transform:translateX(-50%) perspective(400px) rotateY(-9deg); box-shadow:inset -6px 0 10px rgba(0,0,0,.25), 0 1px 3px var(--shadow);}
  .bigbtn.pressedR::before{display:none;}
  .q38note{position:absolute; left:0; right:0; top:84%; text-align:center; font-family:var(--mono); font-size:11px; letter-spacing:.14em; color:var(--fgDim);}
`,
  html: `
      <div class="directive q38">ITEM&nbsp;38</div>
      <div class="q38prompt">Press the button.</div>
      <button class="btn bigbtn" id="theButton">THE BUTTON</button>
      <div class="q38note">ONE BUTTON IS PROVIDED.</div>
`,
  js: `
M.q = 38; M.next = 39; M.nextName = 'Issued to the Invigilator';
M.level = { lefts: 0 };
const btn = $('theButton');
const LEFT = ['Not that one. The other one.', 'Still that one.', 'Your mouse has two buttons.', 'The other one. On the mouse. Two-finger tap on a trackpad, or hold Ctrl and click.'];
btn.addEventListener('click', (e) => {
  if (M.solved || M.ended || M.paused) return;
  if (e.button !== 0) return;
  M.level.lefts++; M.events.push('left:' + M.level.lefts);
  if (M.level.lefts === 1) M.wrong(LEFT[0]);
  else M.retype(LEFT[Math.min(M.level.lefts - 1, LEFT.length - 1)]);
});
// the other button
$('frame').addEventListener('contextmenu', (e) => e.preventDefault());
btn.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (M.solved || M.ended || M.paused) return;
  M.events.push('right');
  btn.classList.add('pressedR');
  setTimeout(() => M.win('THE OTHER ONE.', 'Not that button. The other button. It has been under your finger the whole time.'), 350);
});
M.retype('Press the button.');
`,
};
