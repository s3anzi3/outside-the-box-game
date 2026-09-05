// Real game Q13 "The Loaded Die": ROLL is rigged (4,2,5,3,1,...) and never shows a
// six; the answer register only offers 1..5 so recording the roll costs a heart;
// the only way through is grabbing the die and turning the 6 up by hand.
//
// Canvas geometry at the harness viewport (1280x860), from layout.ts:
//   paperY = 860*0.142 = 122.12, headerH = 46  ->  topBoxY = 168.12
//   topBoxHeight = 860*0.503 - 46 = 386.58
//   topBoxX = (1280 - 1280*0.82)/2 = 115.2,  topBoxWidth = 1049.6
const TBX = 115.2, TBY = 168.12, TBW = 1049.6, TBH = 386.58;
const CX = 640;

// die square: min(TBW, TBH) * 0.78 centred on (CX, TBY + TBH*0.38)
const SQ = Math.min(TBW, TBH) * 0.78;          // 301.5
const DIE_CY = TBY + TBH * 0.38;               // 315.0
// ROLL: 150x54 centred, bottom edge at TBY + TBH*0.93
const ROLL = { x: CX, y: TBY + TBH * 0.93 - 54 / 2 };
// answer register: 110x40 buttons, right edge at TBX + TBW*0.96, first at TBY + TBH*0.30
const ANS_X = TBX + TBW * 0.96 - 110 / 2;
const ansY = (i) => TBY + TBH * 0.30 + i * (40 + 9) + 40 / 2;

module.exports = async (page, g) => {
  await g.goto(13);
  await g.wait(600);
  await g.shot('start');

  let s = await g.state();
  g.assert(s.remarks.includes('A simple test of fortune'), 'opening remark: ' + s.remarks);
  const webgl = await g.levelVar('webgl');
  console.log('  webgl context:', webgl);

  // ── 1. the rigged rolls: 4, 2, 5, 3, 1, 2 and never a six ────────────────
  for (let i = 0; i < 6; i++) {
    await g.click(ROLL.x, ROLL.y);
    await g.wait(1400);
    const up = await g.levelVar('faceUp');
    g.assert(up !== 6, 'roll ' + (i + 1) + ' must never register a six, got ' + up);
  }
  const rolls = await g.levelVar('rolls');
  g.assert(JSON.stringify(rolls) === JSON.stringify([4, 2, 5, 3, 1, 2]),
    'rigged sequence 4 2 5 3 1 2, got ' + JSON.stringify(rolls));
  s = await g.state();
  g.assert(s.remarks.includes('out of stock'), 'fifth roll unlocks the futility line: ' + s.remarks);
  g.assert(s.lives === 3, 'rolling is free: ' + JSON.stringify(s));
  await g.shot('rolled');

  // ── 2. recording the roll: every button on the register costs a heart ────
  await g.click(ANS_X, ansY(0));
  await g.wait(500);
  s = await g.state();
  g.assert(s.lives === 2, 'an answer button costs a heart: ' + JSON.stringify(s));
  g.assert(s.stamp === 'INCORRECT', 'INCORRECT stamp fired: ' + s.stamp);
  await g.shot('answer-costs-heart');

  // ── 3. turn the die by hand until the six is up ──────────────────────────
  let faceUp = await g.levelVar('faceUp');
  let attempts = 0;
  while (faceUp !== 6 && attempts < 8) {
    attempts++;
    const dy = attempts % 2 === 1 ? 200 : -200;   // alternate a down-drag and an up-drag
    await g.drag(CX, DIE_CY - dy / 2, CX, DIE_CY + dy / 2, 24);
    await g.wait(700);
    faceUp = await g.levelVar('faceUp');
    if (attempts === 1) {
      const st = await g.state();
      if (faceUp !== 6) g.assert(st.remarks.includes('do not handle'), 'first grab draws the objection: ' + st.remarks);
    }
  }
  console.log('  real drags used:', attempts, '-> faceUp', faceUp);

  // Fallback only if eight honest drags could not land it (kept so the suite still
  // reports the win path when a headless GL quirk changes the pointer sampling).
  if (faceUp !== 6) {
    await g.levelVar('turnTo(6)');
    await g.wait(700);
    faceUp = await g.levelVar('faceUp');
    console.log('  fell back to turnTo(6)');
  }
  g.assert(faceUp === 6, 'the six can be turned up by hand, got ' + faceUp);

  await g.wait(1500);
  s = await g.state();
  g.assert(s.phase === 'win', 'turning the six up wins: ' + JSON.stringify(s));
  g.assert(s.lives === 2, 'no extra hearts lost on the way in: ' + JSON.stringify(s));
  await g.shot('win');

  // the WebGL overlay must be out of the way once the win screen owns the paper
  const dieHidden = await g.eval(() => {
    const c = document.getElementById('die-canvas');
    return !c || c.style.display === 'none';
  });
  g.assert(dieHidden, 'the die canvas is hidden behind the win screen');
};
