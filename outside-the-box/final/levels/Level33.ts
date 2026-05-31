import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q33 — Proofread ───────────────────────────────────────────────────────────
// One word in the official paragraph is misspelled. Click it. Everything else
// costs a life. Rewards careful reading over skimming.

const WORDS =
  'The candidate must recieve their certificate only after every single question has been answered with care.'
    .split(' ');
const TYPO_INDEX = 3;   // "recieve"

export const drawLevel33 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CAUGHT IT.', '"recieve" → receive. I before E, except after C.', 34);
    return;
  }
  ensureActive(gc);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 24px ${displayFont}`;
  ctx.fillText('One word is misspelled. Click it.', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9);

  // Word-wrapped layout with a hit area per word
  const px = topBoxX + topBoxWidth * 0.10;
  const maxRight = topBoxX + topBoxWidth * 0.90;
  const lineH = topBoxHeight * 0.12;
  ctx.font = `24px ${bodyFont}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const spaceW = ctx.measureText(' ').width;

  let curX = px;
  let curY = topBoxY + topBoxHeight * 0.34;
  WORDS.forEach((word, i) => {
    const wordW = ctx.measureText(word).width;
    if (curX + wordW > maxRight) { curX = px; curY += lineH; }

    ctx.fillStyle = t.fgMid;
    ctx.fillText(word, curX, curY);

    gc.hitAreas.push({
      x: curX - 3, y: curY - lineH * 0.35, w: wordW + 6, h: lineH * 0.7,
      action: () => {
        if (i === TYPO_INDEX) { state.levelSubPhase = 'win'; gc.render(); }
        else wrong(gc);
      },
    });

    curX += wordW + spaceW;
  });
};
