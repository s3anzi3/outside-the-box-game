// Real game Q23 "Truth Table": a conventional conclusion costs a heart, the right
// conclusion needs the table to agree, and the idle meter freezes while paused.
module.exports = async (page, g) => {
  await g.goto(23);
  await g.wait(500);

  const ch = await g.chrome();
  const p = ch.play;
  g.assert(p && p.w > 0, 'play rect from chrome: ' + JSON.stringify(p));

  // Layout mirrors Level23.ts: table 76% wide / 5 columns, rows 9.7% of the play box,
  // conclusions 44% wide in two columns starting at 79% down.
  const tblW = p.w * 0.76, colW = tblW / 5;
  const tblX = p.x + p.w / 2 - tblW / 2;
  const tblY = p.y + p.h * 0.22, rowH = p.h * 0.097;
  // open columns are 2,3,4 (P → Q, Q → P, Result); rows 0..3 sit under the head row
  const cell = (r, i) => [tblX + colW * (i + 2.5), tblY + rowH * (r + 1.5)];

  const optW = p.w * 0.44, optGapX = p.w * 0.03, optH = 34, optGapY = 7;
  const optY0 = p.y + p.h * 0.79;
  const opt = (k) => [
    p.x + p.w / 2 - optW - optGapX / 2 + (k % 2) * (optW + optGapX) + optW / 2,
    optY0 + Math.floor(k / 2) * (optH + optGapY) + optH / 2,
  ];

  let s = await g.state();
  g.assert(s.caption === '·  CONFIDENTIAL  ·', 'the paper caption reads CONFIDENTIAL: ' + JSON.stringify(s.caption));
  g.assert(s.lives === 3, 'three hearts at the start: ' + s.lives);
  await g.shot('start');

  // ── the conventional trap: pick a conclusion without reading the table ──────
  await g.click(...opt(0));
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'a wrong conclusion costs a heart: ' + JSON.stringify(s));
  g.assert(s.remarks.includes('Read the table'), 'reread remark: ' + s.remarks);
  await g.shot('wrong-conclusion');

  // ── the right conclusion with an empty table: free, but nudged ─────────────
  await g.click(...opt(2));
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'the nudge is free: ' + JSON.stringify(s));
  g.assert(s.phase === 'active', 'an empty table does not win: ' + s.phase);
  g.assert(s.remarks.includes('disagrees with you'), 'disagree nudge: ' + s.remarks);
  await g.shot('disagree');

  // ── the idle meter runs, then freezes while paused ─────────────────────────
  const idleA = await g.levelVar('idle');
  await g.wait(1300);
  const idleB = await g.levelVar('idle');
  g.assert(idleB - idleA > 0.6, 'the idle meter runs while playing: ' + idleA + ' -> ' + idleB);

  const pz = (await g.chrome()).pause || { x: 1119, y: 130, w: 34, h: 34 };
  await g.click(pz.x + pz.w / 2, pz.y + pz.h / 2);
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === true, 'the pause button paused the exam: ' + JSON.stringify(s));
  const idleC = await g.levelVar('idle');
  await g.wait(1300);
  const idleD = await g.levelVar('idle');
  g.assert(Math.abs(idleD - idleC) < 0.25, 'the idle meter freezes while paused: ' + idleC + ' -> ' + idleD);
  await g.shot('paused');

  await g.key('Escape');
  await g.wait(300);
  s = await g.state();
  g.assert(s.paused === false, 'Escape resumed the exam');

  // ── fill the table: T T T / F T F / T F F / T T T (blank -> T -> F -> blank) ─
  const CLICKS = [[1, 1, 1], [2, 1, 2], [1, 2, 2], [1, 1, 1]];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 3; i++) {
      const [x, y] = cell(r, i);
      for (let n = 0; n < CLICKS[r][i]; n++) { await g.click(x, y); await g.wait(60); }
    }
  }
  await g.wait(300);
  s = await g.state();
  g.assert(s.lives === 2, 'filling cells is free: ' + JSON.stringify(s));
  const cells = await g.levelVar('cells');
  g.assert(JSON.stringify(cells) === JSON.stringify(['TTT', 'FTF', 'TFF', 'TTT']), 'table filled: ' + JSON.stringify(cells));
  g.assert((await g.levelVar('tableOK')) === true, 'the table is correct');
  await g.shot('table-filled');

  // ── the intended solution ─────────────────────────────────────────────────
  await g.click(...opt(2));
  await g.wait(1200);
  s = await g.state();
  g.assert(s.phase === 'win', 'the matching conclusion wins: ' + JSON.stringify(s));
  g.assert(s.stamp === 'CASE CLOSED', 'the win stamp reads CASE CLOSED: ' + s.stamp);
  g.assert(s.caption === '·  CONFIDENTIAL  ·', 'the caption stays CONFIDENTIAL on the win screen');
  await g.shot('win');
};
