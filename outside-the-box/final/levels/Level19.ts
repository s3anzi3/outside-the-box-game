import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, roundRect, uiScale } from '../renderer';
import { wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q19 — The Pattern ─────────────────────────────────────────────────────────
// "O T T F F S S ?" with a blank to write in, not a rack of answer buttons.
// The sequence is the first letters of One, Two, Three, Four, Five, Six, Seven,
// so the next one is Eight, written E. Only a capital E is accepted: a lowercase
// e, an 8, the word "eight" and everything else each cost a heart and get their
// own line from the examiner. Enter and SUBMIT both hand the paper in.

const MAX_LEN = 8;
const ANSWER = 'E';

const LINES = {
  case:  'Case matters. This is an examination.',
  digit: 'Say them out loud. Then write the first letter. Capital.',
  letter: 'That is a letter. Not the right one. Count.',
  other: 'Say them out loud, candidate.',
};

let typed19 = '';
let focused19 = true;
let fails19 = 0;
let submits19 = 0;
let listeners19 = false;
const clock19 = { last: 0, elapsed: 0 };

// Local copy of the renderer's tracking helper (it is not exported): the mock's
// mono captions are letter-spaced, and canvas needs letterSpacing set by hand.
const withTracking = (ctx: CanvasRenderingContext2D, px: number, fn: () => void) => {
  const c = ctx as unknown as { letterSpacing?: string };
  const prev = c.letterSpacing;
  try { c.letterSpacing = `${px}px`; } catch { /* unsupported — ignore */ }
  try { fn(); } finally { try { c.letterSpacing = prev ?? '0px'; } catch { /* ignore */ } }
};

const submit19 = (gc: GameContext) => {
  if (!inputOpen(gc)) return;
  const v = typed19.trim();
  if (!v) return;                       // an empty blank is not an answer, and costs nothing
  submits19++;

  if (v === ANSWER) {
    typed19 = v;
    gc.state.levelSubPhase = 'win';
    gc.render();
    return;
  }

  typed19 = '';
  focused19 = true;
  fails19++;
  wrong(gc);
  const low = v.toLowerCase();
  if (v === 'e')                          say(gc, LINES.case);
  else if (v === '8' || low === 'eight')  say(gc, LINES.digit);
  else if (low === 'n' || low === 't')    say(gc, LINES.letter);
  else                                    say(gc, LINES.other);
  gc.render();
};

const ensureListeners19 = (gc: GameContext) => {
  if (listeners19) return;
  listeners19 = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (gc.state.currentLevel !== 19 || gc.state.currentScreen !== 'level') return;
    if (!inputOpen(gc) || !focused19) return;

    if (e.key === 'Enter')     { e.preventDefault(); submit19(gc); return; }
    if (e.key === 'Backspace') { e.preventDefault(); typed19 = typed19.slice(0, -1); gc.render(); return; }
    if (e.key === ' ')         { e.preventDefault(); }
    if (e.key.length === 1 && typed19.length < MAX_LEN) {
      typed19 += e.key;
      gc.render();
    }
  });
};

export const drawLevel19 = (gc: GameContext) => {
  ensureListeners19(gc);

  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'E.', 'One, Two, Three, Four, Five, Six, Seven. Eight. Capital E, as written.', 20);
    return;
  }
  if (freshEntry(gc)) {
    typed19 = ''; focused19 = true; fails19 = 0; submits19 = 0;
    clock19.last = 0; clock19.elapsed = 0;
  }

  // Pause-aware clock: it drives the blank's caret and stops dead while suspended.
  const { elapsed } = levelClock(gc, clock19);

  // ── COMPLETE THE SEQUENCE ────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `${Math.round(13 * s)}px ${monoFont}`;
  withTracking(ctx, 2.1 * s, () =>
    ctx.fillText('COMPLETE THE SEQUENCE', cx, topBoxY + topBoxHeight * 0.10, topBoxWidth * 0.9));

  // ── O T T F F S S ?  (the ? is the accent) ───────────────────────────────
  const seq = ['O', 'T', 'T', 'F', 'F', 'S', 'S', '?'];
  const seqPx = Math.round(Math.min(64 * s, topBoxWidth * 0.062));
  ctx.font = `bold ${seqPx}px ${displayFont}`;
  ctx.textAlign = 'left';
  const gap = seqPx * 0.44;
  const widths = seq.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (seq.length - 1);
  let sx = cx - total / 2;
  const seqY = topBoxY + topBoxHeight * 0.205;
  seq.forEach((c, i) => {
    ctx.fillStyle = i === seq.length - 1 ? t.accent : t.ink;
    ctx.fillText(c, sx, seqY);
    sx += widths[i] + gap;
  });

  // ── the blank you write in ───────────────────────────────────────────────
  const fieldW = Math.round(200 * s);
  const fieldH = Math.round(58 * s);
  const fieldX = cx - fieldW / 2;
  const fieldY = topBoxY + topBoxHeight * 0.54;

  roundRect(ctx, fieldX, fieldY, fieldW, fieldH, 5);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = focused19 ? t.accent : t.hairline;
  ctx.lineWidth   = focused19 ? 3 : 1.5;
  ctx.stroke();

  const valuePx = Math.round(30 * s);
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const midY = fieldY + fieldH / 2;
  if (typed19.length) {
    ctx.font      = `bold ${valuePx}px ${displayFont}`;
    ctx.fillStyle = t.ink;
    ctx.fillText(typed19, cx, midY, fieldW - 28);
  } else {
    ctx.font      = `${valuePx}px ${displayFont}`;
    ctx.fillStyle = t.hairline;
    ctx.fillText('…', cx, midY);
  }

  // caret: blinks on the level's own clock, so it stops with everything else
  if (focused19 && elapsed % 1.06 < 0.53) {
    ctx.font = `bold ${valuePx}px ${displayFont}`;
    const tw = Math.min(ctx.measureText(typed19).width, fieldW - 28);
    ctx.fillStyle = t.ink;
    ctx.fillRect(cx + tw / 2 + 3, fieldY + fieldH * 0.22, 2, fieldH * 0.56);
  }
  gc.hitAreas.push({ x: fieldX, y: fieldY, w: fieldW, h: fieldH, noCursor: true, action: () => {
    if (!inputOpen(gc)) return;
    focused19 = true;
  } });

  // ── SUBMIT ───────────────────────────────────────────────────────────────
  const btnW = Math.round(200 * s);
  const btnH = Math.round(48 * s);
  drawButton(gc, 'SUBMIT →', cx - btnW / 2, topBoxY + topBoxHeight * 0.76, btnW, btnH, () => submit19(gc), 18);

  // ── the form's footnote ──────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `${Math.round(10 * s)}px ${monoFont}`;
  withTracking(ctx, 1.4 * s, () =>
    ctx.fillText('WRITE YOUR ANSWER IN THE SPACE PROVIDED', cx, topBoxY + topBoxHeight * 0.92, topBoxWidth * 0.9));

  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    typed: typed19,
    fails: fails19,
    submits: submits19,
    focused: focused19,
    elapsed: Math.round(elapsed * 1000),
  };
};
