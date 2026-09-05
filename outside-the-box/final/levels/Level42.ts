import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawHeart, roundRect, uiScale } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q42 — Entry Fee ───────────────────────────────────────────────────────────
// The paper charges admission. One of the candidate's three hearts lifts out of
// CANDIDATE STANDING and flies onto the paper, where it sits in a printed box
// marked FEE; the HUD shows the empty slot with the note ONE ON THE PAPER.
// Then the question: "How many hearts has this item cost you?" with 0, 1, 2, 3.
// The overthinking instinct (it is a trick, so 0; it will cost more, so 2) is the
// trap and costs a real heart. The answer is 1, read straight off the fee box.
// On the win the fee flies home and is refunded. Replaces the old
// "how many times can you subtract 5 from 25" arithmetic riddle.

const CHOICES = ['0', '1', '2', '3'];
const CORRECT = '1';

const OPENING  = 'One moment. Admission is being processed.';
const QUESTION = 'A little arithmetic. Read it very literally. One heart deducted. How many has this item cost you?';
const LADDER = [
  'Do not overthink it. The fee is in the box on the paper. Count it.',
  'One heart is on the paper. One.',
  'Press 1. You will get it back.',
];

// Timings (seconds on the pause-aware level clock) — the mock's 1400ms wait,
// 1s flight, 500ms beat, then a 600ms cross-fade.
const FEE_AT       = 1.4;
const FLY          = 1.0;
const QUESTION_AT  = 0.5;
const FADE         = 0.6;
const OPEN_FADE    = 0.5;
const LADDER_DELAY = 0.7;

const HIDDEN: number[] = [2];
const NONE:   number[] = [];

type Phase42 = 'intro' | 'flying' | 'settled' | 'question' | 'refunding';

let phase42: Phase42 = 'intro';
let fails42    = 0;
let flyAt42    = 0;
let settleAt42 = 0;
let refundAt42 = 0;
let sayAt42    = 0;
let sayText42  = '';
const clock42 = { last: 0, elapsed: 0 };

// cubic-bezier(.4,.1,.3,1) / (.3,.6,.4,1) in the mock: x eases both ends, y leaves early.
const easeX = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeY = (p: number) => 1 - Math.pow(1 - p, 2.2);

// Small letter-spaced label helper (the renderer's tracking helper is private).
const tracked = (
  ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, track: number,
) => {
  const chars = text.split('');
  let total = -track;
  for (const c of chars) total += ctx.measureText(c).width + track;
  let px = cx - total / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const c of chars) { ctx.fillText(c, px, y); px += ctx.measureText(c).width + track; }
  ctx.textAlign = prev;
  return total;
};

export const drawLevel42 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  const WIN_TITLE = 'ONE.';
  const WIN_BODY  = 'The fee is refunded. Corporate is trialling admission charges for questions.';

  if (state.levelSubPhase === 'win') {
    state.hudHiddenHearts = NONE;
    state.hudHeartsLabel  = 'CANDIDATE STANDING';
    drawWinScreen(gc, WIN_TITLE, WIN_BODY, 43);
    return;
  }

  if (freshEntry(gc)) {
    phase42 = 'intro';
    fails42 = 0; flyAt42 = 0; settleAt42 = 0; refundAt42 = 0;
    sayAt42 = 0; sayText42 = '';
    clock42.last = 0; clock42.elapsed = 0;
    state.hudHiddenHearts = NONE;
    state.hudHeartsLabel  = 'CANDIDATE STANDING';
    say(gc, OPENING);
  }

  const { elapsed } = levelClock(gc, clock42);

  // ── the fee is levied, flies, lands, and the question opens ────────────────
  if (phase42 === 'intro' && elapsed >= FEE_AT) {
    phase42 = 'flying';
    flyAt42 = elapsed;
    if (state.lives > 0) state.lives--;   // the fee is a charge, not a mistake: no loseLife()
    gc.sounds.ui('tick');
  }
  if (phase42 === 'flying' && elapsed >= flyAt42 + FLY) {
    phase42 = 'settled';
    settleAt42 = elapsed;
    gc.sounds.ui('thud');
  }
  if (phase42 === 'settled' && elapsed >= settleAt42 + QUESTION_AT) {
    phase42 = 'question';
    say(gc, QUESTION);
  }
  if (phase42 === 'refunding' && elapsed >= refundAt42 + FLY) {
    state.lives++;                        // the fee comes back
    state.hudHiddenHearts = NONE;
    state.hudHeartsLabel  = 'CANDIDATE STANDING';
    state.levelSubPhase   = 'win';
    drawWinScreen(gc, WIN_TITLE, WIN_BODY, 43);
    return;
  }

  // the HUD carries the missing heart for as long as the paper is holding it
  state.hudHeartsLabel  = 'CANDIDATE STANDING';
  state.hudHiddenHearts = phase42 === 'intro' ? NONE : HIDDEN;

  if (sayAt42 && elapsed >= sayAt42) { say(gc, sayText42); sayAt42 = 0; sayText42 = ''; }

  // ── the printed FEE box, top right of the paper ────────────────────────────
  const boxW = 96 * s, boxH = 78 * s;
  const boxX = topBoxX + topBoxWidth - 54 * s - boxW;
  const boxY = topBoxY + 26 * s;
  const feeX = boxX + boxW / 2;
  const feeY = boxY + 40.5 * s;

  roundRect(ctx, boxX, boxY, boxW, boxH, 4);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = `${Math.round(9 * s)}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const feeLabelW = ctx.measureText('FEE').width + 2 * 1.6 * s + 12 * s;
  ctx.fillStyle = t.panel;
  ctx.fillRect(feeX - feeLabelW / 2, boxY - 6 * s, feeLabelW, 12 * s);
  ctx.fillStyle = t.fgDim;
  tracked(ctx, 'FEE', feeX, boxY, 1.6 * s);

  // ── the opening line, fading out once the fee has landed ───────────────────
  const openA = settleAt42 ? Math.max(0, 1 - (elapsed - settleAt42) / OPEN_FADE) : 1;
  if (openA > 0) {
    ctx.save();
    ctx.globalAlpha = openA;
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(34 * s)}px ${displayFont}`;
    ctx.fillText('This item costs one heart to open.', cx, topBoxY + topBoxHeight * 0.30 + 20 * s, topBoxWidth * 0.9);
    ctx.restore();
  }

  // ── the question and the four amounts ──────────────────────────────────────
  const qA = settleAt42
    ? Math.max(0, Math.min(1, (elapsed - (settleAt42 + QUESTION_AT)) / FADE))
    : 0;

  const btnW = 150 * s, btnH = 58 * s, gap = 36 * s;
  const totW = CHOICES.length * btnW + (CHOICES.length - 1) * gap;
  const btnX = cx - totW / 2;
  const btnY = topBoxY + topBoxHeight * 0.91 - btnH;

  if (qA > 0) {
    ctx.save();
    ctx.globalAlpha = qA;

    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(34 * s)}px ${displayFont}`;
    ctx.fillText('How many hearts has this item cost you?', cx, topBoxY + topBoxHeight * 0.22 + 20 * s, topBoxWidth * 0.9);

    ctx.fillStyle = t.fgDim;
    ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
    tracked(ctx, 'SELECT THE AMOUNT', cx, topBoxY + topBoxHeight * 0.22 + 56 * s, 1.7 * s);

    CHOICES.forEach((label, i) => {
      drawChoice(gc, label, btnX + i * (btnW + gap), btnY, btnW, btnH, () => {
        if (!inputOpen(gc) || phase42 !== 'question') return;
        if (label === CORRECT) {
          phase42 = 'refunding';
          refundAt42 = clock42.elapsed;
          sayAt42 = 0; sayText42 = '';
          gc.render();
          return;
        }
        fails42++;
        wrong(gc);
        sayText42 = LADDER[Math.min(fails42 - 1, LADDER.length - 1)];
        sayAt42   = clock42.elapsed + LADDER_DELAY;
      }, { fontSize: 25 });
    });

    ctx.restore();
  }

  // ── the heart itself: HUD slot → fee box → HUD slot, drawn above the panel ──
  gc.afterPanel = (g) => {
    const gctx = g.ctx;
    const hr   = g.chrome.hearts && g.chrome.hearts[2];
    const size = hr ? hr.w : 32 * s;
    const home = hr ? { x: hr.x + hr.w / 2, y: hr.y + hr.h / 2 } : null;
    const row  = g.chrome.heartsRow;

    if (phase42 !== 'intro' && row) {
      gctx.save();
      gctx.fillStyle = t.fgDim;
      gctx.font = `${Math.round(9 * s)}px ${monoFont}`;
      gctx.textBaseline = 'top';
      tracked(gctx, 'ONE ON THE PAPER', row.x + row.w / 2, row.y + row.h + 6 * s, 1.3 * s);
      gctx.restore();
    }

    let px = 0, py = 0, show = false;
    if (phase42 === 'flying' && home) {
      const k = Math.max(0, Math.min(1, (clock42.elapsed - flyAt42) / FLY));
      px = home.x + (feeX - home.x) * easeX(k);
      py = home.y + (feeY - home.y) * easeY(k);
      show = true;
    } else if (phase42 === 'settled' || phase42 === 'question') {
      px = feeX; py = feeY; show = true;
    } else if (phase42 === 'refunding' && home) {
      const k = Math.max(0, Math.min(1, (clock42.elapsed - refundAt42) / FLY));
      px = feeX + (home.x - feeX) * easeX(k);
      py = feeY + (home.y - feeY) * easeY(k);
      show = true;
    }
    if (show) {
      gctx.save();
      gctx.shadowColor = 'rgba(60,45,20,0.25)';
      gctx.shadowBlur = 3;
      gctx.shadowOffsetY = 2;
      drawHeart(gctx, px, py, size, t.accent, t.accentDeep, 1.5);
      gctx.restore();
    }
  };

  // test hooks (the level is still played with real clicks)
  (gc as unknown as { lv: Record<string, unknown> }).lv = {
    elapsed,
    phase: phase42,
    fails: fails42,
    feePaid: phase42 !== 'intro' && phase42 !== 'flying',
    feeBox: { x: boxX, y: boxY, w: boxW, h: boxH, cx: feeX, cy: feeY },
    answers: CHOICES.map((label, i) => ({ label, cx: btnX + i * (btnW + gap) + btnW / 2, cy: btnY + btnH / 2 })),
  };
};
