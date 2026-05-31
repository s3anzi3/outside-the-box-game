import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q49 — The Combination ─────────────────────────────────────────────────────
// The last lock before the end. Each digit is the answer to a question you've
// already solved. Set the dials and submit. Code = 6 · 1 · 2.

const CODE = [6, 1, 2];
const CLUES = [
  'Digit 1 — the number of F’s you counted on Q13.',
  'Digit 2 — how many times you could subtract 5 from 25 (Q42).',
  'Digit 3 — how many digits "1 + 1" had in base 2 (Q18).',
];

let digits49 = [0, 0, 0];

export const drawLevel49 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'UNLOCKED.', '6 · 1 · 2 — every digit something you already knew. One question left.', 50);
    return;
  }
  if (state.levelSubPhase !== 'active') { ensureActive(gc); digits49 = [0, 0, 0]; }

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 23px ${displayFont}`;
  ctx.fillText('Enter the code. You already know every digit.', cx, topBoxY + topBoxHeight * 0.07, topBoxWidth * 0.92);

  // Clues
  ctx.fillStyle = t.fgMid;
  ctx.font      = `14px ${bodyFont}`;
  ctx.textAlign = 'left';
  const lx = topBoxX + topBoxWidth * 0.14;
  CLUES.forEach((line, i) => {
    ctx.fillText(line, lx, topBoxY + topBoxHeight * (0.20 + i * 0.07), topBoxWidth * 0.76);
  });

  // Three dials
  const dialW = topBoxWidth * 0.12;
  const dialH = topBoxHeight * 0.18;
  const gap   = topBoxWidth * 0.05;
  const totW  = 3 * dialW + 2 * gap;
  const startX = cx - totW / 2;
  const dialY = topBoxY + topBoxHeight * 0.48;

  for (let i = 0; i < 3; i++) {
    const dx = startX + i * (dialW + gap);

    // ▲
    drawChoice(gc, '▲', dx, dialY - 34, dialW, 30, () => {
      digits49[i] = (digits49[i] + 1) % 10; gc.render();
    }, { fontSize: 16 });

    // digit
    ctx.fillStyle = state.darkMode ? '#1a1a1a' : '#e8e8e8';
    ctx.fillRect(dx, dialY, dialW, dialH);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(dx, dialY, dialW, dialH);
    ctx.fillStyle = t.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 40px ${displayFont}`;
    ctx.fillText(String(digits49[i]), dx + dialW / 2, dialY + dialH / 2);

    // ▼
    drawChoice(gc, '▼', dx, dialY + dialH + 4, dialW, 30, () => {
      digits49[i] = (digits49[i] + 9) % 10; gc.render();
    }, { fontSize: 16 });
  }

  // Submit
  const sW = topBoxWidth * 0.24, sH = 48;
  drawChoice(gc, 'SUBMIT', cx - sW / 2, topBoxY + topBoxHeight * 0.84, sW, sH, () => {
    if (digits49[0] === CODE[0] && digits49[1] === CODE[1] && digits49[2] === CODE[2]) {
      state.levelSubPhase = 'win';
    } else {
      gc.loseLife();
    }
    gc.render();
  }, { fontSize: 18 });
};
