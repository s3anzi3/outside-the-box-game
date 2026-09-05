import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale }     from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q27 — Keys But No Locks ──────────────────────────────────────────────────
// The paper prints the four line riddle: keys but no locks, space but no rooms,
// you can enter but cannot go inside. Under it sit four answer buttons, and all
// four are decoys, KEYBOARD included. The riddle's answer is the instrument the
// candidate is already resting their hands on, so the only way to give it is to
// type K E Y B O A R D on the physical keyboard. The letters appear faintly at
// the foot of the paper as they land, Backspace erases one, and the buffer only
// ever keeps the last eight letters. Keys are ignored while the exam is paused.

const SECRET = 'KEYBOARD';
const OPTIONS = ['HOUSE', 'MAP', 'PIANO', 'KEYBOARD'] as const;

const OPENING = ['A riddle to test your wits.', 'The answer is the means by which you give it.'];
const LINE_FIRST_MISS = 'No. Keys, space, enter. It is closer than you think.';
const LINE_SAID_WORD  = 'Yes. That is the word. That is not how you say it.';
const LINE_SECOND     = 'The answer is not on the paper, candidate. It is under your hands.';
const LINE_TYPING     = 'Now we are talking. Keep going.';
const LINE_WON        = 'I heard the keys. Everyone hears the keys.';

const RIDDLE = [
  'I have keys but no locks.',
  'I have space but no rooms.',
  'You can enter but cannot go inside.',
];
const ASK = 'What am I?';

// How long the examiner looks up from his desk when the first letter lands.
const FACE_UP_S27 = 1.2;

// ── Module state — also the harness hook object (window.__gc.lv) ─────────────
const lv27 = {
  typed: '',
  secret: SECRET,
  failures: 0,
  saidWord: false,
  typedOnce: false,
  faceUpUntil: 0,
  elapsed: 0,      // seconds on the paper, frozen while suspended
  won: false,
};

const clock27 = { last: 0, elapsed: 0 };
let listenersAdded27 = false;

const reset27 = () => {
  lv27.typed = '';
  lv27.failures = 0;
  lv27.saidWord = false;
  lv27.typedOnce = false;
  lv27.faceUpUntil = 0;
  lv27.elapsed = 0;
  lv27.won = false;
  clock27.last = 0;
  clock27.elapsed = 0;
};

// Local copy of the renderer's tracking helper (it is not exported): the mock's
// mono directive and the faint preview are letter-spaced, and canvas needs
// letterSpacing set by hand.
const withTracking = (ctx: CanvasRenderingContext2D, px: number, fn: () => void) => {
  const c = ctx as unknown as { letterSpacing?: string };
  const prev = c.letterSpacing;
  try { c.letterSpacing = `${px}px`; } catch { /* unsupported — ignore */ }
  try { fn(); } finally { try { c.letterSpacing = prev ?? '0px'; } catch { /* ignore */ } }
};

// Every button on the paper is a decoy. The remark ladder is the hint system:
// clicking the right word the wrong way gets its own line, and a second miss of
// any kind points at the candidate's hands.
const decoy27 = (gc: GameContext, label: string) => {
  if (!inputOpen(gc)) return;
  lv27.failures++;
  let line: string;
  if (label === SECRET && !lv27.saidWord) { lv27.saidWord = true; line = LINE_SAID_WORD; }
  else if (lv27.failures >= 2) line = LINE_SECOND;
  else line = LINE_FIRST_MISS;
  say(gc, line);
  wrong(gc);
};

function ensureListeners27(gc: GameContext): void {
  if (listenersAdded27) return;
  listenersAdded27 = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const st = gc.state;
    if (st.currentLevel !== 27 || st.currentScreen !== 'level') return;
    // The paper never scrolls out from under the candidate.
    if (e.key === ' ' || e.key === 'Backspace' || e.key.startsWith('Arrow')) e.preventDefault();
    if (!inputOpen(gc)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Backspace') {
      lv27.typed = lv27.typed.slice(0, -1);
      gc.render();
      return;
    }
    if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;

    lv27.typed = (lv27.typed + e.key).toUpperCase().slice(-SECRET.length);
    gc.sounds.ui('tick');

    if (!lv27.typedOnce) {
      lv27.typedOnce = true;
      lv27.faceUpUntil = lv27.elapsed + FACE_UP_S27;
      say(gc, LINE_TYPING);
    }
    if (lv27.typed === SECRET) {
      lv27.won = true;
      say(gc, LINE_WON);
      st.levelSubPhase = 'win';
    }
    gc.render();
  });
}

export const drawLevel27 = (gc: GameContext) => {
  ensureListeners27(gc);

  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  // Harness hook: the same object every frame, so writes from a test stick.
  const dev = window as unknown as { __gc?: { lv?: unknown } };
  if (dev.__gc) dev.__gc.lv = lv27;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'KEYBOARD.', 'You did not click it. You typed it. That was the whole question.', 28);
    return;
  }
  if (freshEntry(gc)) { reset27(); say(gc, OPENING[0], OPENING[1]); }

  // Pause-aware clock: the only thing on the clock here is the examiner glancing
  // up at the first keystroke, and a suspended exam suspends that too.
  const { elapsed } = levelClock(gc, clock27);
  lv27.elapsed = elapsed;
  if (elapsed < lv27.faceUpUntil) gc.guideCharDir = 'up';

  // ── Directive: the space bar is, technically, provided ──────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `${Math.round(13 * s)}px ${monoFont}`;
  withTracking(ctx, 1.82 * s, () => {
    ctx.fillText('ANSWER IN THE SPACE PROVIDED', cx + 0.91 * s, topBoxY + topBoxHeight * 0.06 + 8 * s, topBoxWidth * 0.9);
  });

  // ── The riddle ─────────────────────────────────────────────────────────────
  const riddleTop = topBoxY + topBoxHeight * 0.15;
  ctx.fillStyle = t.ink;
  ctx.font      = `italic ${Math.round(23 * s)}px ${displayFont}`;
  for (let i = 0; i < RIDDLE.length; i++) {
    ctx.fillText(RIDDLE[i], cx, riddleTop + (15 + i * 30) * s, topBoxWidth * 0.9);
  }
  ctx.font = `bold ${Math.round(28 * s)}px ${displayFont}`;
  ctx.fillText(ASK, cx, riddleTop + 118 * s, topBoxWidth * 0.9);

  // ── The four decoys ────────────────────────────────────────────────────────
  const btnW   = topBoxWidth  * 0.1609;
  const btnH   = topBoxHeight * 0.1365;
  const btnGap = topBoxWidth  * 0.0220;
  const totalW = btnW * OPTIONS.length + btnGap * (OPTIONS.length - 1);
  const btnSX  = cx - totalW / 2;
  const btnY   = topBoxY + topBoxHeight * 0.66;
  for (let i = 0; i < OPTIONS.length; i++) {
    const label = OPTIONS[i];
    drawChoice(gc, label, btnSX + i * (btnW + btnGap), btnY, btnW, btnH, () => decoy27(gc, label), { fontSize: 21 });
  }

  // ── The faint record of what has been typed so far ─────────────────────────
  if (lv27.typed.length > 0) {
    ctx.save();
    ctx.globalAlpha  = 0.8;
    ctx.fillStyle    = t.fgDim;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold ${Math.round(15 * s)}px ${displayFont}`;
    withTracking(ctx, 4.8 * s, () => {
      ctx.fillText(lv27.typed, cx + 2.4 * s, topBoxY + topBoxHeight * 0.90 + 10 * s, topBoxWidth * 0.9);
    });
    ctx.restore();
  }
};
