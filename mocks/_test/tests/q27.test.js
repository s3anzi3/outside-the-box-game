// Q27 · Keys But No Locks. Plays the level like a real player:
// (1) the KEYBOARD button (the conventional trap) slams INCORRECT and costs a heart,
// (2) typed letters show faintly, Backspace erases, the buffer keeps the last 8, wrong letters cost nothing,
// (3) a second miss escalates the hint ladder,
// (4) pause blocks typing (the keyboard is the only "timer" here) and resume restores it,
// (5) typing K-E-Y-B-O-A-R-D on the physical keyboard reaches the win screen, no other heart lost.
module.exports = async (page, h) => {
  // frame-unit centre of an element, so clicks are real mouse clicks at real coordinates
  const centre = async (id) => {
    const r = await h.eval((id) => {
      const b = document.getElementById(id).getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }, id);
    const sx = h.fbox.w / 1280, sy = h.fbox.h / 860;
    return { x: (r.x - h.fbox.x) / sx, y: (r.y - h.fbox.y) / sy };
  };
  const inPlay = (p, what) =>
    h.assert(p.x > 118 && p.x < 1162 && p.y > 171 && p.y < 552, what + ' sits inside the play area: ' + JSON.stringify(p));

  // opening remark is the real levelData copy
  await h.wait(2200);
  let s = await h.state();
  h.assert(s.remarks.startsWith('A riddle to test your wits.'), 'opening remark typed: ' + s.remarks);
  h.assert((await h.text('#qnum')) === 'Q.27', 'header shows Q.27');
  await h.shot('riddle');

  // nothing overflows the play area: every level element's box must lie within it
  const boxes = await h.eval(() => ['riddle', 'decoys', 'typed'].map(id => {
    const b = document.getElementById(id).getBoundingClientRect();
    return { id, l: b.left, t: b.top, r: b.right, b: b.bottom };
  }));
  const sx = h.fbox.w / 1280, sy = h.fbox.h / 860;
  for (const b of boxes) {
    const l = (b.l - h.fbox.x) / sx, r = (b.r - h.fbox.x) / sx, t = (b.t - h.fbox.y) / sy, bt = (b.b - h.fbox.y) / sy;
    h.assert(l >= 116 && r <= 1164 && t >= 171 && bt <= 552, b.id + ' inside play area: ' + JSON.stringify({ l, t, r, bt }));
  }

  // (1) conventional trap: the KEYBOARD button is the right word said the wrong way
  const kb = await centre('optKEYBOARD'); inPlay(kb, 'KEYBOARD button');
  await h.click(kb.x, kb.y);
  await h.wait(250);
  await h.shot('keyboard-button');
  s = await h.state();
  let ev = await h.events();
  h.assert(s.lives === 2, 'KEYBOARD button costs a heart: ' + s.lives);
  h.assert(ev.includes('stamp:INCORRECT'), 'INCORRECT stamp slammed');
  h.assert(ev.includes('remark:Yes. That is the word. That is not how you say it.'), 'KEYBOARD-click remark');

  // (2) typing: preview, Backspace, rolling buffer, no hearts for wrong letters
  await h.type('pianox');
  await h.key('Backspace');
  let lvl = await h.eval(() => window.__mock.level);
  h.assert(lvl.typed === 'PIANO', 'buffer after "pianox" + Backspace: ' + lvl.typed);
  h.assert((await h.text('#typed')) === 'PIANO', 'faint preview shows PIANO');
  ev = await h.events();
  h.assert(ev.includes('remark:Now we are talking. Keep going.'), 'first letter reaction');
  await h.shot('typing');
  await h.type('abcdefghij');
  lvl = await h.eval(() => window.__mock.level);
  h.assert(lvl.typed === 'CDEFGHIJ', 'rolling buffer keeps the last 8 letters: ' + lvl.typed);
  s = await h.state();
  h.assert(s.lives === 2 && !s.solved, 'wrong letters cost nothing');

  // Space / arrows never scroll the page
  await h.key('Space'); await h.key('ArrowDown'); await h.key('ArrowUp');
  const scrollY = await h.eval(() => window.scrollY);
  h.assert(scrollY === 0, 'Space/arrows must not scroll the page: ' + scrollY);
  lvl = await h.eval(() => window.__mock.level);
  h.assert(lvl.typed === 'CDEFGHIJ', 'non-letters never enter the buffer: ' + lvl.typed);

  // (3) second miss: the hint ladder escalates
  const house = await centre('optHOUSE'); inPlay(house, 'HOUSE button');
  await h.click(house.x, house.y);
  await h.wait(200);
  s = await h.state(); ev = await h.events();
  h.assert(s.lives === 1, 'HOUSE costs a heart: ' + s.lives);
  h.assert(ev.includes('remark:The answer is not on the paper, candidate. It is under your hands.'), 'second-miss remark');

  // (4) pause: keys are ignored while the exam is suspended
  await h.click(1136, 147);
  await h.wait(200);
  s = await h.state();
  h.assert(s.paused === true, 'pause overlay shows');
  await h.type('keyboard');
  await h.wait(100);
  s = await h.state();
  h.assert(!s.solved && !s.win, 'typing while paused must not solve');
  lvl = await h.eval(() => window.__mock.level);
  h.assert(lvl.typed === 'CDEFGHIJ', 'buffer untouched while paused: ' + lvl.typed);
  await h.shot('paused');
  const res = await centre('resumeBtn');
  await h.click(res.x, res.y);
  await h.wait(200);
  s = await h.state();
  h.assert(s.paused === false, 'resumed');

  // (5) the intended solution: type it on the physical keyboard
  await h.type('keyboar');
  s = await h.state();
  h.assert(!s.solved, 'not solved one letter early');
  await h.type('d');
  await h.wait(150);
  await h.shot('correct-stamp');
  await h.wait(900);
  s = await h.state(); ev = await h.events();
  h.assert(s.solved && s.win, 'typing KEYBOARD wins: ' + JSON.stringify(s));
  h.assert(ev.includes('typed:KEYBOARD') && ev.includes('stamp:CORRECT') && ev.includes('win'), 'CORRECT stamp + win event');
  h.assert((await h.text('#winTitle')) === 'KEYBOARD.', 'win title');
  h.assert((await h.text('#winBody')).startsWith('You did not click it.'), 'win body');
  h.assert(s.lives === 1, 'no other heart lost: ' + s.lives);
  await h.shot('win');

  // after the win, keys are inert
  await h.type('house');
  s = await h.state();
  h.assert(s.lives === 1 && s.win && !s.gameover, 'post-win input is inert');
};
