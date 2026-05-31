import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q12 — Read the Color ──────────────────────────────────────────────────────
// Stroop test. The instruction asks for the word printed in GREEN ink. Exactly
// one word is inked green — and it is NOT the word that spells "GREEN". The word
// that spells "GREEN" is inked a different color (the trap).

const GREEN = '#39c46b';
const WORDS: { text: string; ink: string }[] = [
  { text: 'BLUE',   ink: '#e23b3b' }, // red ink
  { text: 'GREEN',  ink: '#e2c33b' }, // yellow ink  ← trap (says green)
  { text: 'YELLOW', ink: '#3ba0e2' }, // blue ink
  { text: 'PURPLE', ink: GREEN      }, // GREEN ink   ← correct
  { text: 'RED',    ink: '#a060e2' }, // purple ink
  { text: 'ORANGE', ink: '#e2843b' }, // orange ink
];

export const drawLevel12 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'You saw the ink, not the word.', 13);
    return;
  }
  ensureActive(gc);

  // Prompt
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText('Click the word printed in GREEN.', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  // 2 rows × 3 columns of color words
  const cols = 3, rows = 2;
  const cellW = topBoxWidth * 0.26;
  const cellH = topBoxHeight * 0.26;
  const gapX  = topBoxWidth * 0.04;
  const gapY  = topBoxHeight * 0.06;
  const gridW = cols * cellW + (cols - 1) * gapX;
  const gridX = cx - gridW / 2;
  const gridY = topBoxY + topBoxHeight * 0.32;

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  WORDS.forEach(({ text, ink }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx  = gridX + col * (cellW + gapX);
    const by  = gridY + row * (cellH + gapY);

    ctx.fillStyle = ink;
    ctx.font      = `bold 34px ${displayFont}`;
    ctx.fillText(text, bx + cellW / 2, by + cellH / 2, cellW);

    gc.hitAreas.push({
      x: bx, y: by, w: cellW, h: cellH,
      action: () => {
        if (ink === GREEN) { state.levelSubPhase = 'win'; gc.render(); }
        else wrong(gc);
      },
    });
  });
};
