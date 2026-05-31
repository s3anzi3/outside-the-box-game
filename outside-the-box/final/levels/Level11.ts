import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, ensureActive, drawWinScreen } from './lateralHelpers';

// ── Q11 — The Fine Print ──────────────────────────────────────────────────────
// A wall of compliance legalese. The only valid response is a single word buried
// mid-paragraph. The big obvious buttons below are decoys that punish skimming.

const TARGET_WORD = 'PINEAPPLE';

const LINES_BEFORE = [
  'SECTION 7.3 — CANDIDATE ACKNOWLEDGEMENT.  By proceeding with this',
  'assessment the candidate affirms that they have read, understood, and',
  'agreed to all preceding and subsequent terms without exception, and',
];
// The line that hides the answer, split so we can locate the word precisely.
const TARGET_PRE  = 'further affirm that the single valid response is the word ';
const TARGET_POST = ',';
const LINES_AFTER = [
  'which must be selected directly from this clause and not via any control',
  'rendered below. The buttons below are provided solely for candidates who',
  'do not read. This clause supersedes every instruction to the contrary.',
];

const DECOYS = ['I AGREE', 'ACCEPT ALL', 'CONTINUE  →'];

export const drawLevel11 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'NOTED.', 'You actually read it. Almost nobody does.', 12);
    return;
  }
  ensureActive(gc);

  // Heading
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold 22px ${displayFont}`;
  ctx.fillText('TERMS OF ASSESSMENT', cx, topBoxY + topBoxHeight * 0.07);

  // Paragraph
  const px      = topBoxX + topBoxWidth * 0.08;
  const lineGap = topBoxHeight * 0.072;
  let   y       = topBoxY + topBoxHeight * 0.20;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.font         = `15px ${bodyFont}`;
  ctx.fillStyle    = t.fgMid;

  for (const line of LINES_BEFORE) { ctx.fillText(line, px, y); y += lineGap; }

  // Target line: draw pre + WORD + post, measuring so we can hit-test the word.
  ctx.font = `15px ${bodyFont}`;
  const preW   = ctx.measureText(TARGET_PRE).width;
  const wordW  = ctx.measureText(TARGET_WORD).width;
  ctx.fillStyle = t.fgMid;
  ctx.fillText(TARGET_PRE, px, y);
  ctx.fillText(TARGET_WORD, px + preW, y);          // visually identical — no highlight
  ctx.fillText(TARGET_POST, px + preW + wordW, y);
  const wordX = px + preW;
  const wordY = y;
  y += lineGap;

  for (const line of LINES_AFTER) { ctx.fillText(line, px, y); y += lineGap; }

  // Hidden hit area over the buried word
  const pad = 6;
  gc.hitAreas.push({
    x: wordX - pad,
    y: wordY - lineGap * 0.45,
    w: wordW + pad * 2,
    h: lineGap * 0.9,
    action: () => { state.levelSubPhase = 'win'; gc.render(); },
  });

  // Decoy buttons (all wrong)
  const btnW = topBoxWidth * 0.22;
  const btnH = 44;
  const gap  = topBoxWidth * 0.04;
  const totW = DECOYS.length * btnW + (DECOYS.length - 1) * gap;
  const startX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.84;
  DECOYS.forEach((label, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH,
      () => wrong(gc), { fontSize: 16 });
  });
};
