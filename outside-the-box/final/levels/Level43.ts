import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, roundRect, uiScale } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, wrong, levelClock } from './lateralHelpers';

// ── Q43 — Ghost Continue ──────────────────────────────────────────────────────
// The paper says "Await instructions." and nothing ever arrives. The examiner is
// silent for eight seconds, then drips a ladder of hints. What has not left is the
// PREVIOUS question's CONTINUE button: it is still faintly burned into the paper at
// exactly the spot every win screen puts it (cx-110, topBoxY + H*0.64, 220 wide),
// at thirty percent opacity, and it still works. REFRESH costs a heart and only
// makes the ghost fainter. Replaces spot-the-difference.

// Timed remark ladder (seconds, line). The examiner opens silent.
const LINES: [number, string][] = [
  [8,  '...'],
  [16, 'Nothing new has arrived.'],
  [26, 'Something old has not left.'],
  [40, "The last screen's CONTINUE button is still there. Faintly. It still works."],
];

// Ghost opacity by number of refreshes: it only ever gets fainter.
const OPS = [0.30, 0.22, 0.15, 0.10];

let refreshes43 = 0;
let stage43 = 0;
let shownAlpha43 = OPS[0];
const clock43 = { last: 0, elapsed: 0 };

// letter-spacing helper (renderer keeps its own copy private)
const withTracking = (ctx: CanvasRenderingContext2D, px: number, fn: () => void) => {
  const c = ctx as unknown as { letterSpacing?: string };
  const prev = c.letterSpacing;
  try { c.letterSpacing = `${px}px`; } catch { /* unsupported */ }
  try { fn(); } finally { try { c.letterSpacing = prev ?? '0px'; } catch { /* ignore */ } }
};

// The residue of the last win screen's CONTINUE: drawButton's shape, no shadow,
// no hover lift, drawn under a low globalAlpha.
const drawGhostButton = (
  gc: GameContext, label: string,
  x: number, y: number, w: number, h: number, alpha: number,
) => {
  const { ctx, state, bodyFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 5);
  ctx.stroke();
  const fontPx = Math.min(Math.round(18 * s), h * 0.52);
  ctx.fillStyle = t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontPx}px ${bodyFont}`;
  withTracking(ctx, 0.5, () => ctx.fillText(label, x + w / 2, y + h / 2, w - 18));
  ctx.restore();
};

export const drawLevel43 = (gc: GameContext) => {
  const { ctx, state, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CONTINUED.', 'Corporate never cleared the last screen. You used it. That was the instruction.', 44);
    return;
  }
  if (freshEntry(gc)) {
    refreshes43 = 0;
    stage43 = 0;
    shownAlpha43 = OPS[0];
    clock43.last = 0;
    clock43.elapsed = 0;
    say(gc, '');           // the examiner has nothing to say yet
  }

  const { dt, elapsed } = levelClock(gc, clock43);

  // the ladder arrives on its own schedule; refreshing does not reset it
  while (stage43 < LINES.length && elapsed >= LINES[stage43][0]) {
    say(gc, LINES[stage43][1]);
    stage43++;
  }

  // ── the paper: one instruction that never comes ────────────────────────────
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  withTracking(ctx, 2.4 * s, () =>
    ctx.fillText('AWAIT  INSTRUCTIONS.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9));

  // ── the ghost of the last CONTINUE, at the exact win-screen coordinates ────
  const gx = cx - 110;
  const gy = topBoxY + topBoxHeight * 0.64;
  const gw = 220;
  const gh = Math.max(44, topBoxHeight * 0.13);

  const hoverGhost = gc.mouseX >= gx && gc.mouseX <= gx + gw && gc.mouseY >= gy && gc.mouseY <= gy + gh;
  const base   = OPS[Math.min(refreshes43, OPS.length - 1)];
  const target = base + (hoverGhost && inputOpen(gc) ? 0.06 : 0);
  // ease toward the target the way the mock's .4s opacity transition does
  shownAlpha43 += (target - shownAlpha43) * Math.min(1, dt / 0.4);
  if (Math.abs(target - shownAlpha43) < 0.002) shownAlpha43 = target;

  drawGhostButton(gc, 'CONTINUE  →', gx, gy, gw, gh, shownAlpha43);
  gc.hitAreas.push({
    x: gx, y: gy, w: gw, h: gh,
    action: () => {
      if (!inputOpen(gc)) return;
      state.levelSubPhase = 'win';
      gc.render();
    },
  });

  // ── REFRESH: costs a heart, and only ever makes the ghost fainter ──────────
  const rW = Math.round(118 * s);
  const rH = Math.round(38 * s);
  const rX = topBoxX + topBoxWidth - Math.round(26 * s) - rW;
  const rY = topBoxY + topBoxHeight - Math.round(22 * s) - rH;
  drawButton(gc, '⟳ REFRESH', rX, rY, rW, rH, () => {
    if (!inputOpen(gc)) return;
    refreshes43++;
    wrong(gc);
    say(gc, refreshes43 === 1
      ? 'That refreshed nothing. The ghost is fainter now.'
      : 'Every refresh makes it fainter. Stop.');
  }, 12);

  (gc as unknown as { lv?: Record<string, unknown> }).lv = {
    elapsed,
    stage: stage43,
    refreshes: refreshes43,
    alpha: shownAlpha43,
    ghost: { x: gx, y: gy, w: gw, h: gh },
    refreshBtn: { x: rX, y: rY, w: rW, h: rH },
  };
};
