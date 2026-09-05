import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { roundRect, uiScale } from '../renderer';
import { freshEntry, wrong, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q38 — The Other Button ────────────────────────────────────────────────────
// "Press the button." There is exactly one button on the paper. Pressing it (the
// conventional left click) is INCORRECT: "Not that one. The other one." Only that
// first click costs a heart; every left click after it is free and the examiner
// escalates until it names the mouse. The other button is the one under your
// finger: RIGHT-click THE BUTTON, its right half depresses, and the item passes.
// Replaces the arrow-rotation "what comes next" pattern.

const LEFT_LINES = [
  'Not that one. The other one.',
  'Still that one.',
  'Your mouse has two buttons.',
  'The other one. On the mouse. Two-finger tap on a trackpad, or hold Ctrl and click.',
];

const OPENING = 'Press the button.';

const BTN_W = 320;   // mock: .bigbtn width
const BTN_H = 96;    // mock: .bigbtn height
const PRESS_RAMP    = 0.12;   // seconds for the right half to sink
const PRESS_SECONDS = 0.35;   // mock: setTimeout(..., 350) before the win screen

let lefts38   = 0;
let pressedAt38 = -1;         // level-clock seconds when the other button went down
let solved38  = false;
const clock38 = { last: 0, elapsed: 0 };

// The one button on the paper. Left half is very slightly darker than the right:
// the thing already looks like a mouse if you let it. When the right half is
// pressed the whole plate tips away to the right with an inset shadow.
const drawTheButton = (
  gc: GameContext,
  x: number, y: number, w: number, h: number,
  dep: number, hover: boolean,
) => {
  const { ctx, state, bodyFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const lit = hover && dep === 0;
  const dy = lit && gc.mouseDown ? 1 : 0;

  ctx.save();
  if (dep > 0) {
    // perspective rotateY(-9deg): the right edge falls back toward the paper
    ctx.translate(x, y + h / 2);
    ctx.scale(1 - 0.030 * dep, 1 - 0.055 * dep);
    ctx.translate(-x, -(y + h / 2));
  }

  // plate
  ctx.save();
  ctx.shadowColor   = state.darkMode ? 'rgba(0,0,0,0.45)' : 'rgba(60,45,20,0.22)';
  ctx.shadowBlur    = dep > 0 ? 3 : lit ? 14 : 9;
  ctx.shadowOffsetY = dep > 0 ? 1 : lit ? 4 : 3;
  roundRect(ctx, x, y + dy, w, h, 6);
  ctx.fillStyle = lit ? t.accent : t.bg;
  ctx.fill();
  ctx.restore();

  // the two halves
  ctx.save();
  roundRect(ctx, x, y + dy, w, h, 6);
  ctx.clip();
  if (dep === 0) {
    ctx.fillStyle = lit
      ? 'rgba(0,0,0,0.10)'
      : (state.darkMode ? 'rgba(244,238,222,0.07)' : 'rgba(30,26,21,0.06)');
    ctx.fillRect(x, y + dy, w / 2, h);
  } else {
    const band = 36 * s;
    const grd = ctx.createLinearGradient(x + w, 0, x + w - band, 0);
    grd.addColorStop(0, 'rgba(0,0,0,' + (0.28 * dep).toFixed(3) + ')');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(x + w - band, y + dy, band, h);
  }
  ctx.restore();

  ctx.strokeStyle = lit ? t.accentDeep : t.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y + dy, w, h, 6);
  ctx.stroke();

  ctx.fillStyle    = lit ? '#F7F1E3' : t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(30 * s)}px ${bodyFont}`;
  ctx.fillText('THE BUTTON', x + w / 2, y + dy + h / 2, w - 28 * s);
  ctx.restore();
};

export const drawLevel38 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(
      gc,
      'THE OTHER ONE.',
      'Not that button. The other button. It has been under your finger the whole time.',
      39,
    );
    return;
  }
  if (freshEntry(gc)) {
    lefts38 = 0;
    pressedAt38 = -1;
    solved38 = false;
    clock38.last = 0;
    clock38.elapsed = 0;
    say(gc, OPENING);
  }

  const { elapsed } = levelClock(gc, clock38);

  // test hook: internals only, the level is still played with real input
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = { lefts: lefts38, t: elapsed, pressed: pressedAt38 >= 0, solved: solved38 };

  // the other button has been held down long enough: the item passes
  if (pressedAt38 >= 0 && elapsed - pressedAt38 >= PRESS_SECONDS) {
    state.levelSubPhase = 'win';
    drawWinScreen(
      gc,
      'THE OTHER ONE.',
      'Not that button. The other button. It has been under your finger the whole time.',
      39,
    );
    return;
  }
  const dep = pressedAt38 < 0 ? 0 : Math.min(1, (elapsed - pressedAt38) / PRESS_RAMP);

  // ── paper content ──────────────────────────────────────────────────────────
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = t.fgDim;
  ctx.font      = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('I T E M   3 8', cx, topBoxY + topBoxHeight * 0.14);

  ctx.fillStyle = t.ink;
  ctx.font      = `${Math.round(40 * s)}px ${displayFont}`;
  ctx.fillText(OPENING, cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.9);

  const bw = BTN_W * s, bh = BTN_H * s;
  const bx = cx - bw / 2, by = topBoxY + topBoxHeight * 0.52;
  const hover = gc.mouseX >= bx && gc.mouseX <= bx + bw && gc.mouseY >= by && gc.mouseY <= by + bh;
  drawTheButton(gc, bx, by, bw, bh, dep, hover);

  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.fillText('O N E   B U T T O N   I S   P R O V I D E D .', cx, topBoxY + topBoxHeight * 0.86);

  // ── the only hit area on the paper, listening on both mouse buttons ────────
  gc.hitAreas.push({
    x: bx, y: by, w: bw, h: bh,
    action: () => {
      if (solved38 || !inputOpen(gc)) return;
      lefts38++;
      if (lefts38 === 1) {
        wrong(gc);                 // INCORRECT stamp + deny + one heart, once only
        say(gc, LEFT_LINES[0]);
      } else {
        say(gc, LEFT_LINES[Math.min(lefts38 - 1, LEFT_LINES.length - 1)]);
      }
    },
    onRightClick: () => {
      if (solved38 || !inputOpen(gc)) return;
      solved38 = true;
      pressedAt38 = clock38.elapsed;
      gc.sounds.ui('click');
    },
  });
};
