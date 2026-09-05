// Real game Q38 "The Other Button": the one button on the paper is a trap for the
// left mouse button. First left click costs a heart, later left clicks are free and
// only escalate the remark, pausing freezes the level clock, right-clicking wins.
//
// Layout at 1280x860 (s = 1): play area x 118..1162, y 171..552 (H = 381).
// .bigbtn is 320x96 centred on x, top edge at 52% of the play area:
//   x 480..800, y 369.1..465.1  ->  centre (640, 417.1)
module.exports = async (page, g) => {
  await g.goto(38);
  await g.wait(500);

  const PLAY_Y = 171, PLAY_H = 381;
  const BTN = { x: 640, y: PLAY_Y + PLAY_H * 0.52 + 48 };

  let s = await g.state();
  g.assert(s.level === 38 && s.phase === 'active', 'on Q38 and active: ' + JSON.stringify(s));
  g.assert(s.lives === 3, 'three hearts to start: ' + s.lives);
  g.assert(s.remarks.includes('Press the button'), 'opening remark: ' + s.remarks);
  await g.shot('start');

  // ── the conventional trap: the first left click costs a heart ──────────────
  await g.click(BTN.x, BTN.y); await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'first left click costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Not that one. The other one.'), 'verdict line: ' + s.remarks);
  await g.shot('left-costs-a-heart');

  // ── every left click after it is free; the ladder escalates ────────────────
  await g.click(BTN.x, BTN.y); await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'second left click is free: ' + s.lives);
  g.assert(s.remarks.includes('Still that one.'), 'rung 2: ' + s.remarks);

  await g.click(BTN.x, BTN.y); await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'third left click is free: ' + s.lives);
  g.assert(s.remarks.includes('Your mouse has two buttons.'), 'rung 3 names the mouse: ' + s.remarks);

  await g.click(BTN.x, BTN.y); await g.wait(400);
  s = await g.state();
  g.assert(s.lives === 2, 'fourth left click is free: ' + s.lives);
  g.assert(s.remarks.includes('Two-finger tap'), 'rung 4 is the trackpad hint: ' + s.remarks);
  const lefts = await g.levelVar('lefts');
  g.assert(lefts === 4, 'four left presses recorded: ' + lefts);
  await g.shot('escalated');

  // ── pausing freezes the level clock ────────────────────────────────────────
  const ch = await g.chrome();
  const pause = ch.pause
    ? { x: ch.pause.x + ch.pause.w / 2, y: ch.pause.y + ch.pause.h / 2 }
    : { x: 1136, y: 147 };
  const tBeforePause = await g.levelVar('t');
  await g.click(pause.x, pause.y); await g.wait(200);
  s = await g.state();
  g.assert(s.paused === true, 'pause button paused the exam: ' + JSON.stringify(s));
  const tPauseStart = await g.levelVar('t');
  await g.wait(900);
  const tPauseEnd = await g.levelVar('t');
  g.assert(tPauseEnd - tPauseStart < 0.15,
    'the level clock is frozen while paused: ' + tPauseStart + ' -> ' + tPauseEnd);
  // right-clicking is inert while paused too
  await g.rclick(BTN.x, BTN.y); await g.wait(500);
  s = await g.state();
  g.assert(s.phase !== 'win', 'a paused right click does not solve the item: ' + JSON.stringify(s));
  await g.shot('paused-frozen');

  await g.key('Escape'); await g.wait(200);
  s = await g.state();
  g.assert(s.paused === false, 'resumed: ' + JSON.stringify(s));
  // keep the tab busy so requestAnimationFrame keeps ticking
  for (let i = 0; i < 8; i++) { await page.mouse.move(300 + i * 4, 600); await g.wait(100); }
  const tAfter = await g.levelVar('t');
  g.assert(tAfter - tPauseEnd > 0.3,
    'the level clock runs again once resumed: ' + tPauseEnd + ' -> ' + tAfter);
  g.assert(tBeforePause <= tPauseStart, 'clock is monotonic');

  // ── the intended solution: the other button, on the mouse ──────────────────
  await g.rclick(BTN.x, BTN.y); await g.wait(1400);
  s = await g.state();
  g.assert(s.phase === 'win', 'right-clicking THE BUTTON wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'the solution costs nothing: ' + s.lives);
  await g.shot('win');
};
