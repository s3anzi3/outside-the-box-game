// Real game Q31 "Lights Out": the paper is unlit, buttons are inert in the dark,
// the pause-menu theme toggle changes the hall and not the paper, the bulb in the
// logo lights the sheet, A costs a heart once lit, C wins. Also checks the hint
// clock freezes while the exam is suspended.
module.exports = async (page, g) => {
  // play area at 1280x860: x 115.2..1164.8, y 168.12..554.7
  const PX = 115.2, PY = 168.12, PW = 1049.6, PH = 386.58;
  const bw = 150, bh = 58, gap = PW * 0.034;
  const totW = 4 * bw + 3 * gap;
  const bx0 = 640 - totW / 2;
  const btn = (i) => ({ x: bx0 + i * (bw + gap) + bw / 2, y: PY + PH * 0.91 - bh / 2 });
  const A = btn(0), C = btn(2);
  const PAUSE = { x: 1136, y: 145 };
  // pause overlay right column (ox=167.68, oy=220.6, ow=944.64, oh=281.6, btnW=220, btnH=40)
  const RESUME = { x: 167.68 + 944.64 * 0.62 + 110, y: 220.6 + 281.6 * 0.30 + 20 };
  const THEME  = { x: RESUME.x, y: 220.6 + 281.6 * 0.30 + (40 + 281.6 * 0.05) * 2 + 20 };

  await g.goto(31);
  await g.wait(500);
  await g.shot('unlit');

  let s = await g.state();
  g.assert(s.phase === 'active' && s.lives === 3, 'level 31 is live: ' + JSON.stringify(s));
  g.assert((await g.levelVar('lit')) === false, 'the paper starts unlit');

  // 1. pressing a button in the dark is free and does not win
  await g.click(C.x, C.y); await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 3 && s.phase === 'active', 'dark press is free: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('cannot see what you are pressing'), 'dark press remark: ' + s.remarks);
  await g.click(A.x, A.y); await g.wait(350);
  s = await g.state();
  g.assert(s.lives === 3 && s.remarks.includes('It is dark in here'), 'second dark press remark: ' + s.remarks);
  g.assert((await g.levelVar('lit')) === false, 'button presses never light the paper');

  // 2. pausing freezes the hint clock
  const before = await g.levelVar('elapsed');
  await g.click(PAUSE.x, PAUSE.y); await g.wait(200);
  s = await g.state();
  g.assert(s.paused === true, 'pause opened: ' + JSON.stringify(s));
  await g.shot('paused');
  await g.wait(1400);
  const during = await g.levelVar('elapsed');
  g.assert(Math.abs(during - before) < 0.2, `hint clock froze while paused: ${before} -> ${during}`);

  // 3. the Q25 veteran move: flip DARK MODE. It changes the hall, not the paper.
  await g.click(THEME.x, THEME.y); await g.wait(900);
  s = await g.state();
  g.assert(s.dark === true, 'theme toggled: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('That changed the hall'), 'hall remark: ' + s.remarks);
  g.assert((await g.levelVar('lit')) === false, 'the theme toggle must not light the paper');
  await g.click(THEME.x, THEME.y); await g.wait(400);       // back to the light hall
  await g.click(RESUME.x, RESUME.y); await g.wait(300);
  s = await g.state();
  g.assert(s.paused === false && s.dark === false, 'resumed in the light hall: ' + JSON.stringify(s));
  const after = await g.levelVar('elapsed');
  g.assert(after >= during - 0.05, 'clock resumes after the pause: ' + after);

  // 4. the bulb in the logo is the switch
  const ch = await g.chrome();
  const b = ch.bulb;
  g.assert(!!b, 'the renderer publishes the bulb rect: ' + JSON.stringify(ch.bulb));
  await g.click(b.x + b.w / 2, b.y + b.h / 2); await g.wait(1200);
  g.assert((await g.levelVar('lit')) === true, 'the bulb lights the paper');
  s = await g.state();
  g.assert(s.lives === 3 && s.remarks.includes('Third button'), 'lit remark: ' + s.remarks);
  await g.shot('lit');

  // 5. the conventional trap: the first button, now that you can read the sheet
  await g.click(A.x, A.y); await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'A costs a heart once lit: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Third. The one after the second.'), 'miss remark: ' + s.remarks);
  await g.shot('wrong');

  // 6. the third button wins
  await g.click(C.x, C.y); await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'C wins: ' + JSON.stringify(s));
  await g.shot('win');
};
