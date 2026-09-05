import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, roundRect, triggerStamp } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q26 — The Cookie ─────────────────────────────────────────────────────────
// "Click the cookie 100 times." There is no trick, and the examiner says so at 75.
// A drawn cookie squishes on every click, a counter and a progress bar keep score.
// Quirks: every tenth click a bite is clipped out of the cookie's edge and four
// crumbs drop onto the paper beneath it; the examiner narrates at 1, 25, 50, 75
// and 99; at 99 the hearts label reads CANDIDATE CHEWING for two and a half
// seconds; the hundredth click stamps CONSUMED. Nothing here costs a heart.

const TARGET = 100;

// The examiner's narration, keyed by click count (identical to the mock).
const SAY: Record<number, string> = {
  1:  'One.',
  25: "Twenty-five. Corporate calls this 'engagement'.",
  50: 'Halfway. Your wrist is under observation.',
  75: 'Seventy-five. There is no trick. I checked.',
  99: 'Ninety-nine. ...Go on.',
};

// Cookie geometry lives in the mock's 200-unit design space (body radius 90),
// scaled to pixels by `u` so the port keeps the mock's exact proportions.
const BITES: Array<[number, number]> = [
  [78, -42], [-70, -55], [86, 28], [-88, 14], [30, 84], [-40, 80], [72, 60], [-12, -92], [50, -75],
];
const BITE_R = 30;
const CHIPS: Array<[number, number, number]> = [
  [-40, -27, 9], [27, -36, 7], [-9, 9, 11], [40, 18, 8],
  [-31, 40, 9], [13, 49, 7], [49, -4, 6], [-49, 4, 5],
];

const DOUGH = '#c98a44';
const CRUST = '#5e3a13';
const CHIP  = '#3d220b';
const TAU   = Math.PI * 2;

interface Crumb { x: number; y: number; a: number; }   // x / y in cookie radii from its centre

let clicks26   = 0;
let bites26    = 0;
let crumbs26: Crumb[] = [];
let squishAt26 = -9;    // level-clock seconds of the last click
let chewUntil26 = 0;    // performance.now() until which the hearts label reads CHEWING
const clock26  = { last: 0, elapsed: 0 };

export const drawLevel26 = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  // The chewing label runs on the wall clock, exactly like the mock's 2.5s timeout,
  // so it also expires over the win screen.
  state.hudHeartsLabel = chewUntil26 && performance.now() < chewUntil26 ? 'CANDIDATE CHEWING' : undefined;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'ONE HUNDRED.', 'There was no trick. Sometimes the exam is just a cookie.', 27);
    return;
  }
  if (freshEntry(gc)) {
    clicks26 = 0; bites26 = 0; crumbs26 = [];
    squishAt26 = -9; chewUntil26 = 0;
    clock26.last = 0; clock26.elapsed = 0;
    state.hudHeartsLabel = undefined;
  }

  // Pause-aware clock: the squish (and everything else timed here) freezes with the exam.
  const { elapsed } = levelClock(gc, clock26);

  // ── Prompt ─────────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(26 * s)}px ${displayFont}`;
  ctx.fillText(`Click the cookie ${TARGET} times.`, cx, topBoxY + topBoxHeight * 0.09 + 16 * s, topBoxWidth * 0.9);

  // ── The cookie ─────────────────────────────────────────────────────────────
  const R       = Math.min(topBoxWidth, topBoxHeight) * 0.189;   // 72px at 1280x860
  const u       = R / 90;                                        // design unit -> px
  const cookieY = topBoxY + topBoxHeight * 0.50;
  const since   = elapsed - squishAt26;
  const press   = since >= 0 && since < 0.11 ? 1 - since / 0.11 : 0;   // the mock's .11s scale(.92)
  const scale   = 1 - 0.08 * press;

  ctx.save();
  ctx.translate(cx, cookieY);
  ctx.scale(scale, scale);
  if (bites26 > 0) {
    // Bites are holes: an even-odd clip of the cookie's box minus each bite circle.
    const holes = new Path2D();
    holes.rect(-R * 1.8, -R * 1.8, R * 3.6, R * 3.6);
    for (let i = 0; i < bites26 && i < BITES.length; i++) {
      const [bx, by] = BITES[i];
      holes.moveTo((bx + BITE_R) * u, by * u);
      holes.arc(bx * u, by * u, BITE_R * u, 0, TAU);
    }
    ctx.clip(holes, 'evenodd');
  }
  ctx.fillStyle = DOUGH;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = CRUST;
  ctx.lineWidth   = 4 * u;
  ctx.stroke();
  ctx.fillStyle = CHIP;
  for (const [chx, chy, chr] of CHIPS) {
    ctx.beginPath();
    ctx.arc(chx * u, chy * u, chr * u, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // ── Crumbs on the paper beneath it ─────────────────────────────────────────
  ctx.lineWidth = 1;
  for (const cr of crumbs26) {
    ctx.save();
    ctx.translate(cx + cr.x * R, cookieY + cr.y * R);
    ctx.rotate(cr.a);
    ctx.fillStyle   = DOUGH;
    ctx.strokeStyle = CRUST;
    roundRect(ctx, -2.5 * s, -2 * s, 5 * s, 4 * s, 2 * s);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ── Counter ────────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(30 * s)}px ${displayFont}`;
  ctx.fillText(`${clicks26} / ${TARGET}`, cx, topBoxY + topBoxHeight * 0.75 + 18 * s);

  // ── Progress bar ───────────────────────────────────────────────────────────
  const barW = topBoxWidth * 0.42;
  const barH = 10 * s;
  const barX = cx - barW / 2;
  const barY = topBoxY + topBoxHeight * 0.90;
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle   = DOUGH;
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * Math.min(1, clicks26 / TARGET), barH - 2);

  // ── The cookie is the only thing to click, and every click counts ──────────
  const hitR = R * 1.111;   // the mock's 160px wrapper around the 144px cookie
  gc.hitAreas.push({
    x: cx - hitR, y: cookieY - hitR, w: hitR * 2, h: hitR * 2,
    action: () => {
      if (!inputOpen(gc)) return;
      clicks26++;
      const n = clicks26;
      squishAt26 = clock26.elapsed;
      gc.sounds.play('dash', { volume: 0.14, restart: true });

      if (n % 10 === 0 && n / 10 <= BITES.length) {
        bites26 = n / 10;
        gc.sounds.ui('thud');
        for (let i = 0; i < 4; i++) {
          crumbs26.push({
            x: (Math.random() * 2 - 1) * 1.25,
            y: 0.97 + Math.random() * 0.19,
            a: (Math.random() * 60 - 30) * Math.PI / 180,
          });
        }
      }
      if (SAY[n]) say(gc, SAY[n]);
      if (n === 99) chewUntil26 = performance.now() + 2500;
      if (n >= TARGET) {
        triggerStamp(gc, 'CONSUMED', t.pass);
        state.winChimeFor = state.currentLevel;   // drawWinScreen must not overwrite CONSUMED
        gc.sounds.ui('chime');
        state.levelSubPhase = 'win';
      }
      gc.render();
    },
  });

  // ── Test hook ──────────────────────────────────────────────────────────────
  (gc as unknown as { lv?: Record<string, unknown> }).lv = {
    clicks:   clicks26,
    bites:    bites26,
    crumbs:   crumbs26.length,
    elapsed,
    chewing:  state.hudHeartsLabel === 'CANDIDATE CHEWING',
  };
};
