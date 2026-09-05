import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale }     from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q24 — Easy One ────────────────────────────────────────────────────────────
// "15 + 15 = ?" in big serif, ringed by ten pieces of helpful-looking exam
// software: HINT, CALCULATE, EASY MODE ON, SHOW STEPS, SKIP, CONFIRM, CHECK
// ANSWER, USE CALCULATOR, SUBMIT ALL and SOLVE. Every one of them is a decoy
// that costs a heart. Twenty-three questions of traps have trained the
// candidate to expect a catch, so the hand drifts to HINT first, or picks 30
// and then reaches for CONFIRM. The trap is the interface itself: click 30 and
// stop. A clicked decoy keeps a graphite TRIED tick so the candidate can see
// how much of the furniture they have already believed in.

// ── Decoy buttons scattered around the box (all lose a life) ──────────────────
// Positions are fractions of topBoxWidth / topBoxHeight
const DECOYS: { label: string; fx: number; fy: number; fw: number; fh: number }[] = [
  { label: 'HINT',             fx: 0.02,  fy: 0.04,  fw: 0.14,  fh: 0.09 },
  { label: 'CALCULATE',        fx: 0.84,  fy: 0.04,  fw: 0.14,  fh: 0.09 },
  { label: 'EASY  MODE  ON',   fx: 0.32,  fy: 0.03,  fw: 0.22,  fh: 0.08 },
  { label: 'SHOW STEPS',       fx: 0.01,  fy: 0.40,  fw: 0.18,  fh: 0.09 },
  { label: 'SKIP  →',          fx: 0.83,  fy: 0.40,  fw: 0.15,  fh: 0.09 },
  { label: 'CONFIRM',          fx: 0.29,  fy: 0.71,  fw: 0.20,  fh: 0.11 },
  { label: 'CHECK ANSWER',     fx: 0.02,  fy: 0.74,  fw: 0.20,  fh: 0.09 },
  { label: 'USE CALCULATOR',   fx: 0.76,  fy: 0.74,  fw: 0.22,  fh: 0.09 },
  { label: 'SUBMIT ALL',       fx: 0.22,  fy: 0.87,  fw: 0.55,  fh: 0.10 },
  { label: 'SOLVE',            fx: 0.54,  fy: 0.71,  fw: 0.12,  fh: 0.11 },
];

// ── Answer choices ────────────────────────────────────────────────────────────
const ANSWERS: { label: string; correct: boolean }[] = [
  { label: '25',   correct: false },
  { label: '30',   correct: true  },
  { label: '35',   correct: false },
  { label: '1515', correct: false },
];

const QUESTION   = '15  +  15  =  ?';
const OPENING    = 'This should be an easy one...';
const DECOY_LINE = 'It IS an easy one. You are the one making it hard.';
const CORP_LINE  = 'Corporate added those buttons. Not one of them is wired to anything.';
const WIN_TITLE  = 'CORRECT.';
const WIN_BODY   = '15 + 15 = 30. Well done. Every other button on that page was a lie.';

// ── Module state (reset on fresh entry) ───────────────────────────────────────
let decoyHits24 = 0;
let wrongAnswers24 = 0;
let tried24 = new Set<string>();          // decoy labels the candidate has believed in
let triedAt24 = new Map<string, number>(); // label -> level-clock seconds of the click
const clock24 = { last: 0, elapsed: 0 };   // pause-aware; drives the pencil scribble

const TICK_SECONDS = 0.3;

// A graphite "already tried this" annotation scribbled over a spent decoy.
const drawPencilTick = (
  gc: GameContext,
  x: number, y: number, w: number, h: number,
  prog: number,
) => {
  const { ctx, state, monoFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);

  const p0 = { x: x + w * 0.30, y: y + h * 0.50 };
  const p1 = { x: x + w * 0.40, y: y + h * 0.78 };
  const p2 = { x: x + w * 0.68, y: y + h * 0.18 };
  const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const drawn = (l1 + l2) * Math.max(0, Math.min(1, prog));

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((-4 * Math.PI) / 180);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  ctx.globalAlpha = 0.62;
  ctx.strokeStyle = t.fgDim;
  ctx.lineWidth = Math.max(2, 3 * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  if (drawn <= l1) {
    const f = l1 > 0 ? drawn / l1 : 0;
    ctx.lineTo(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f);
  } else {
    ctx.lineTo(p1.x, p1.y);
    const f = l2 > 0 ? (drawn - l1) / l2 : 0;
    ctx.lineTo(p1.x + (p2.x - p1.x) * f, p1.y + (p2.y - p1.y) * f);
  }
  ctx.stroke();

  if (prog > 0.8) {
    ctx.globalAlpha = 0.8 * Math.min(1, (prog - 0.8) / 0.2);
    ctx.fillStyle = t.fgDim;
    ctx.font = `bold ${Math.max(8, Math.round(9 * s))}px ${monoFont}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('TRIED', x + w - 5 * s, y + h - 3 * s);
  }
  ctx.restore();
};

// ── Draw ──────────────────────────────────────────────────────────────────────
export const drawLevel24 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  // ── Win screen ─────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, WIN_TITLE, WIN_BODY, 25);
    return;
  }

  // ── Fresh entry ────────────────────────────────────────────────────────────
  if (freshEntry(gc)) {
    decoyHits24 = 0;
    wrongAnswers24 = 0;
    tried24 = new Set<string>();
    triedAt24 = new Map<string, number>();
    clock24.last = 0;
    clock24.elapsed = 0;
    say(gc, OPENING);
  }

  // Pause-aware clock (frozen while paused / controls open / game over).
  const { elapsed } = levelClock(gc, clock24);

  // Test hook.
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    t: elapsed,
    decoyHits: decoyHits24,
    wrongAnswers: wrongAnswers24,
    tried: Array.from(tried24),
  };

  // ── Question ───────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(68 * s)}px ${displayFont}`;
  ctx.fillText(QUESTION, cx, topBoxY + topBoxHeight * 0.30, topBoxWidth * 0.9);

  // ── Decoy buttons: every one of them costs a heart ─────────────────────────
  DECOYS.forEach(({ label, fx, fy, fw, fh }) => {
    const bx = topBoxX + fx * topBoxWidth;
    const by = topBoxY + fy * topBoxHeight;
    const bw = fw * topBoxWidth;
    const bh = fh * topBoxHeight;

    drawChoice(gc, label, bx, by, bw, bh, () => {
      if (!inputOpen(gc)) return;
      decoyHits24++;
      if (!tried24.has(label)) { tried24.add(label); triedAt24.set(label, clock24.elapsed); }
      say(gc, decoyHits24 === 1 ? DECOY_LINE : CORP_LINE);
      wrong(gc);
    }, { fontSize: 13 });

    if (tried24.has(label)) {
      const at = triedAt24.get(label) ?? 0;
      drawPencilTick(gc, bx, by, bw, bh, (elapsed - at) / TICK_SECONDS);
    }
  });

  // ── 4 answer buttons ───────────────────────────────────────────────────────
  const ansBtnW   = topBoxWidth * 0.17;
  const ansBtnH   = 56 * s;
  const ansGap    = topBoxWidth * 0.03;
  const totalW    = ansBtnW * 4 + ansGap * 3;
  const ansStartX = cx - totalW / 2;
  const ansY      = topBoxY + topBoxHeight * 0.50;

  ANSWERS.forEach(({ label, correct }, i) => {
    const bx = ansStartX + i * (ansBtnW + ansGap);
    drawChoice(gc, label, bx, ansY, ansBtnW, ansBtnH, () => {
      if (!inputOpen(gc)) return;
      if (correct) { state.levelSubPhase = 'win'; gc.render(); return; }
      // Faithful: a wrong number costs a heart and the examiner says nothing new.
      wrongAnswers24++;
      wrong(gc);
    }, { fontSize: 28 });
  });
};
