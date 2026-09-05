import { GameContext, Rect } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { roundRect, uiScale } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, levelClock, wrong } from './lateralHelpers';

// ── Q35 — Institutional Simon ─────────────────────────────────────────────────
// The memory test survives; the four coloured panels do not. The paper only says
// "Watch. Then repeat." and then the examination's own furniture performs the
// sequence: the logo, the Q.35 label, the pause control, the examiner and the
// hearts row light up in turn with a gold halo. Your turn: click those actual
// pieces of chrome in the same order. None of them has ever been clickable.
// The pause control is part of the instrument today, so it refuses to pause.
// Three rounds of 3, 4 and 5. A wrong click costs a heart and replays the round.

const NAMES = ['logo', 'qnum', 'pause', 'examiner', 'hearts'] as const;
type KeyName = (typeof NAMES)[number];

const ROUNDS = [3, 4, 5];

const GLOW_ON     = 0.60;   // s a piece of chrome stays lit
const GLOW_GAP    = 0.25;   // s dark between pieces
const STEP        = GLOW_ON + GLOW_GAP;
const LEAD_FIRST  = 3.50;   // s before the very first sequence (2.6 settle + 0.9 lead)
const LEAD_IN     = 0.90;   // s of WATCH before a sequence starts playing
const BETWEEN     = 0.90;   // s the finished round's dots stay up before the next one
const REPLAY_HOLD = 1.40;   // s the AGAIN state is held after a wrong click
const DONE_HOLD   = 0.50;   // s the COMPLETE state is held before the win
const PRESS_FLASH = 0.22;   // s a correctly pressed piece flashes back

const LADDER = [
  'The paper is not the instrument. Look at everything that glowed.',
  'The logo. The item number. The pause control. Me. Your hearts. All of them accept a click today.',
];
const PAUSE_LINE = 'The suspension control is part of the instrument today. I disabled it. Do not tell corporate.';
const OPENING = [
  "A simple test of focus. Corporate insists on measuring 'attention to detail.'",
  'Watch what lights up. Then touch it, in order.',
];
const LABELS: Record<string, string> = {
  watch:   'WATCH',
  input:   'YOUR TURN',
  replay:  'AGAIN',
  between: 'WATCH',
  done:    'COMPLETE',
};

let round35    = 0;
let seq35: KeyName[] = [];
let idx35      = 0;
let badIdx35   = -1;
let fails35    = 0;
let phase35: 'watch' | 'input' | 'replay' | 'between' | 'done' = 'watch';
let phaseAt35  = 0;    // clock seconds when the current phase began
let leadIn35   = LEAD_FIRST;
let lastStep35 = -1;
let flash35    = '';   // chrome key flashed back after a correct press
let flashTo35  = 0;
let litNow35   = '';   // the piece glowing during THIS frame
let pauseTold35 = false;
const clock35 = { last: 0, elapsed: 0 };

const makeSequence = (len: number): KeyName[] => {
  const seq: KeyName[] = [];
  while (seq.length < len) {
    const k = NAMES[Math.floor(Math.random() * NAMES.length)];
    if (seq[seq.length - 1] !== k) seq.push(k);
  }
  return seq;
};

const enterWatch = (lead: number, fresh: boolean) => {
  if (fresh) seq35 = makeSequence(ROUNDS[Math.min(round35, ROUNDS.length - 1)]);
  phase35    = 'watch';
  leadIn35   = lead;
  phaseAt35  = clock35.elapsed;
  idx35      = 0;
  badIdx35   = -1;
  lastStep35 = -1;
  flash35    = '';
};

// A click on a piece of the furniture during YOUR TURN.
const press = (gc: GameContext, name: KeyName) => {
  if (phase35 !== 'input' || !inputOpen(gc)) return;
  const want = seq35[idx35];
  if (name !== want) {
    badIdx35  = idx35;
    phase35   = 'replay';
    phaseAt35 = clock35.elapsed;
    flash35   = '';
    fails35++;
    wrong(gc);
    say(gc, fails35 === 1 ? LADDER[0] : LADDER[1]);
    return;
  }
  flash35   = name;
  flashTo35 = clock35.elapsed + PRESS_FLASH;
  idx35++;
  if (idx35 >= seq35.length) {
    round35++;
    phase35   = round35 >= ROUNDS.length ? 'done' : 'between';
    phaseAt35 = clock35.elapsed;
  }
};

// A gold halo around a piece of chrome: two blurred passes, no fill, so the
// furniture underneath stays readable.
const halo = (gc: GameContext, r: Rect, pad: number, oval: boolean) => {
  const { ctx } = gc;
  const t = getTheme(gc.state);
  ctx.save();
  ctx.strokeStyle = t.seal;
  ctx.shadowColor = t.seal;
  for (const pass of [0, 1]) {
    ctx.shadowBlur = pass === 0 ? 26 : 12;
    ctx.lineWidth  = pass === 0 ? 3 : 2;
    ctx.globalAlpha = pass === 0 ? 0.95 : 0.8;
    ctx.beginPath();
    if (oval) {
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 + pad, r.h / 2 + pad, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      roundRect(ctx, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, 6);
      ctx.stroke();
    }
  }
  ctx.restore();
};

// mono text with the mock's letter tracking
const trackedWidth = (ctx: CanvasRenderingContext2D, text: string, track: number) => {
  let total = 0;
  for (const ch of text) total += ctx.measureText(ch).width + track;
  return total;
};
const drawTracked = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, track: number) => {
  let cx = x;
  for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + track; }
  return cx;
};

export const drawLevel35 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    // the instrument is dismantled: the suspension control works again
    state.pauseDisabled = false;
    gc.pauseIntercept = undefined;
    drawWinScreen(gc, 'ATTENTIVE.', 'You played the examination like an instrument. Corporate is measuring that too.', 36);
    return;
  }

  if (freshEntry(gc)) {
    round35 = 0; idx35 = 0; badIdx35 = -1; fails35 = 0; lastStep35 = -1;
    flash35 = ''; flashTo35 = 0; litNow35 = ''; pauseTold35 = false;
    clock35.last = 0; clock35.elapsed = 0;
    seq35 = makeSequence(ROUNDS[0]);
    phase35 = 'watch'; leadIn35 = LEAD_FIRST; phaseAt35 = 0;
    say(gc, OPENING[0], OPENING[1]);
  }

  // The pause control belongs to the instrument on this level.
  state.pauseDisabled = true;
  gc.pauseIntercept = () => {
    if (phase35 === 'input' && inputOpen(gc)) { press(gc, 'pause'); return; }
    if (!pauseTold35) { pauseTold35 = true; say(gc, PAUSE_LINE); }
  };

  // ── clock + state machine (pause-aware: everything freezes while suspended) ──
  const { elapsed } = levelClock(gc, clock35);
  litNow35 = '';

  if (phase35 === 'watch') {
    const tt = elapsed - phaseAt35 - leadIn35;
    if (tt >= 0) {
      const step = Math.floor(tt / STEP);
      if (step >= seq35.length) {
        phase35 = 'input'; phaseAt35 = elapsed; idx35 = 0; badIdx35 = -1;
      } else if (tt % STEP < GLOW_ON) {
        litNow35 = seq35[step];
        if (step !== lastStep35) { lastStep35 = step; gc.sounds.ui('tick'); }
      }
    }
  } else if (phase35 === 'replay') {
    if (elapsed - phaseAt35 >= REPLAY_HOLD) enterWatch(LEAD_IN, false);
  } else if (phase35 === 'between') {
    if (elapsed - phaseAt35 >= BETWEEN) enterWatch(LEAD_IN, true);
  } else if (phase35 === 'done') {
    if (elapsed - phaseAt35 >= DONE_HOLD) state.levelSubPhase = 'win';
  }
  if (flash35 && elapsed < flashTo35) litNow35 = flash35;
  else if (flash35 && elapsed >= flashTo35) flash35 = '';

  // ── the paper says almost nothing ───────────────────────────────────────────
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('A T T E N T I O N   T O   D E T A I L', cx, topBoxY + topBoxHeight * 0.12, topBoxWidth * 0.9);

  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(44 * s)}px ${displayFont}`;
  ctx.fillText('Watch. Then repeat.', cx, topBoxY + topBoxHeight * 0.28, topBoxWidth * 0.9);

  // ROUND n OF 3  ·  LABEL
  const shownRound = Math.min(round35 + 1, ROUNDS.length);
  const prefix = `ROUND ${shownRound} OF 3  ·  `;
  const label  = LABELS[phase35] ?? '';
  const fontPx = Math.round(14 * s);
  ctx.font = `${fontPx}px ${monoFont}`;
  const track = fontPx * 0.18;
  const lineY = topBoxY + topBoxHeight * 0.52;
  const wPre  = trackedWidth(ctx, prefix, track);
  const wLab  = trackedWidth(ctx, label, track);
  ctx.textAlign = 'left';
  let px = cx - (wPre + wLab) / 2;
  ctx.fillStyle = t.fgDim;
  px = drawTracked(ctx, prefix, px, lineY, track);
  ctx.fillStyle = t.accent;
  drawTracked(ctx, label, px, lineY, track);
  ctx.textAlign = 'center';

  // progress dots — one per beat of the current sequence
  const n = seq35.length;
  const dr = 6 * s;
  const spacing = dr * 2 + 14 * s;
  const dotY = topBoxY + topBoxHeight * 0.66;
  const dotX0 = cx - ((n - 1) * spacing) / 2;
  for (let i = 0; i < n; i++) {
    const dx = dotX0 + i * spacing;
    ctx.beginPath();
    ctx.arc(dx, dotY, dr, 0, Math.PI * 2);
    if (i === badIdx35) {
      ctx.fillStyle = t.danger; ctx.fill(); ctx.strokeStyle = t.danger;
    } else if (i < idx35) {
      ctx.fillStyle = t.seal; ctx.fill(); ctx.strokeStyle = t.seal;
    } else {
      ctx.strokeStyle = t.hairline;
    }
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── the instrument: glow the chrome and (during YOUR TURN) make it clickable ─
  gc.afterPanel = (g) => {
    const rects: Record<KeyName, Rect | undefined> = {
      logo:     g.chrome.logo,
      qnum:     g.chrome.qLabel,
      pause:    g.chrome.pause,
      examiner: g.chrome.examiner,
      hearts:   g.chrome.heartsRow,
    };
    const oval: Record<KeyName, boolean> = { logo: true, qnum: false, pause: false, examiner: true, hearts: false };
    const pad: Record<KeyName, number> = { logo: -8 * s, qnum: 4 * s, pause: 3 * s, examiner: -6 * s, hearts: 6 * s };

    if (litNow35) {
      const r = rects[litNow35 as KeyName];
      if (r) halo(g, r, pad[litNow35 as KeyName], oval[litNow35 as KeyName]);
    }

    if (phase35 === 'input' && inputOpen(g)) {
      for (const name of NAMES) {
        if (name === 'pause') continue;   // the header band owns that hit area; pauseIntercept routes it
        const r = rects[name];
        if (!r) continue;
        g.hitAreas.push({
          x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8,
          action: () => press(g, name),
        });
      }
    }
  };

  // test hook: the sequence is random, so the harness has to read it back
  const dev = window as unknown as { __gc?: Record<string, unknown> };
  if (dev.__gc) {
    dev.__gc.lv = {
      round: round35,
      phase: phase35,
      seq: seq35.slice(),
      idx: idx35,
      fails: fails35,
      lit: litNow35,
      elapsed: Math.round(clock35.elapsed * 1000),
    };
  }
};
