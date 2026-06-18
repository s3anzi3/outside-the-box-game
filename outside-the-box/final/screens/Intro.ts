import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { drawButton, drawDocumentBox, uiScale } from '../renderer';

// Pre-wrapped lines.  These are used both for the typing animation (via
// resolveGuideLines() in main.ts) and for the actual on-screen layout.
export const INTRO_LINES: string[] = [
  "Welcome, candidate.",
  "",
  "The world is drowning in AI slop.  It dulls minds and blurs the line",
  "between those who can think for themselves and those who outsource",
  "'2 + 2' to a chatbot.",
  "",
  "This rot has bled into the job market.  Every applicant calls themselves",
  "a 'critical thinker' or a 'unique problem solver,' yet few can prove it —",
  "they expect employers to take their word, as if their intellect rivals",
  "Socrates himself.",
  "",
  "The Outside-the-Box exam clears that fog.  Pass it and you earn a",
  "certificate — ranked Bronze, Silver, or Gold — that actually measures",
  "how well you think.",
  "",
  "Wear it on every résumé.  Employers regard it as undeniable proof",
  "you have a brain.",
  "",
  "Good luck.  Try not to embarrass yourself.",
];

export const drawIntro = (gc: GameContext) => {
  const { ctx, state, monoFont, bodyFont } = gc;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const t = getTheme(state);
  const s = uiScale(ctx);

  // ── Full-screen briefing document ────────────────────────────────────────
  const px = w * 0.08;
  const py = h * 0.07;
  const pw = w - px * 2;
  const ph = h - py * 2;

  drawDocumentBox(gc, px, py, pw, ph, { title: 'Office of the Chief Examiner' });

  // ── Examiner sprite (top-left) ───────────────────────────────────────────
  const robotCX    = px + pw * 0.09;
  const spriteSize = Math.min(pw * 0.07, 76);
  const spriteX    = robotCX - spriteSize / 2;
  const spriteY    = py + ph * 0.12;
  if (gc.playerDownLoaded) {
    ctx.drawImage(gc.playerDownImg, spriteX, spriteY, spriteSize, spriteSize);
  }
  ctx.fillStyle    = t.accent;
  ctx.font         = `${Math.round(10 * s)}px ${monoFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('EXAMINER', robotCX, spriteY + spriteSize + 6);

  // ── Memo header ──────────────────────────────────────────────────────────
  const speechX = px + pw * 0.19;
  ctx.fillStyle    = t.fgMid;
  ctx.font         = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MEMORANDUM   ·   RE: YOUR CERTIFICATION', speechX, py + ph * 0.115);
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(speechX, py + ph * 0.155);
  ctx.lineTo(px + pw - pw * 0.06, py + ph * 0.155);
  ctx.stroke();

  // ── Typewriter body ──────────────────────────────────────────────────────
  const totalChars = INTRO_LINES.reduce((s, l) => s + l.length, 0);
  const isTyping   = state.guideReveal < totalChars;

  let charsLeft = Math.max(0, state.guideReveal);
  const display: string[] = [];
  for (const line of INTRO_LINES) {
    if (charsLeft <= 0) {
      display.push('');
      continue;
    }
    const shown = Math.min(charsLeft, line.length);
    display.push(line.slice(0, shown));
    charsLeft -= shown;
  }

  // Append blinking cursor on the last visible line
  let cursorLineIdx = -1;
  for (let i = display.length - 1; i >= 0; i--) {
    if (display[i].length > 0 || (i > 0 && display[i - 1].length > 0)) {
      cursorLineIdx = i;
      break;
    }
  }
  if (cursorLineIdx >= 0 && (isTyping || state.guideCursor)) {
    display[cursorLineIdx] += ' |';
  }

  // Size lines to always fit between the header and the button row
  const bodyTop    = py + ph * 0.19;
  const bodyBottom = py + ph * 0.80;
  const lineGap    = Math.min(30, (bodyBottom - bodyTop) / INTRO_LINES.length);
  const fontPx     = Math.max(12, Math.min(20, Math.round(lineGap * 0.64)));
  const textMaxW   = px + pw - speechX - pw * 0.06;

  ctx.fillStyle    = t.fg;
  ctx.font         = `${fontPx}px ${bodyFont}`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  for (let i = 0; i < display.length; i++) {
    ctx.fillText(display[i], speechX, bodyTop + i * lineGap, textMaxW);
  }

  // ── BEGIN button (only after typing finishes) ────────────────────────────
  if (!isTyping) {
    const btnW = 260;
    const btnH = 58;
    const btnX = w / 2 - btnW / 2;
    const btnY = py + ph - btnH - h * 0.045;
    drawButton(gc, 'BEGIN  →', btnX, btnY, btnW, btnH, () => {
      gc.sounds.stop('typing');
      state.currentScreen = 'mainmenu';
      gc.render();
    }, 22);
  } else {
    ctx.fillStyle    = t.fgDim;
    ctx.font         = `${Math.round(12 * s)}px ${monoFont}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLICK ANYWHERE TO SKIP AHEAD', w / 2, py + ph - 22);

    gc.hitAreas.push({
      x: 0, y: 0, w, h,
      noCursor: true,
      action: () => {
        state.guideReveal = totalChars;
        gc.render();
      },
    });
  }
};
