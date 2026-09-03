// Q.24 Easy One. Plays the level like a real player:
//   exploring (hover, right-click, blank paper) is free,
//   a decoy (HINT) slams INCORRECT + costs a heart + changes the remark,
//   pause blocks input (the HINT button pokes out past the overlay's margin),
//   a wrong number costs a heart with no new remark,
//   clicking 30 wins and CONTINUE points at Q.25,
//   nothing costs a heart after the win, nothing overflows the play area.
module.exports = async (page, h) => {
  const sx = h.fbox.w / 1280, sy = h.fbox.h / 860;
  const toFrame = p => ({ x: (p.x - h.fbox.x) / sx, y: (p.y - h.fbox.y) / sy });
  const rect = async (id) => h.eval(id => {
    const b = document.getElementById(id).getBoundingClientRect();
    return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height };
  }, id);
  const centre = async (id) => { const r = await rect(id); return toFrame({ x: r.l + r.w / 2, y: r.t + r.h / 2 }); };
  const clickEl = async (id) => { const c = await centre(id); await h.click(c.x, c.y); };

  // ── load: opening remark, three hearts, everything inside the play area ──
  await h.wait(900);
  let s = await h.state();
  h.assert(s.remarks.includes('This should be an easy one'), 'opening remark should be typed: ' + s.remarks);
  h.assert(s.lives === 3 && !s.solved && !s.paused, 'fresh start: ' + JSON.stringify(s));

  const els = await h.eval(() => [...document.querySelectorAll('#play > .btn, #answers .btn, #question')].map(e => {
    const b = e.getBoundingClientRect(); return { id: e.id, l: b.left, t: b.top, r: b.right, b: b.bottom };
  }));
  h.assert(els.length === 15, 'expected 10 decoys + 4 answers + the question, got ' + els.length);
  for (const e of els) {
    const a = toFrame({ x: e.l, y: e.t }), b = toFrame({ x: e.r, y: e.b });
    h.assert(a.x >= 117 && b.x <= 1163 && a.y >= 170 && b.y <= 553,
      `${e.id} overflows the play area: ${a.x.toFixed(0)},${a.y.toFixed(0)}..${b.x.toFixed(0)},${b.y.toFixed(0)}`);
  }
  const labels = await h.eval(() => [...document.querySelectorAll('#play > .btn')].map(b => b.textContent));
  h.assert(labels.join('|') === 'HINT|CALCULATE|EASY  MODE  ON|SHOW STEPS|SKIP  →|CONFIRM|CHECK ANSWER|USE CALCULATOR|SUBMIT ALL|SOLVE',
    'decoy labels should match Level24.ts: ' + labels.join('|'));
  const answers = await h.eval(() => [...document.querySelectorAll('#answers .btn')].map(b => b.textContent));
  h.assert(answers.join('|') === '25|30|35|1515', 'answers should be 25 / 30 / 35 / 1515: ' + answers.join('|'));

  // ── exploring is free: hover HINT, right-click it, click blank paper ──
  let c = await centre('decoy0');
  await h.move(c.x, c.y, 8); await h.wait(150);
  await h.shot('hover-hint');
  await h.rclick(c.x, c.y); await h.wait(150);
  await h.click(218, 271); await h.wait(150);          // blank paper left of the question
  s = await h.state();
  h.assert(s.lives === 3 && !s.solved, 'hover / right-click / blank paper must not cost a heart: ' + JSON.stringify(s));

  // ── 1. the conventional trap: reach for HINT ──
  await clickEl('decoy0'); await h.wait(250);
  await h.shot('decoy-stamp');
  s = await h.state(); let ev = await h.events();
  h.assert(s.lives === 2, 'a decoy costs a heart, lives=' + s.lives);
  h.assert(ev.includes('stamp:INCORRECT') && ev.includes('life:2'), 'a decoy slams INCORRECT: ' + ev.join(','));
  await h.wait(1400);
  s = await h.state();
  h.assert(s.remarks.includes('It IS an easy one. You are the one making it hard.'), 'decoy remark: ' + s.remarks);

  // ── 2. pause blocks input (no timer here). HINT's left edge sits outside the overlay's 5% margin ──
  await h.click(1136, 147); await h.wait(200);
  s = await h.state();
  h.assert(s.paused === true, 'pause button should show the overlay');
  await h.shot('paused');
  const hr = await rect('decoy0');
  const edge = toFrame({ x: hr.l + 8, y: hr.t + hr.h / 2 });
  const ov = await rect('pauseov');
  h.assert(hr.l + 8 < ov.l, 'test setup: HINT should poke out past the overlay (hint.l=' + hr.l + ' overlay.l=' + ov.l + ')');
  await h.click(edge.x, edge.y); await h.wait(200);
  s = await h.state();
  h.assert(s.lives === 2 && s.paused, 'a decoy click while paused must be ignored: ' + JSON.stringify(s));
  c = await centre('ans30'); await h.click(c.x, c.y); await h.wait(200);
  s = await h.state();
  h.assert(!s.solved && s.lives === 2, 'the overlay covers the answers: ' + JSON.stringify(s));
  await clickEl('resumeBtn'); await h.wait(200);
  s = await h.state();
  h.assert(s.paused === false, 'RESUME should hide the overlay');

  // ── 3. a wrong number costs a heart; the remark stays (faithful) ──
  await clickEl('ans25'); await h.wait(250);
  s = await h.state(); ev = await h.events();
  h.assert(s.lives === 1, 'a wrong number costs a heart, lives=' + s.lives);
  h.assert(ev.filter(e => e === 'stamp:INCORRECT').length === 2, 'second INCORRECT stamp');
  h.assert(ev.filter(e => e.startsWith('remark:')).length === 2, 'a wrong number adds no remark: ' + ev.filter(e => e.startsWith('remark:')).join(' / '));
  await h.wait(800);

  // ── 4. the solution: just click 30 ──
  await clickEl('ans30'); await h.wait(300);
  await h.shot('correct-stamp');
  await h.wait(700);
  s = await h.state(); ev = await h.events();
  h.assert(s.solved && s.win, 'clicking 30 should win: ' + JSON.stringify(s));
  h.assert(ev.includes('win') && ev.includes('stamp:CORRECT'), 'win events: ' + ev.join(','));
  const title = await h.text('#winTitle');
  const body = await h.text('#winBody');
  h.assert(title === 'CORRECT.', 'win title: ' + title);
  h.assert(body === '15 + 15 = 30. Well done. Every other button on that page was a lie.', 'win body: ' + body);
  await h.shot('win');
  await clickEl('winContinue'); await h.wait(200);
  const toast = await h.text('#toast');
  h.assert(toast.includes('Q.25') && toast.includes('Lights Maze'), 'CONTINUE should toast Q.25 (Lights Maze): ' + toast);
  await h.shot('continue-toast');

  // ── nothing costs a heart after the win ──
  await h.eval(() => { document.getElementById('decoy5').click(); document.getElementById('ans35').click(); });
  await h.wait(100);
  s = await h.state();
  h.assert(s.lives === 1 && s.solved && !s.gameover, 'buttons are dead after the win: ' + JSON.stringify(s));
  const lvl = await h.eval(() => window.__mock.level);
  h.assert(lvl.decoyHits === 1 && lvl.wrongAnswers === 1, 'level counters: ' + JSON.stringify(lvl));
};
