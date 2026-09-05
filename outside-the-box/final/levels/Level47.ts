import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { roundRect, uiScale } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q47 — Change the Facts ────────────────────────────────────────────────────
// The Müller-Lyer illusion, with the honest answer removed. Two lines with fins
// are exactly equal and each carries a live length readout in millimetres.
// The buttons are TOP, BOTTOM and SAME, except SAME is greyed out "(unavailable
// in your region)" and costs a heart, and TOP / BOTTOM while the lines are equal
// cost a heart too. Every endpoint has a handle: drag one and the line changes
// length, the readout follows, and once a line is at least twenty units longer
// its button becomes true. If the truthful answer is not on the form, you change
// the facts to fit the form.

// The mock's SVG viewBox is 1044 × 381, mapped straight onto the play area.
const VW = 1044, VH = 381;

interface Seg { y: number; x1: number; x2: number; fin: 'in' | 'out'; }

const OPENING = "Which line is longer? Don't trust your eyes. SAME is unavailable in your region.";
const TOUCHED = '...You are moving the question. Nobody said you could. Nobody said you could not.';
const REGION  = 'Unavailable. In your region.';
const LADDER = [
  'They are equal and you cannot say so. That is the situation.',
  'Nothing on this page is fixed. Not even the question.',
  'Grab the end of the top line. Make it longer. Then say it is.',
];

const WIN_MARGIN = 20;   // mock units a line must gain before its button is true

let top47:    Seg = { y: 122, x1: 342, x2: 702, fin: 'in'  };
let bottom47: Seg = { y: 206, x1: 342, x2: 702, fin: 'out' };
let fails47 = 0;
let touched47 = false;
let drag47: { seg: Seg; end: 'x1' | 'x2' } | null = null;
let pendingHint47: { text: string; at: number } | null = null;
const clock47 = { last: 0, elapsed: 0 };

const lenOf = (L: Seg) => L.x2 - L.x1;
const mmOf  = (L: Seg) => Math.round(lenOf(L) * 142 / 360);
const diff47 = () => lenOf(top47) - lenOf(bottom47);

export const drawLevel47 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'AMENDED.', 'You changed the facts to fit the buttons. Corporate does this every quarter.', 48);
    return;
  }
  if (freshEntry(gc)) {
    top47    = { y: 122, x1: 342, x2: 702, fin: 'in'  };
    bottom47 = { y: 206, x1: 342, x2: 702, fin: 'out' };
    fails47 = 0;
    touched47 = false;
    drag47 = null;
    pendingHint47 = null;
    clock47.last = 0; clock47.elapsed = 0;
    say(gc, OPENING);
  }

  const { elapsed } = levelClock(gc, clock47);

  // mock units → canvas
  const kx = topBoxWidth / VW, ky = topBoxHeight / VH;
  const mx = (v: number) => topBoxX + v * kx;
  const my = (v: number) => topBoxY + v * ky;

  // The examiner's delayed retort after a wrong answer (pause-aware).
  if (pendingHint47 && elapsed >= pendingHint47.at) {
    const text = pendingHint47.text;
    pendingHint47 = null;
    if (state.levelSubPhase === 'active' && !state.gameOver) say(gc, text);
  }

  const fail = (line?: string) => {
    if (!inputOpen(gc)) return;
    fails47++;
    const text = line ?? LADDER[Math.min(fails47 - 1, LADDER.length - 1)];
    wrong(gc);
    pendingHint47 = { text, at: clock47.elapsed + 0.7 };
  };

  // ── heading ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('P E R C E P T I O N', cx, my(VH * 0.07));

  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(32 * s)}px ${displayFont}`;
  ctx.fillText('Which line is longer?', cx, my(VH * 0.14), topBoxWidth * 0.9);

  // ── the two lines, their fins, their handles and their readouts ────────────
  const HANDLE_R = 7, HANDLE_HOT = 9;
  const grabR = Math.max(14, 16 * s);

  const drawSeg = (L: Seg) => {
    const y  = my(L.y);
    const d  = L.fin === 'in' ? -22 : 22;
    const x1 = mx(L.x1), x2 = mx(L.x2);
    const fx1 = mx(L.x1 - d), fx2 = mx(L.x2 + d);
    const fy = 20 * ky;

    ctx.strokeStyle = t.ink;
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx1, y - fy); ctx.lineTo(x1, y); ctx.lineTo(fx1, y + fy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fx2, y - fy); ctx.lineTo(x2, y); ctx.lineTo(fx2, y + fy);
    ctx.stroke();

    // readout
    ctx.fillStyle = t.fgDim;
    ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mmOf(L)} MM`, (x1 + x2) / 2, my(L.y + 40));

    // handles
    (['x1', 'x2'] as const).forEach((end) => {
      const hx = end === 'x1' ? x1 : x2;
      const held = !!drag47 && drag47.seg === L && drag47.end === end;
      const near = Math.abs(gc.mouseX - hx) <= grabR && Math.abs(gc.mouseY - y) <= grabR;
      const hot = held || near;
      ctx.beginPath();
      ctx.arc(hx, y, (hot ? HANDLE_HOT : HANDLE_R) * s, 0, Math.PI * 2);
      ctx.fillStyle = t.panel;
      ctx.fill();
      ctx.strokeStyle = hot ? t.accent : t.hairline;
      ctx.lineWidth = 1.5 * s;
      ctx.stroke();
      gc.hitAreas.push({ x: hx - grabR, y: y - grabR, w: grabR * 2, h: grabR * 2, action: () => {} });
    });
  };

  drawSeg(top47);
  drawSeg(bottom47);

  // ── dragging an endpoint (polled every frame) ──────────────────────────────
  if (inputOpen(gc)) {
    if (!drag47 && gc.mouseDown) {
      let best: { seg: Seg; end: 'x1' | 'x2'; d: number } | null = null;
      for (const L of [top47, bottom47]) {
        const y = my(L.y);
        if (Math.abs(gc.mouseY - y) > grabR) continue;
        for (const end of ['x1', 'x2'] as const) {
          const hx = mx(end === 'x1' ? L.x1 : L.x2);
          const d = Math.abs(gc.mouseX - hx);
          if (d <= grabR && (!best || d < best.d)) best = { seg: L, end, d };
        }
      }
      if (best) drag47 = { seg: best.seg, end: best.end };
    }
    if (drag47 && gc.mouseDown) {
      const L = drag47.seg;
      const v = (gc.mouseX - topBoxX) / kx;
      const before = drag47.end === 'x1' ? L.x1 : L.x2;
      if (drag47.end === 'x1') L.x1 = Math.max(60, Math.min(L.x2 - 80, v));
      else                     L.x2 = Math.min(VW - 60, Math.max(L.x1 + 80, v));
      const after = drag47.end === 'x1' ? L.x1 : L.x2;
      if (after !== before && !touched47) { touched47 = true; say(gc, TOUCHED); }
    }
    if (drag47 && !gc.mouseDown) drag47 = null;
  } else {
    drag47 = null;
  }

  // ── answers: TOP / BOTTOM / SAME ───────────────────────────────────────────
  const btnW = 170 * kx, btnH = 58 * ky, gap = 28 * kx;
  const totW = btnW * 3 + gap * 2;
  const btnX = cx - totW / 2;
  const btnY = my(VH * 0.91 - 58);

  drawChoice(gc, 'TOP', btnX, btnY, btnW, btnH, () => {
    if (!inputOpen(gc)) return;
    if (diff47() >= WIN_MARGIN) { state.levelSubPhase = 'win'; gc.render(); }
    else fail();
  }, { fontSize: 20 });

  drawChoice(gc, 'BOTTOM', btnX + btnW + gap, btnY, btnW, btnH, () => {
    if (!inputOpen(gc)) return;
    if (diff47() <= -WIN_MARGIN) { state.levelSubPhase = 'win'; gc.render(); }
    else fail();
  }, { fontSize: 20 });

  // SAME is drawn by hand: greyed out, unavailable in your region, and it still
  // costs a heart when you insist.
  const sx = btnX + (btnW + gap) * 2;
  ctx.save();
  ctx.globalAlpha = 0.45;
  roundRect(ctx, sx, btnY, btnW, btnH, 6);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.min(Math.round(20 * s), btnH * 0.6)}px ${bodyFont}`;
  ctx.fillText('SAME', sx + btnW / 2, btnY + btnH / 2, btnW - 16);
  ctx.restore();

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${Math.round(9 * s)}px ${monoFont}`;
  ctx.fillText('(UNAVAILABLE IN YOUR REGION)', sx + btnW / 2, btnY + btnH + 6 * s);

  gc.hitAreas.push({ x: sx, y: btnY, w: btnW, h: btnH, noCursor: true, action: () => fail(REGION) });

  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    topLen: lenOf(top47), bottomLen: lenOf(bottom47), diff: diff47(),
    mmTop: mmOf(top47), mmBottom: mmOf(bottom47),
    fails: fails47, touched: touched47, dragging: !!drag47, elapsed,
  };
};
