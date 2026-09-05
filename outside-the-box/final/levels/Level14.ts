import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { roundRect, uiScale, triggerStamp } from '../renderer';
import { wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q14 — Leave The Room ─────────────────────────────────────────────────────
// "Candidates may not be observed while answering. Proceed when unobserved."
// A proctor's eye inked on the paper follows the cursor and blinks now and then,
// under a pulsing PROCTOR STATUS: WATCHING readout. The ANSWER button always
// fails: the rebuke ladder escalates and its third rung leaks the hint
// ("...In this window, anyway."). The solve is to actually leave: blur the
// window / hide the tab for about four seconds, and the paper is stamped in your
// absence. The trap arms only after the candidate has interacted, so tabbing
// back in from somewhere else cannot win the level before it has been played.
// Replaces the mirrored-text question.

const AWAY_MS = 3800;      // how long the room must be empty
const IDLE_NUDGE_S = 45;   // seconds before the examiner nudges toward the hint
const BLINK_PERIOD = 5.2;  // seconds between blinks
const PULSE_PERIOD = 1.4;  // seconds for the status dot pulse

const OPENING = 'Candidates may not be observed while answering. I will be watching. Every moment.';
const LADDER = [
  'I was watching. That does not count.',
  'As long as I can see you, no answer counts.',
  'You cannot escape observation in this room. ...In this window, anyway.',
];
const NUDGE = 'Still here? You cannot escape observation in this room. ...In this window, anyway.';
const BACK_TOO_SOON = 'Back already? I never looked away.';
const MELTDOWN = '...Where did you go. What happened. Who stamped this.';

// ── Module state (reset on fresh entry) ──────────────────────────────────────
let armed14 = false;       // the trap arms only after the first interaction
let awayAt14 = 0;          // performance.now() when the window lost focus, 0 = present
let wrongs14 = 0;
let solvedAt14 = 0;        // performance.now() of the solve, 0 = unsolved
let nudged14 = false;
let pupilX14 = 0;
let pupilY14 = 0;
const clock14 = { last: 0, elapsed: 0 };

// Window listeners are registered once (module flag) and guard on the level.
let listeners14 = false;
let gc14: GameContext | null = null;

const live14 = (g: GameContext | null): boolean =>
  !!g && g.state.currentScreen === 'level' && g.state.currentLevel === 14;

const playable14 = (g: GameContext | null): boolean =>
  live14(g) && !!g && g.state.levelSubPhase === 'active' &&
  !g.state.paused && !g.state.controlsOpen && !g.state.gameOver && !g.state.cheatsPopupOpen;

const arm14 = () => {
  if (!playable14(gc14)) return;
  armed14 = true;
};

// The room empties: start counting, but only if the candidate has actually played.
const onLeave14 = () => {
  const g = gc14;
  if (!playable14(g) || !g) return;
  if (!armed14 || solvedAt14) return;
  if (!awayAt14) awayAt14 = performance.now();
};

// The candidate comes back. Four seconds of empty room and the paper is stamped.
const onReturn14 = () => {
  const g = gc14;
  if (!live14(g) || !g) return;
  if (!awayAt14 || solvedAt14) return;
  if (g.state.levelSubPhase !== 'active') { awayAt14 = 0; return; }
  const away = performance.now() - awayAt14;
  awayAt14 = 0;
  if (away >= AWAY_MS) {
    solvedAt14 = performance.now();
    triggerStamp(g, 'ANSWERED', getTheme(g.state).pass);
    g.sounds.ui('seal');
    say(g, MELTDOWN);
  } else {
    say(g, BACK_TOO_SOON);
  }
  g.render();
};

const ensureListeners14 = () => {
  if (listeners14) return;
  listeners14 = true;
  window.addEventListener('mousemove', arm14);
  window.addEventListener('mousedown', arm14);
  window.addEventListener('keydown', arm14);
  window.addEventListener('blur', onLeave14);
  window.addEventListener('focus', onReturn14);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onLeave14(); else onReturn14();
  });
};

// Mono caption with the mock's letter tracking, centred on cx.
const trackedWidth = (ctx: CanvasRenderingContext2D, text: string, tracking: number) => {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + tracking;
  return total - tracking;
};

const fillTracked = (
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number,
) => {
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  let cur = x;
  for (const ch of text) { ctx.fillText(ch, cur, y); cur += ctx.measureText(ch).width + tracking; }
  ctx.textAlign = prev;
};

// The proctor's eye: an almond inked on the paper, viewBox 160x100 like the mock.
const drawProctorEye = (
  gc: GameContext, x0: number, y0: number, boxW: number, blink: number, px: number, py: number,
) => {
  const { ctx, state } = gc;
  const t = getTheme(state);
  const k = boxW / 160;

  const almond = () => {
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.quadraticCurveTo(80, -8, 150, 50);
    ctx.quadraticCurveTo(80, 108, 10, 50);
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(k, k);

  almond();
  ctx.fillStyle = t.bg;
  ctx.fill();

  ctx.save();
  almond();
  ctx.clip();

  ctx.save();
  ctx.translate(px, py);
  ctx.beginPath(); ctx.arc(80, 50, 24, 0, Math.PI * 2);
  ctx.fillStyle = t.accent; ctx.fill();
  ctx.strokeStyle = t.accentDeep; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(80, 50, 11, 0, Math.PI * 2);
  ctx.fillStyle = t.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(74, 44, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = t.panel; ctx.fill();
  ctx.restore();

  // the lid drops from y=8 (the mock scales the lid rect about its top edge)
  if (blink > 0.002) {
    ctx.fillStyle = t.panel;
    ctx.fillRect(0, 8, 160, 84 * blink);
  }
  ctx.restore();

  almond();
  ctx.strokeStyle = t.stroke; ctx.lineWidth = 3; ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(30, 24);
  ctx.quadraticCurveTo(80, -18, 130, 24);
  ctx.strokeStyle = t.stroke; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();

  ctx.restore();
};

export const drawLevel14 = (gc: GameContext) => {
  gc14 = gc;
  ensureListeners14();

  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  // the stamp lands in your absence, then the paper is graded
  if (solvedAt14 && state.levelSubPhase === 'active' && performance.now() - solvedAt14 >= 1000) {
    state.levelSubPhase = 'win';
  }

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'UNOBSERVED.', 'The proctor cannot watch an empty room. Your paper was stamped in your absence.', 15);
    return;
  }

  if (freshEntry(gc)) {
    armed14 = false;
    awayAt14 = 0;
    wrongs14 = 0;
    solvedAt14 = 0;
    nudged14 = false;
    pupilX14 = 0;
    pupilY14 = 0;
    clock14.last = 0;
    clock14.elapsed = 0;
    say(gc, OPENING);
  }

  const { elapsed } = levelClock(gc, clock14);
  const open = inputOpen(gc);

  // idle nudge toward the hint
  if (!nudged14 && !solvedAt14 && wrongs14 < 3 && elapsed >= IDLE_NUDGE_S) {
    nudged14 = true;
    say(gc, NUDGE);
  }

  // ── prompt ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.ink;
  ctx.font = `bold ${Math.round(26 * s)}px ${displayFont}`;
  ctx.fillText('Candidates may not be observed while answering.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(15 * s)}px ${bodyFont}`;
  ctx.fillText('Proceed when unobserved.', cx, topBoxY + topBoxHeight * 0.213, topBoxWidth * 0.8);

  // ── the proctor's eye ─────────────────────────────────────────────────────
  const eyeW = 190 * s, eyeH = 120 * s;
  const eyeX = cx - eyeW / 2;
  const eyeY = topBoxY + topBoxHeight * 0.27;

  if (open) {
    const dx = gc.mouseX - (eyeX + eyeW / 2);
    const dy = gc.mouseY - (eyeY + eyeH / 2);
    const len = Math.hypot(dx, dy) || 1;
    const kk = Math.min(1, 15 / len);
    pupilX14 = dx * kk;
    pupilY14 = dy * kk * 0.7;
  }

  const bp = (elapsed % BLINK_PERIOD) / BLINK_PERIOD;
  let blink = 0;
  if (bp >= 0.90 && bp < 0.93)      blink = (bp - 0.90) / 0.03;
  else if (bp >= 0.93 && bp < 0.96) blink = 1;
  else if (bp >= 0.96)              blink = 1 - (bp - 0.96) / 0.04;

  drawProctorEye(gc, eyeX, eyeY, eyeW, blink, pupilX14, pupilY14);

  // ── PROCTOR STATUS readout ────────────────────────────────────────────────
  const statusText = solvedAt14 ? 'PROCTOR STATUS: CONFUSED' : 'PROCTOR STATUS: WATCHING';
  const statusY = topBoxY + topBoxHeight * 0.647;
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  const tracking = Math.round(11 * s) * 0.14;
  const textW = trackedWidth(ctx, statusText, tracking);
  const dotR = 3.5 * s;
  const gap = 7 * s;
  const rowW = dotR * 2 + gap + textW;
  const rowX = cx - rowW / 2;

  const ph = (elapsed % PULSE_PERIOD) / PULSE_PERIOD;
  const pulse = ph < 0.5 ? 1 - 1.5 * ph : 0.25 + 1.5 * (ph - 0.5);

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = t.danger;
  ctx.beginPath();
  ctx.arc(rowX + dotR, statusY, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = t.danger;
  fillTracked(ctx, statusText, rowX + dotR * 2 + gap, statusY, tracking);

  // ── ANSWER (always a trap) ────────────────────────────────────────────────
  const bw = 190 * s, bh = 56 * s;
  const bx = cx - bw / 2;
  const by = topBoxY + topBoxHeight * 0.91 - bh;
  const hover = open && gc.mouseX >= bx && gc.mouseX <= bx + bw && gc.mouseY >= by && gc.mouseY <= by + bh;

  ctx.save();
  ctx.shadowColor = state.darkMode ? 'rgba(0,0,0,0.40)' : 'rgba(60,45,20,0.20)';
  ctx.shadowBlur = hover ? 12 : 9;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.fillStyle = hover ? t.accent : t.bg;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hover ? t.accentDeep : t.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.stroke();

  ctx.fillStyle = hover ? '#F7F1E3' : t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(23 * s)}px ${displayFont}`;
  ctx.fillText('ANSWER', cx, by + bh / 2, bw - 20 * s);

  gc.hitAreas.push({
    x: bx, y: by, w: bw, h: bh,
    action: () => {
      if (!inputOpen(gc) || solvedAt14) return;
      wrong(gc);
      say(gc, LADDER[Math.min(wrongs14, LADDER.length - 1)]);
      wrongs14++;
      gc.render();
    },
  });

  // ── test hook ─────────────────────────────────────────────────────────────
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    armed: armed14,
    awayAt: awayAt14,
    wrongs: wrongs14,
    solvedAt: solvedAt14,
    elapsed,
    awayMs: AWAY_MS,
    nudged: nudged14,
  };
};
