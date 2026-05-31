import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q20 — System Breach ───────────────────────────────────────────────────────
// The climax of the 11–20 stretch. The exam glitches as Frodrick forces his way
// back in. The two "proper" responses (YES / NO) do nothing but cost you. The only
// way through is the one thing the exam forbids: hit OVERRIDE — break the rules.
// This plants Q21's "maybe this time you need to cheat for once."

let raf20 = 0;

export const drawLevel20 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    cancelAnimationFrame(raf20);
    drawWinScreen(gc, 'ACCESS  OVERRIDDEN.', 'You broke the one rule they gave you. Sometimes that is the only way out.', 21);
    return;
  }
  ensureActive(gc);

  const now = Date.now();
  const jitter = () => (Math.sin(now / 47) > 0.6 ? (Math.random() - 0.5) * 4 : 0);

  // Glitching breach banner
  ctx.save();
  ctx.translate(jitter(), jitter());
  ctx.fillStyle    = '#e23b3b';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 34px ${displayFont}`;
  ctx.fillText('⚠  SYSTEM BREACH  ⚠', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.95);
  ctx.restore();

  ctx.fillStyle    = t.fgMid;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `17px ${bodyFont}`;
  ctx.fillText('An unauthorized presence is forcing entry into the exam.', cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.92);
  ctx.fillText('Terminate the intruder?', cx, topBoxY + topBoxHeight * 0.37, topBoxWidth * 0.92);

  // The two "sanctioned" responses — both are traps
  const btnW = topBoxWidth * 0.20;
  const btnH = topBoxHeight * 0.18;
  const gap  = topBoxWidth * 0.06;
  const pairW = btnW * 2 + gap;
  const startX = cx - pairW / 2;
  const btnY = topBoxY + topBoxHeight * 0.50;
  drawChoice(gc, 'YES', startX, btnY, btnW, btnH, () => wrong(gc), { fontSize: 24 });
  drawChoice(gc, 'NO',  startX + btnW + gap, btnY, btnW, btnH, () => wrong(gc), { fontSize: 24 });

  // The forbidden way out — flickering OVERRIDE in the corner
  const flick = Math.sin(now / 90) > -0.3;
  const oW = topBoxWidth * 0.18;
  const oH = 38;
  const oX = topBoxX + topBoxWidth - oW - topBoxWidth * 0.03;
  const oY = topBoxY + topBoxHeight - oH - topBoxHeight * 0.06;
  if (flick) {
    drawChoice(gc, '⛔ OVERRIDE', oX, oY, oW, oH, () => {
      state.levelSubPhase = 'win';
      gc.sounds.play('correctAnswer', { volume: 0.5 });
      gc.render();
    }, { fontSize: 15, fill: '#3a1010', textColor: '#ff6b6b' });
  } else {
    // Still clickable even on the "off" flicker frame, so it never feels unfair
    gc.hitAreas.push({
      x: oX, y: oY, w: oW, h: oH,
      action: () => { state.levelSubPhase = 'win'; gc.render(); },
    });
  }

  // Animation loop for the glitch
  cancelAnimationFrame(raf20);
  if (state.currentLevel === 20 && state.currentScreen === 'level' &&
      !state.paused && !state.controlsOpen && !state.gameOver && state.levelSubPhase === 'active') {
    raf20 = requestAnimationFrame(() => {
      if (gc.state.currentLevel !== 20 || gc.state.currentScreen !== 'level') return;
      gc.render();
    });
  }
};
