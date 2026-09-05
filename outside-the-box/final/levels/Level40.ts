import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, drawHeart } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock } from './lateralHelpers';

// ── Q40 — Hold to Reboot (Act IV climax) ─────────────────────────────────────
// The exam has crashed into a jittering KERNEL PANIC and the only control left on
// the paper is HOLD TO REBOOT. A tap does nothing except add another
// "tap registered. insufficient." line to the panic log; let go early and the bar
// drains at double speed. Commit for 1.8 seconds and the whole examination
// reboots with it: the logo dims, the hearts go hollow, the paper's cartouche
// reads REBOOTING and the examiner flickers between facings. Every bit of that
// chrome is restored the instant you release or the reboot completes.
// Nothing on this level costs a heart. The trap is impatience, not a wrong answer.

const HOLD_MS    = 1800;   // a full commit
const REBOOT_MS  = 120;    // past this much hold the chrome itself reboots
const TAP_MS     = 250;    // a press shorter than this counts as "a tap"
const FLICKER_MS = 140;    // examiner facing flicker while rebooting
const MAX_TAP_LINES = 5;   // keep the growing log inside the paper

const OPENING = [
  '█▒ The exam has crashed. ▒█',
  "A tap won't fix this. Commit. Hold it down and don't let go.",
];
const TAP_NUDGE = 'A tap will not fix this. Commit. Hold it down and do not let go.';

// Each entry is [dim text, red tail].
const PANIC_LOG: Array<[string, string]> = [
  ['[ 0.000] institute.exam: unhandled candidate', ''],
  ['[ 0.002] FRODRICK.EXE: not found (good)', ''],
  ['[ 0.113] candidate.patience: unverified', ''],
  ['[ 0.114] corporate.approval: pending since 1987', ''],
  ['[ 0.120] answer_key.dat: ', 'corrupt'],
  ['[ 0.121] hearts.sys: 3 of 3 (for now)', ''],
  ['[ 0.400] panic: forced reboot required', ''],
];

const FACES: Array<'up' | 'down' | 'left' | 'right'> = ['down', 'left', 'up', 'right'];

let held40      = 0;      // ms of accumulated hold
let taps40      = 0;
let down40      = false;  // a press that started on the button is still held
let prevDown40  = false;
let downAt40    = 0;
let rebooting40 = false;
let flick40     = 0;
let face40: 'up' | 'down' | 'left' | 'right' = 'down';
let tapLog40: Array<[string, string]> = [];
const clock40 = { last: 0, elapsed: 0 };

// Put the chrome back the way we found it (release, win, or leaving the level).
const restoreChrome40 = (gc: GameContext) => {
  gc.state.paperCaption    = undefined;
  gc.state.hudHiddenHearts = undefined;
  if (rebooting40) gc.guideCharDir = 'down';
  rebooting40 = false;
};

export const drawLevel40 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    restoreChrome40(gc);
    drawWinScreen(gc, 'REBOOTED.', 'A tap does nothing. You had to commit and hold.', 41);
    return;
  }

  if (freshEntry(gc)) {
    held40 = 0; taps40 = 0; down40 = false; downAt40 = 0;
    rebooting40 = false; flick40 = 0; face40 = 'down';
    tapLog40 = [];
    clock40.last = 0; clock40.elapsed = 0;
    prevDown40 = true;   // ignore a press that is already in flight on entry
    state.paperCaption = undefined;
    state.hudHiddenHearts = undefined;
    say(gc, ...OPENING);
  }

  // Pause-aware frame delta, capped at 50 ms exactly like the mock's loop.
  const { dt } = levelClock(gc, clock40);
  const dtMs   = dt * 1000;
  const open   = inputOpen(gc);
  const now    = performance.now();

  // ── the hold button ────────────────────────────────────────────────────────
  const bw = topBoxWidth * 0.34, bh = topBoxHeight * 0.20;
  const bx = cx - bw / 2, by = topBoxY + topBoxHeight * 0.44;
  const over = inRect(gc.mouseX, gc.mouseY, { x: bx, y: by, w: bw, h: bh });

  // Press / release edges. The press must START on the button; after that the
  // hold follows the mouse button, the way the mock captures the pointer.
  if (open && gc.mouseDown && !prevDown40 && over) { down40 = true; downAt40 = now; }
  if (!gc.mouseDown && down40) {
    down40 = false;
    if (open && now - downAt40 < TAP_MS) {
      taps40++;
      tapLog40.push([`[ ${(0.5 + taps40 * 0.1).toFixed(3)}] tap registered. `, 'insufficient.']);
      if (tapLog40.length > MAX_TAP_LINES) tapLog40 = tapLog40.slice(-MAX_TAP_LINES);
      if (taps40 === 2) say(gc, TAP_NUDGE);
    }
  }
  prevDown40 = gc.mouseDown;

  // Accumulate while held, drain at double speed when not. Frozen while paused.
  if (open) {
    if (down40 && gc.mouseDown) held40 += dtMs;
    else held40 = Math.max(0, held40 - dtMs * 2);
  }
  const progress = Math.min(1, held40 / HOLD_MS);

  if (held40 >= HOLD_MS) {
    restoreChrome40(gc);
    down40 = false;
    state.levelSubPhase = 'win';
    drawWinScreen(gc, 'REBOOTED.', 'A tap does nothing. You had to commit and hold.', 41);
    return;
  }

  // ── the chrome reboots along with the exam ────────────────────────────────
  const wasRebooting = rebooting40;
  rebooting40 = held40 > REBOOT_MS;
  if (wasRebooting && !rebooting40) gc.guideCharDir = 'down';
  state.paperCaption    = rebooting40 ? '·  REBOOTING  ·' : undefined;
  state.hudHiddenHearts = rebooting40 ? [0, 1, 2] : undefined;
  if (rebooting40 && down40 && gc.mouseDown && open) {
    flick40 += dtMs;
    if (flick40 > FLICKER_MS) { flick40 = 0; face40 = FACES[Math.floor(Math.random() * FACES.length)]; }
    gc.guideCharDir = face40;
  }

  // ── panic banner ──────────────────────────────────────────────────────────
  const jit = (Math.floor(now / 60) % 2 === 0 ? 2 : -2) * s;
  ctx.save();
  ctx.translate(jit, 0);
  ctx.fillStyle    = t.danger;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${Math.round(30 * s)}px ${displayFont}`;
  ctx.fillText('▓▒ KERNEL PANIC ▒▓', cx, topBoxY + topBoxHeight * 0.08, topBoxWidth * 0.95);
  ctx.restore();

  ctx.fillStyle    = t.fgMid;
  ctx.font         = `${Math.round(16 * s)}px ${bodyFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('The exam has crashed. Force a reboot, and do not let go.', cx, topBoxY + topBoxHeight * 0.22, topBoxWidth * 0.92);

  // ── panic log ─────────────────────────────────────────────────────────────
  const logX  = topBoxX + topBoxWidth * 0.06;
  const logY  = topBoxY + topBoxHeight * 0.31;
  const lineH = 15.5 * s;
  ctx.font      = `${Math.round(10 * s)}px ${monoFont}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines = PANIC_LOG.concat(tapLog40);
  for (let i = 0; i < lines.length; i++) {
    const [dim, hot] = lines[i];
    const ly = logY + i * lineH;
    ctx.fillStyle = t.fgDim;
    ctx.fillText(dim, logX, ly, topBoxWidth * 0.30);
    if (hot) {
      ctx.fillStyle = t.danger;
      ctx.fillText(hot, logX + ctx.measureText(dim).width, ly);
    }
  }

  // ── HOLD TO REBOOT ────────────────────────────────────────────────────────
  const pressed = down40 && gc.mouseDown;
  ctx.fillStyle = pressed ? '#6E1E1A' : t.danger;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = t.pass;
  ctx.fillRect(bx, by + bh - 8 * s, bw * progress, 8 * s);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(20 * s)}px ${displayFont}`;
  ctx.fillText('HOLD TO REBOOT', bx + bw / 2, by + bh / 2, bw - 24 * s);

  // The hit area exists only so the button feels clickable: a click does nothing,
  // because a tap is exactly what will not fix this.
  gc.hitAreas.push({ x: bx, y: by, w: bw, h: bh, action: () => {} });

  ctx.fillStyle    = t.fgDim;
  ctx.font         = `${Math.round(13 * s)}px ${bodyFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${Math.round(progress * 100)}%`, cx, topBoxY + topBoxHeight * 0.70);

  // ── chrome overlay: dim the logo, hollow out the hearts ───────────────────
  gc.afterPanel = (g) => {
    if (!rebooting40) return;
    const th = getTheme(g.state);
    const lg = g.chrome.logo;
    if (lg) {
      g.ctx.save();
      g.ctx.globalAlpha = 0.62;
      g.ctx.fillStyle = th.bg;
      g.ctx.fillRect(lg.x - 2, lg.y - 2, lg.w + 4, lg.h + 4);
      g.ctx.restore();
    }
    const hearts = g.chrome.hearts ?? [];
    for (let i = 0; i < hearts.length && i < 3; i++) {
      const hr = hearts[i];
      drawHeart(g.ctx, hr.x + hr.w / 2, hr.y + hr.h / 2, hr.w, null, th.hairline, 2);
    }
  };

  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    held: Math.round(held40), progress, taps: taps40,
    down: down40 && gc.mouseDown, rebooting: rebooting40,
  };
};
