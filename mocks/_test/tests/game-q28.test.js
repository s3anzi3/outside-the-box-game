// Real game Q28 — FRODRICK.EXE.
// There is no lateral trick here: the trap is standing under him when he fires
// (each shot that lands slams INCORRECT and costs a heart), and the intended
// solution is killing him. The fight is shortened with the level's sanctioned
// HP hook, but every shot fired and every hit landed is real keyboard input.
//
// Layout at 1280x860: play area x 118..1162, y 171..552; pause button ~ (1136,147).

const lv = (g) => g.eval(() => {
  const L = (window.__gc && window.__gc.lv) || {};
  const s = window.__gc.state;
  return {
    hp: L.hp, phase: L.phase, playerX: L.playerX, bossX: L.bossX, bossT: L.bossT,
    taken: L.hitsTaken, landed: L.hitsLanded, bb: L.bb || [],
    lives: s.lives, sub: s.levelSubPhase, over: s.gameOver,
  };
});

// One decision tick: hold a direction for `ms`, then let go.
const nudge = async (g, dir, ms) => { await g.keyDown(dir); await g.wait(ms); await g.keyUp(dir); };

module.exports = async (page, g) => {
  await g.goto(28);
  await g.wait(600);

  let s = await g.state();
  g.assert(s.lives === 3, 'starts on three hearts: ' + JSON.stringify(s));
  g.assert(s.remarks.toLowerCase().includes('frodrick'), 'opening remark names FRODRICK.EXE: ' + s.remarks);
  let L = await lv(g);
  g.assert(L.hp === 110 && L.phase === 0, 'boss starts at 110 HP in phase 0: ' + JSON.stringify(L));
  await g.shot('start');

  // ── The trap: stand in his fire instead of dodging it ─────────────────────
  // Walk under the lowest incoming shot (under the boss when the sky is clear)
  // and never fire back. This is the conventional, wrong instinct.
  await g.click(640, 360);            // put focus on the game canvas
  for (let i = 0; i < 80; i++) {
    L = await lv(g);
    if (L.taken >= 1 || L.over) break;
    let target = L.bossX + 75;
    let lowest = -1;
    for (const b of L.bb) { if (b.y > lowest) { lowest = b.y; target = b.x; } }
    await nudge(g, target > L.playerX + 20 ? 'd' : 'a', 60);
  }
  L = await lv(g);
  g.assert(L.taken >= 1, 'the level let a boss shot land: ' + JSON.stringify(L));

  s = await g.state();
  g.assert(s.lives === 2, 'a landed shot costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'a landed shot slams INCORRECT: ' + s.stamp);
  g.assert(s.remarks.includes('Sidestep'), 'first-hit remark: ' + s.remarks);
  await g.shot('hit');

  // ── Pause freezes the fight ───────────────────────────────────────────────
  const ch = await g.chrome();
  const pb = ch.pause || { x: 1119, y: 130, w: 34, h: 34 };
  await g.click(pb.x + pb.w / 2, pb.y + pb.h / 2);
  await g.wait(200);
  s = await g.state();
  g.assert(s.paused, 'pause button paused the exam: ' + JSON.stringify(s));

  const before = await lv(g);
  await g.keyDown(' ');
  await nudge(g, 'd', 300);
  await g.wait(500);
  await g.keyUp(' ');
  const after = await lv(g);
  g.assert(before.bossT === after.bossT, 'boss clock frozen while paused: ' + before.bossT + ' vs ' + after.bossT);
  g.assert(before.bossX === after.bossX, 'boss frozen while paused: ' + before.bossX + ' vs ' + after.bossX);
  g.assert(before.playerX === after.playerX, 'ship frozen while paused: ' + before.playerX + ' vs ' + after.playerX);
  g.assert(before.hp === after.hp, 'no shots land while paused: ' + before.hp + ' vs ' + after.hp);
  await g.shot('paused');

  await g.key('Escape');              // resume from the suspension notice
  await g.wait(300);
  s = await g.state();
  g.assert(!s.paused, 'resumed: ' + JSON.stringify(s));

  // ── The solution: shoot him until he terminates ───────────────────────────
  // Fresh entry (three hearts again), then the sanctioned test shortcut drops
  // his HP so one earned hit finishes him. The hit itself is real: SPACE fires,
  // A/D track him, and only a bullet that reaches the monitor counts.
  await g.goto(28);
  await g.wait(500);
  await g.click(640, 360);
  const set = await g.eval(() => window.__gc.lv.setBossHP(5));
  g.assert(set === 5, 'test hook shortened the fight: ' + set);

  await g.keyDown(' ');               // hold to autofire
  for (let i = 0; i < 120; i++) {
    L = await lv(g);
    if (L.sub === 'win' || L.over || L.hp === 0) break;
    await nudge(g, L.bossX + 75 > L.playerX + 20 ? 'd' : 'a', 55);
  }
  await g.keyUp(' ');
  await g.wait(600);

  s = await g.state();
  g.assert(!s.gameOver, 'survived the kill run: ' + JSON.stringify(s));
  g.assert(s.phase === 'win', 'killing FRODRICK.EXE wins the level: ' + JSON.stringify(s));
  await g.shot('win');
};
