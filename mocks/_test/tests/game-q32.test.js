// Real game Q32 "Listen": guessing a word costs a heart, the paper dial alone is not
// enough, the pause menu's SOUND slider is the second volume, and the pause freezes
// the level clock / the repeating speech.
module.exports = async (page, g) => {
  await g.goto(32);
  await g.wait(500);
  await g.shot('start');

  const ch = await g.chrome();
  const play = ch.play;
  g.assert(play && play.w > 900, 'play rect: ' + JSON.stringify(play));

  const word = await g.levelVar('word');
  const shown = await g.levelVar('shown');
  g.assert(Array.isArray(shown) && shown.length === 4, 'four words on the paper: ' + JSON.stringify(shown));
  g.assert(shown.indexOf(word) >= 0, 'the spoken word is one of the four: ' + word);

  // The hall is not at full volume when the item opens (that is the whole puzzle).
  const hall0 = await g.levelVar('hall');
  g.assert(hall0 <= 0.71, 'hall volume starts below full: ' + hall0);
  g.assert((await g.levelVar('audible')) === false, 'nothing is audible yet');

  // ── word button geometry (s = 1 at 1280x860): 4 x 190 wide, 60 tall, 26 apart ──
  const bw = 190, bh = 60, gap = 26;
  const rowW = 4 * bw + 3 * gap;
  const bx0 = 640 - rowW / 2;
  const by = play.y + play.h * 0.62;
  const wordAt = (i) => ({ x: bx0 + i * (bw + gap) + bw / 2, y: by + bh / 2 });

  // ── the conventional trap: guess a word straight away ──────────────────────
  const wrongIdx = shown.findIndex((x) => x !== word);
  const wp = wordAt(wrongIdx);
  await g.click(wp.x, wp.y);
  await g.wait(1200);
  let s = await g.state();
  g.assert(s.lives === 2, 'guessing costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Turn the dial all the way up first'), 'first rung of the ladder: ' + s.remarks);
  await g.shot('guessed');

  // ── the paper dial: all the way up, still nothing ──────────────────────────
  const trackX = play.x + play.w * 0.20;
  const trackW = play.w * 0.60;
  const trackY = play.y + play.h * 0.36 + 5;
  await g.drag(trackX + 4, trackY, trackX + trackW + 40, trackY, 25);
  await g.wait(500);
  const dial = await g.levelVar('dial');
  g.assert(dial >= 9.6, 'dial dragged to the top: ' + dial);
  g.assert((await g.levelVar('audible')) === false, 'the paper dial alone is not enough');
  s = await g.state();
  g.assert(s.remarks.includes('second volume'), 'examiner points at the second volume: ' + s.remarks);
  g.assert(s.lives === 2, 'the dial costs nothing');
  await g.shot('dial-max');

  // ── pause freezes the level clock and the repeating audio ──────────────────
  const t0 = await g.levelVar('t');
  const spoke0 = await g.levelVar('spoken');
  await g.click(ch.pause.x + ch.pause.w / 2, ch.pause.y + ch.pause.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'pause menu is open');
  const tPaused = await g.levelVar('t');
  await g.wait(800);
  const tPaused2 = await g.levelVar('t');
  g.assert(Math.abs(tPaused2 - tPaused) < 0.02, 'level clock frozen while paused: ' + tPaused + ' -> ' + tPaused2);
  g.assert(tPaused >= t0, 'clock ran before the pause: ' + t0 + ' -> ' + tPaused);
  g.assert((await g.levelVar('spoken')) === spoke0, 'no new repetitions while paused');
  await g.shot('paused');

  // ── the second volume: drag SOUND to one hundred inside the pause menu ─────
  const pad = play.w * 0.05;
  const ox = play.x + pad, ow = play.w - pad * 2;
  const oy = play.y + pad, oh = play.h - pad * 2;
  const sliderW = Math.min(ow * 0.34, 220);
  const sliderX = ox + ow * 0.14;
  const sliderY = oy + oh * 0.54;
  await g.drag(sliderX + sliderW * 0.6, sliderY, sliderX + sliderW - 1, sliderY, 20);
  await g.wait(400);
  const hall1 = await g.levelVar('hall');
  g.assert(hall1 >= 0.99, 'SOUND dragged to one hundred: ' + hall1);
  g.assert((await g.levelVar('audible')) === true, 'both volumes up: the word is audible');
  s = await g.state();
  g.assert(s.remarks.includes('Now you can hear it'), 'examiner confirms: ' + s.remarks);
  await g.shot('sound-max');

  // RESUME (right column of the pause card)
  const btnW = 220, btnH = Math.max(40, oh * 0.13);
  await g.click(ox + ow * 0.62 + btnW / 2, oy + oh * 0.30 + btnH / 2);
  await g.wait(1200);
  s = await g.state();
  g.assert(s.paused === false, 'resumed');
  g.assert((await g.levelVar('spoken')) >= 1, 'the speaker repeats the word while audible');

  // ── the intended solution: pick the word you can now hear ──────────────────
  const rightIdx = shown.indexOf(word);
  const rp = wordAt(rightIdx);
  await g.click(rp.x, rp.y);
  await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'hearing the word wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'no extra heart lost: ' + s.lives);
  await g.shot('win');
};
