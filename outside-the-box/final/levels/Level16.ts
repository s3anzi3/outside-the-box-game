import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, triggerStamp } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, inputOpen, levelClock } from './lateralHelpers';

// ── Q16 — The Honest Option ───────────────────────────────────────────────────
// The exam gives you nothing: "Select the correct answer", a note that no further
// information is coming, and four coloured buttons. The whole answer is in the
// examiner's remarks panel at the bottom, where he quietly breaks protocol and
// leaks that it is the BLUE one. The level rewards the player who finally reads
// the narration they have been ignoring for fifteen questions; Q30's checkpoint
// later asks whether they were actually listening.
//
// Ported from mocks/q16-the-honest-option.html. Mechanics unchanged from the
// original build; the four fills now use the fountain-pen ink palette shared with
// Q12 and Q15 (red #C03A2E, blue #2E6BA8, green #3F8F55, yellow #D8A81F), ivory
// text on the three dark fills and ink text on the yellow one, as in the mock.

const CORRECT = 'BLUE';
const IVORY   = '#F7F1E3';

const OPTIONS: { label: string; fill: string; text: string }[] = [
  { label: 'RED',    fill: '#C03A2E', text: IVORY },
  { label: 'BLUE',   fill: '#2E6BA8', text: IVORY },
  { label: 'GREEN',  fill: '#3F8F55', text: IVORY },
  { label: 'YELLOW', fill: '#D8A81F', text: '#1E1A15' },
];

// The mock slams CORRECT on the paper and only swaps in the win screen 750ms
// later; the hold is measured on the pause-aware level clock, so suspending the
// exam mid-slam suspends the win as well.
const WIN_HOLD = 0.75;

let picked16 = '';        // the option the candidate committed to
let pickedAt16 = 0;       // level-clock seconds at the moment the correct one was picked
let fails16 = 0;          // wrong colours (each one costs a heart)
const clock16 = { last: 0, elapsed: 0 };

export const drawLevel16 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'CORRECT.', 'You listened to the one voice that was actually on your side.', 17);
    return;
  }
  if (freshEntry(gc)) {
    picked16 = '';
    pickedAt16 = 0;
    fails16 = 0;
    clock16.last = 0;
    clock16.elapsed = 0;
  }

  // Pause-aware clock: it holds still while the exam is suspended, so the pending
  // win holds still with it.
  const { elapsed } = levelClock(gc, clock16);
  if (picked16 === CORRECT && elapsed - pickedAt16 >= WIN_HOLD) {
    state.levelSubPhase = 'win';
  }

  // ── The deliberately information-free prompt ───────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${Math.round(28 * s)}px ${displayFont}`;
  ctx.fillText('Select the correct answer.', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  ctx.font      = `${Math.round(15 * s)}px ${bodyFont}`;
  ctx.fillStyle = t.fgDim;
  ctx.fillText('(no further information will be provided by the exam)',
    cx, topBoxY + topBoxHeight * 0.26, topBoxWidth * 0.9);

  // ── Four coloured options ──────────────────────────────────────────────────
  const n      = OPTIONS.length;
  const btnW   = topBoxWidth  * 0.182;
  const btnH   = topBoxHeight * 0.226;
  const gap    = topBoxWidth  * 0.031;
  const totW   = n * btnW + (n - 1) * gap;
  const startX = cx - totW / 2;
  const btnY   = topBoxY + topBoxHeight * 0.46;

  OPTIONS.forEach(({ label, fill, text }, i) => {
    drawChoice(gc, label, startX + i * (btnW + gap), btnY, btnW, btnH, () => {
      if (!inputOpen(gc)) return;
      if (picked16) return;              // an answer is already being graded
      if (label === CORRECT) {
        picked16   = CORRECT;
        pickedAt16 = elapsed;
        triggerStamp(gc, 'CORRECT', t.pass);
        gc.render();
        return;
      }
      fails16++;
      wrong(gc);
    }, { fontSize: 20, fill, textColor: text });
  });

  // Dev/test hook: the harness reads these with g.levelVar(...).
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    elapsed: Math.round(elapsed * 1000),
    picked: picked16,
    fails: fails16,
    correct: CORRECT,
    btnCX: OPTIONS.map((_, i) => Math.round(startX + i * (btnW + gap) + btnW / 2)),
    btnCY: Math.round(btnY + btnH / 2),
  };
};
