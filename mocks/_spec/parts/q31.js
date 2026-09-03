module.exports = {
  q: 31,
  title: 'OtB · Q.31 Lights Out Mock (current theme)',
  h1: 'Q.31 · Lights Out · NEW CONCEPT',
  sub: `Fully playable. Replaces the old dark-mode reveal, which repeated Q25's theme-toggle trick. The paper is unlit: a dark sheet with a faint cone of light falling from above, four dim buttons A B C D, and an instruction you cannot read. Pressing a button in the dark does nothing ("You cannot see what you are pressing. Neither can I."). Q25 veterans will open the pause menu and flip DARK MODE: it changes the hall and not the paper, and the examiner says so. The switch is the lightbulb in the logo, which has been sitting above every question since Q1 and has never been touchable. It is drawn off (greyed) and blinks once after fifteen idle seconds. Click it: a soft flash, the paper lights up to ivory, the instruction reads PRESS THE THIRD BUTTON, and C wins. A, B and D cost a heart once the lights are on. The remarks escalate toward the bulb over forty seconds; the timers pause with the exam.`,
  css: `
  .play.unlit{background:#101018; transition:background .5s;}
  .frame.dark .play.unlit{background:#07070b;}
  .cone{position:absolute; left:0; right:0; top:0; bottom:0; pointer-events:none; opacity:1; transition:opacity .6s;
    background:radial-gradient(ellipse 34% 62% at 50% -8%, rgba(255,225,150,.11), rgba(255,225,150,0) 70%);}
  .play.lit .cone{opacity:0;}
  .instr{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--display); font-size:34px; color:var(--ink);
    opacity:0; transition:opacity .9s .25s;}
  .instr small{display:block; font-family:var(--mono); font-size:12px; letter-spacing:.16em; color:var(--fgDim); margin-bottom:10px;}
  .play.lit .instr{opacity:1;}
  .play.unlit .answers .btn{opacity:.28; filter:brightness(.55) saturate(.4); cursor:default; transition:opacity .6s, filter .6s;}
  .play.unlit .answers .btn:hover{background:var(--bg); color:var(--ink); border-color:var(--stroke);}
  .flash{position:absolute; inset:0; background:radial-gradient(circle at 54% 8%, rgba(255,245,210,.95), rgba(255,245,210,0) 60%); opacity:0; pointer-events:none; z-index:5;}
  .flash.go{animation:flashout .7s ease-out forwards;}
  @keyframes flashout{0%{opacity:0} 15%{opacity:1} 100%{opacity:0}}

  /* the bulb in the logo, drawn OFF until clicked */
  .bulbcap{position:absolute; left:634px; top:15px; width:34px; height:42px; border-radius:50%; z-index:2; cursor:default;
    background:rgba(60,58,70,.22); backdrop-filter:grayscale(1) brightness(.55); -webkit-backdrop-filter:grayscale(1) brightness(.55); transition:opacity .5s;}
    .bulbcap.blink{animation:bulbblink 1.3s ease-in-out 1;}
  @keyframes bulbblink{0%,100%{opacity:1} 50%{opacity:.2}}
  .bulbcap.off{opacity:0; pointer-events:none;}
  .bulbhit{position:absolute; left:618px; top:6px; width:64px; height:60px; z-index:3; cursor:default;}
`,
  html: `
      <div class="cone"></div>
      <div class="instr" id="instr"><small>INSTRUCTION</small>Q.31: PRESS THE THIRD BUTTON</div>
      <div class="answers" id="answers"></div>
      <div class="flash" id="flash"></div>
`,
  js: `
M.q = 31; M.next = 32; M.nextName = 'Dial to Eleven';
M.level = { lit: false, darkPresses: 0, elapsed: 0, hintStage: 0 };
const play = $('play'); play.classList.add('unlit');

// bulb cap over the logo's lightbulb + a generous hit area
const cap = document.createElement('div'); cap.className = 'bulbcap'; cap.id = 'bulbcap'; $('frame').appendChild(cap);
const hit = document.createElement('div'); hit.className = 'bulbhit'; hit.id = 'bulbhit'; $('frame').appendChild(hit);

['A', 'B', 'C', 'D'].forEach((lab, i) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = lab; b.id = 'ans' + lab;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (!M.level.lit) {
      M.level.darkPresses++; M.events.push('darkpress:' + lab);
      M.retype(M.level.darkPresses === 1 ? 'You cannot see what you are pressing. Neither can I.' : 'It is dark in here. The hall is fine. The paper is not.');
      if (M.level.hintStage < 1) M.level.hintStage = 1;
      return;
    }
    if (i === 2) M.win('ILLUMINATED.', 'The instruction was always there. Someone had turned the light off. Someone is always Corporate.');
    else M.wrong('Third. The one after the second.');
  };
  $('answers').appendChild(b);
});

function lightsOn() {
  if (M.level.lit || M.solved || M.ended || M.paused) return;
  M.level.lit = true; M.events.push('lit');
  $('flash').classList.add('go');
  cap.classList.add('off'); hit.style.pointerEvents = 'none';
  play.classList.remove('unlit'); play.classList.add('lit');
  M.retype('...There it is. Third button, candidate.');
}
hit.addEventListener('click', lightsOn);

M.onDark = () => { if (!M.level.lit) M.retype('That changed the hall. It did not change the paper.'); };

M.retype('The exam is hiding the instruction from you now. Change how you\\'re looking at the screen, candidate.');
// hint ladder on a pause-aware clock
setInterval(() => {
  if (M.paused || M.solved || M.ended || M.level.lit) return;
  M.level.elapsed += 0.5;
  if (M.level.elapsed >= 15 && !M.level.blinked) { M.level.blinked = true; cap.classList.add('blink'); setTimeout(() => cap.classList.remove('blink'), 1400); }
  if (M.level.elapsed >= 20 && M.level.hintStage < 2) { M.level.hintStage = 2; M.retype('Somebody turned the light off. It is above you.'); }
  if (M.level.elapsed >= 40 && M.level.hintStage < 3) { M.level.hintStage = 3; M.retype('The bulb. In the logo. Yes, that one.'); cap.classList.add('blink'); setTimeout(() => cap.classList.remove('blink'), 1400); }
}, 500);
`,
};
