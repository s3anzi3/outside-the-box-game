import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale }     from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q32 — Listen ──────────────────────────────────────────────────────────────
// Four words on the paper. One of them is being said out loud, on repeat, by the
// examination's speaker. A VOLUME dial sits on the paper: turn it all the way up
// and you still hear nothing, because the hall has a second volume — the SOUND
// slider in the pause menu. Only when the paper dial AND the pause slider are
// both all the way up does the word become audible. Guessing costs a heart.
// Replaces "Dial to Eleven".

const WORDS = ['CANDLE', 'THISTLE', 'BALLOON', 'MARGIN', 'LANTERN', 'PEBBLE', 'WHISKER', 'TURNIP'];

const OPENING = 'Listen carefully. One of these words is being said, on repeat. If you cannot hear it, something is not all the way up.';
const LADDER = [
  'You are guessing. Turn the dial all the way up first.',
  'Still nothing? There is a second volume. It is in the pause menu.',
  'Pause. Drag SOUND to one hundred. Then listen.',
];
const HEARD_IT  = '...There. Now you can hear it.';
const SECOND_V  = 'All the way up. And still nothing? There is a second volume. It is not on the paper.';
const LUCKY     = 'A guess. A lucky one. It does not count until you can hear it.';

const DIAL_MAX   = 10;      // the paper dial reads 0..10
const DIAL_UP_AT = 9.6;     // "all the way up" on the paper
const HALL_VOL   = 0.7;     // the hall starts at 70%, exactly like the mock's SOUND slider
const SPEAK_EVERY = 1.7;    // seconds between repetitions

let shown32: string[] = [];
let word32   = '';
let dial32   = 0;
let drag32   = false;
let wasDown32 = false;      // previous frame's mouse button, so a drag starts on the press
let audible32 = false;
let second32 = false;       // the "there is a second volume" line has been said
let spoken32 = 0;
let nextSpeak32 = 0;
let fails32  = 0;
let hushed32 = false;       // speech cancelled after the win
const clock32 = { last: 0, elapsed: 0 };

const shuffled = (list: string[]) => {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
};

// The examination speaker. Absent in browsers without speech synthesis: the level
// still plays (the ticker is the visible proof that audio is running).
const speakWord = (word: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.9;
    u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) { /* no voice available; the ticker still shows the audio is running */ }
};

const hush = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try { window.speechSynthesis.cancel(); } catch (e) { /* nothing to cancel */ }
};

// Letter-spaced caption (the mock's .18em mono labels).
const spacedText = (gc: GameContext, text: string, cx: number, y: number, spacing: number) => {
  const { ctx } = gc;
  const chars = text.split('');
  let total = 0;
  for (const c of chars) total += ctx.measureText(c).width + spacing;
  total -= spacing;
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (const c of chars) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = prevAlign;
  return total;
};

const spacedWidth = (gc: GameContext, text: string, spacing: number) => {
  const { ctx } = gc;
  let total = 0;
  for (const c of text.split('')) total += ctx.measureText(c).width + spacing;
  return Math.max(0, total - spacing);
};

export const drawLevel32 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    if (!hushed32) { hushed32 = true; hush(); }
    drawWinScreen(gc, 'HEARD.', 'Two volumes. Both had to be all the way up. Corporate calls that layered security.', 33);
    return;
  }

  if (freshEntry(gc)) {
    shown32 = shuffled(WORDS).slice(0, 4);
    word32 = shown32[Math.floor(Math.random() * shown32.length)];
    dial32 = 0; drag32 = false; wasDown32 = false; audible32 = false; second32 = false;
    spoken32 = 0; nextSpeak32 = 0; fails32 = 0; hushed32 = false;
    clock32.last = 0; clock32.elapsed = 0;
    // The hall is not at full volume today. (The mock's SOUND slider sits at 70%.)
    if (gc.sounds.getMasterVolume() > HALL_VOL) gc.sounds.setMasterVolume(HALL_VOL);
    hush();
    say(gc, OPENING);
  }

  const { elapsed } = levelClock(gc, clock32);
  const open = inputOpen(gc);

  // ── the VOLUME dial on the paper ───────────────────────────────────────────
  const trackX = topBoxX + topBoxWidth * 0.20;
  const trackW = topBoxWidth * 0.60;
  const trackH = 10 * s;
  const trackY = topBoxY + topBoxHeight * 0.36;
  const knobR  = 16 * s;

  const overRow = gc.mouseX >= trackX - knobR && gc.mouseX <= trackX + trackW + knobR &&
                  gc.mouseY >= trackY - knobR - 6 * s && gc.mouseY <= trackY + trackH + knobR + 6 * s;
  const setDial = (v: number) => { dial32 = Math.max(0, Math.min(DIAL_MAX, v)); };
  const dialFromX = (x: number) => ((x - trackX) / trackW) * DIAL_MAX;

  if (!open || !gc.mouseDown) drag32 = false;
  if (open && gc.mouseDown) {
    if (!drag32 && !wasDown32 && overRow) drag32 = true;
    if (drag32) setDial(dialFromX(gc.mouseX));
  }
  wasDown32 = gc.mouseDown;
  const dialUp = dial32 >= DIAL_UP_AT;

  // ── two volumes ────────────────────────────────────────────────────────────
  const nowAudible = dialUp && gc.sounds.getMasterVolume() >= 0.99;
  if (nowAudible && !audible32) { nextSpeak32 = elapsed + 0.4; say(gc, HEARD_IT); }
  if (!nowAudible && dialUp && !second32) { second32 = true; say(gc, SECOND_V); }
  audible32 = nowAudible;

  if (audible32 && open && elapsed >= nextSpeak32) {
    nextSpeak32 = elapsed + SPEAK_EVERY;
    spoken32++;
    speakWord(word32);
  }

  // ── paper content ──────────────────────────────────────────────────────────
  ctx.fillStyle = t.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `bold ${Math.round(28 * s)}px ${displayFont}`;
  ctx.fillText('Which word is being said?', cx, topBoxY + topBoxHeight * 0.09, topBoxWidth * 0.9);

  // PLAYING ticker: a pulsing dot plus the state of the audio
  const tickerY = topBoxY + topBoxHeight * 0.20;
  const label = audible32 ? 'AUDIO PLAYING · AUDIBLE' : 'AUDIO PLAYING · REPEATING';
  const tickColor = audible32 ? t.pass : t.fgDim;
  const dotColor  = audible32 ? t.pass : t.accent;
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  const spacing = 11 * s * 0.18;
  const dot = 8 * s, gap = 8 * s;
  const labelW = spacedWidth(gc, label, spacing);
  const blockX = cx - (dot + gap + labelW) / 2;
  const pulse = 0.25 + 0.75 * (0.5 - 0.5 * Math.cos((elapsed / 1.6) * Math.PI * 2));
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(blockX + dot / 2, tickerY + dot / 2, dot / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = tickColor;
  spacedText(gc, label, blockX + dot + gap + labelW / 2, tickerY + dot / 2, spacing);

  // VOLUME label
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(10 * s)}px ${monoFont}`;
  ctx.textBaseline = 'top';
  spacedText(gc, 'VOLUME', cx, topBoxY + topBoxHeight * 0.28, 10 * s * 0.18);

  // track
  ctx.fillStyle = t.hairline;
  ctx.fillRect(trackX, trackY, trackW, trackH);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(trackX, trackY, trackW, trackH);

  // ticks and numbers 0..10
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${Math.round(11 * s)}px ${bodyFont}`;
  for (let i = 0; i <= DIAL_MAX; i++) {
    const tx = trackX + (i / DIAL_MAX) * trackW;
    ctx.fillRect(tx - 0.5, trackY - 8 * s, 1, 6 * s);
    ctx.fillText(String(i), tx, trackY + trackH + 6 * s);
  }

  // knob
  const knobX = trackX + (dial32 / DIAL_MAX) * trackW;
  ctx.fillStyle = dialUp ? t.accent : t.ink;
  ctx.beginPath();
  ctx.arc(knobX, trackY + trackH / 2, knobR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // the whole track row takes clicks too (a click jumps the knob there)
  gc.hitAreas.push({
    x: trackX - knobR, y: trackY - knobR - 6 * s,
    w: trackW + knobR * 2, h: trackH + knobR * 2 + 12 * s,
    noCursor: true,
    action: () => { if (inputOpen(gc)) setDial(dialFromX(gc.mouseX)); },
  });

  // ── the four words ─────────────────────────────────────────────────────────
  const bw = 190 * s, bh = 60 * s, bgap = 26 * s;
  const rowW = shown32.length * bw + (shown32.length - 1) * bgap;
  const bx0 = cx - rowW / 2;
  const by  = topBoxY + topBoxHeight * 0.62;

  shown32.forEach((word, i) => {
    drawChoice(gc, word, bx0 + i * (bw + bgap), by, bw, bh, () => {
      if (!inputOpen(gc)) return;
      if (word === word32 && audible32) {
        hush();
        state.levelSubPhase = 'win';
        gc.render();
        return;
      }
      fails32++;
      const lucky = word === word32;
      if (lucky) say(gc, LUCKY);
      wrong(gc);
      const rung = LADDER[Math.min(fails32 - 1, LADDER.length - 1)];
      setTimeout(() => {
        if (gc.state.currentLevel !== 32 || gc.state.currentScreen !== 'level') return;
        if (gc.state.levelSubPhase !== 'active' || gc.state.gameOver) return;
        say(gc, rung);
        gc.render();
      }, lucky ? 1900 : 700);
    }, { fontSize: 21 });
  });

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `${Math.round(12 * s)}px ${bodyFont}`;
  ctx.fillText('Turn it up if you cannot hear it.', cx, topBoxY + topBoxHeight * 0.90, topBoxWidth * 0.9);

  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    word: word32, shown: shown32.slice(), dial: dial32, audible: audible32,
    spoken: spoken32, fails: fails32, t: elapsed, hall: gc.sounds.getMasterVolume(),
  };
};
