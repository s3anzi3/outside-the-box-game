import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout, setPaperExtend } from '../layout';
import { roundRect, uiScale } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock, wrong } from './lateralHelpers';

// ── Q37 — Trim Marks ──────────────────────────────────────────────────────────
// "The answer to this item is 14. Submit it." The row offers 9, 12, 16 and 20,
// and a fifth button sliced off by the paper's right edge. Every printed button
// costs a heart. The oxblood corner ticks that have framed every question since
// Q1 are crop marks, and crop marks set the trim: grab either right-hand tick,
// drag it outward, and the page physically widens into the desk margin until the
// button Corporate trimmed off in printing is on the paper. It says 14.
// Replaces count-the-squares.

const LABELS = ['9', '12', '16', '20', '14'];
// Mock frame units, measured from the paper's left edge (the printed page is 1049.6 wide).
const XS = [256, 442, 628, 814, 1000];
const BTN_W = 150, BTN_H = 58;
const PRINTED_W = 1049.6;

const LADDER = [
  'Corporate trimmed the page. The fifth button did not survive.',
  'The little marks in the corners are crop marks. They set the trim.',
  'Drag a right-hand corner tick outward. The page grows. The 14 is there.',
];
const OPENING = ['The answer is 14. Submit it.', 'Something on this row looks cut off.'];
const GROW = '...The page is growing. I was told that was not possible.';
const SLIVER = 'That is not a whole button. The rest of it did not fit on the page.';

let ext37 = 0;
let fails37 = 0;
let saidGrow37 = false;
let drag37: { x0: number; ext0: number } | null = null;
const clock37 = { last: 0, elapsed: 0 };

// Canvas letter-spacing for the mono lines, restored afterwards.
const withTracking = (ctx: CanvasRenderingContext2D, px: number, fn: () => void) => {
  const c = ctx as unknown as { letterSpacing?: string };
  const prev = c.letterSpacing;
  try { c.letterSpacing = `${px}px`; } catch { /* unsupported */ }
  try { fn(); } finally { try { c.letterSpacing = prev ?? '0px'; } catch { /* ignore */ } }
};

// The house answer button (embossed paper, oxblood on hover). Drawn by hand so the
// trimmed one can be clipped and left without a hit area until it is on the page.
const drawAnswerButton = (
  gc: GameContext, label: string, x: number, y: number, w: number, h: number, hover: boolean,
) => {
  const { ctx, state, displayFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  ctx.save();
  ctx.shadowColor = state.darkMode ? 'rgba(0,0,0,0.45)' : 'rgba(60,45,20,0.22)';
  ctx.shadowBlur = hover ? 14 : 9;
  ctx.shadowOffsetY = hover ? 4 : 3;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = hover ? t.accent : t.bg;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hover ? t.accentDeep : t.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  ctx.fillStyle = hover ? '#F7F1E3' : t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(25 * s)}px ${displayFont}`;
  ctx.fillText(label, x + w / 2, y + h / 2, w - 10);
};

// One corner tick (the crop mark), drawn scaled about its own corner for the pulse.
const drawTick = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, sx: number, sy: number,
  len: number, color: string, lw: number, scale: number,
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(sx * len, 0);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, sy * len);
  ctx.stroke();
  ctx.restore();
};

export const drawLevel37 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight, contentWidth, paperX, paperY, paperW, paperH } = getLayout(ctx);
  const t = getTheme(state);
  const s = uiScale(ctx);

  if (state.levelSubPhase === 'win') {
    // The page stays untrimmed behind the result.
    drawWinScreen(gc, 'UNTRIMMED.', 'The fifth button was printed. It was just outside the trim. Corporate saves on paper.', 38);
    return;
  }
  if (freshEntry(gc)) {
    ext37 = 0; fails37 = 0; saidGrow37 = false; drag37 = null;
    clock37.last = 0; clock37.elapsed = 0;
    setPaperExtend(0);
    say(gc, OPENING[0], OPENING[1]);
  }

  // u locks every mock measurement to the paper's PRINTED width, so the row keeps
  // its proportions on any canvas while the trim itself moves.
  const u = contentWidth / PRINTED_W;
  const maxExt = 110 * u;
  const { elapsed } = levelClock(gc, clock37);

  // The crop marks pulse once, two beats of 1.2s, after twenty idle seconds.
  // Driven from the pause-aware clock, so a paused exam freezes them too.
  const pulseT = elapsed - 20;

  // ── paper content (recentres as the page grows, exactly like the mock) ──────
  const cx = topBoxX + topBoxWidth / 2;

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  withTracking(ctx, 1.8 * s, () => ctx.fillText('SUBMIT THE ANSWER', cx, topBoxY + topBoxHeight * 0.09));

  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(36 * s)}px ${displayFont}`;
  ctx.fillText('The answer to this item is 14. Submit it.', cx, topBoxY + topBoxHeight * 0.19, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  withTracking(ctx, 1.3 * s, () =>
    ctx.fillText('CORPORATE PRINTED THE WRONG BUTTONS. CORPORATE HAS BEEN INFORMED.', cx, topBoxY + topBoxHeight * 0.82, topBoxWidth * 0.94));

  // ── the answer row ─────────────────────────────────────────────────────────
  const btnW = BTN_W * u, btnH = BTN_H * u;
  const rowY = topBoxY + topBoxHeight * 0.52;
  const playR = topBoxX + topBoxWidth;
  const hovering = (x: number, w: number) =>
    gc.mouseX >= x && gc.mouseX <= x + w && gc.mouseY >= rowY && gc.mouseY <= rowY + btnH;

  const missPrinted = () => {
    if (!inputOpen(gc)) return;
    fails37++;
    wrong(gc);
    const line = LADDER[Math.min(fails37 - 1, LADDER.length - 1)];
    setTimeout(() => {
      if (gc.state.currentLevel === 37 && gc.state.levelSubPhase === 'active' && !gc.state.gameOver) {
        say(gc, line);
        gc.render();
      }
    }, 700);
  };

  for (let i = 0; i < 4; i++) {
    const bx = topBoxX + XS[i] * u;
    drawAnswerButton(gc, LABELS[i], bx, rowY, btnW, btnH, hovering(bx, btnW));
    gc.hitAreas.push({ x: bx, y: rowY, w: btnW, h: btnH, action: missPrinted });
  }

  // The fifth button was printed past the trim: draw it clipped to the page.
  const bx5 = topBoxX + XS[4] * u;
  const visW = Math.max(0, Math.min(bx5 + btnW, playR) - bx5);
  const revealed = visW >= btnW * 0.6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(topBoxX, topBoxY, topBoxWidth, topBoxHeight);
  ctx.clip();
  drawAnswerButton(gc, LABELS[4], bx5, rowY, btnW, btnH, revealed && hovering(bx5, visW));
  ctx.restore();
  if (visW > 2) {
    gc.hitAreas.push({
      x: bx5, y: rowY, w: visW, h: btnH, noCursor: !revealed,
      action: () => {
        if (!inputOpen(gc)) return;
        if (revealed) { state.levelSubPhase = 'win'; gc.render(); return; }
        // The trimmed sliver is not a printed button, so it costs nothing and submits
        // nothing. Before the hint ladder starts it is worth one nudge.
        if (fails37 === 0) { say(gc, SLIVER); gc.render(); }
      },
    });
  }

  // ── the crop marks are handles: grab a right-hand tick and pull the trim out ──
  const cornerX = paperX + paperW;
  const grab = 10 * s, reach = 26 * s, tall = 34 * s;
  const hTR = { x: cornerX - grab, y: paperY - 8 * s, w: grab + reach, h: tall };
  const hBR = { x: cornerX - grab, y: paperY + paperH - tall + 8 * s, w: grab + reach, h: tall };

  const setExt = (v: number) => {
    ext37 = Math.max(0, Math.min(maxExt, v));
    if (ext37 > 60 * u && !saidGrow37) { saidGrow37 = true; say(gc, GROW); }
  };

  if (inputOpen(gc)) {
    if (!drag37 && gc.mouseDown &&
        (inRect(gc.mouseX, gc.mouseY, hTR) || inRect(gc.mouseX, gc.mouseY, hBR))) {
      drag37 = { x0: gc.mouseX, ext0: ext37 };
      gc.sounds.ui('tick');
    }
    if (drag37 && gc.mouseDown) setExt(drag37.ext0 + (gc.mouseX - drag37.x0));
    if (drag37 && !gc.mouseDown) drag37 = null;
  } else if (drag37) {
    drag37 = null;
  }

  // The two right-hand ticks, redrawn above the header band while they pulse.
  gc.afterPanel = (g) => {
    if (pulseT < 0 || pulseT > 2.4) return;
    const k = (pulseT % 1.2) / 1.2;
    const e = Math.sin(k * Math.PI);
    const scale = 1 + 0.6 * e;
    const col = e > 0.35 ? t.seal : t.accent;
    drawTick(g.ctx, cornerX, paperY, -1, 1, 13, col, 2 * s, scale);
    drawTick(g.ctx, cornerX, paperY + paperH, -1, -1, 13, col, 2 * s, scale);
  };

  // The page is only as wide as the trim allows; the frame picks this up next draw.
  setPaperExtend(ext37);

  (gc as unknown as { lv?: Record<string, unknown> }).lv = {
    ext: ext37, maxExt, revealed, visW, fails: fails37,
    elapsed: clock37.elapsed, dragging: !!drag37, pulsing: pulseT >= 0 && pulseT <= 2.4,
  };
};
