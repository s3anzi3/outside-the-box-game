import { GameContext } from '../types';
import { getTheme }    from '../theme';

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
  const { ctx, state, displayFont, bodyFont } = gc;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const t = getTheme(state);

  // ── Full-screen panel ────────────────────────────────────────────────────
  const px = w * 0.05;
  const py = h * 0.05;
  const pw = w - px * 2;
  const ph = h - py * 2;

  ctx.fillStyle = state.darkMode ? 'rgba(8,12,22,0.97)' : 'rgba(245,242,232,0.97)';
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(px, py, pw, ph);

  // ── Exam guide sprite (top-left of panel) ────────────────────────────────
  const robotCX    = px + pw * 0.10;
  const spriteSize = Math.min(pw * 0.07, 80);
  const spriteX    = robotCX - spriteSize / 2;
  const spriteY    = py + ph * 0.10;

  if (gc.playerDownLoaded) {
    ctx.drawImage(gc.playerDownImg, spriteX, spriteY, spriteSize, spriteSize);
  }
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `bold 11px ${displayFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('EXAM  GUIDE', robotCX, spriteY + spriteSize + 6);

  // ── Speech header ────────────────────────────────────────────────────────
  const speechX = px + pw * 0.20;
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `bold 14px ${displayFont}`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('EXAM GUIDE  »', speechX, py + ph * 0.10);

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

  ctx.fillStyle    = t.fg;
  ctx.font         = `20px ${bodyFont}`;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'top';
  const textY0  = py + ph * 0.18;
  const lineGap = 30;
  const textMaxW = px + pw - speechX - 30;
  for (let i = 0; i < display.length; i++) {
    ctx.fillText(display[i], speechX, textY0 + i * lineGap, textMaxW);
  }

  // ── BEGIN button (only after typing finishes) ────────────────────────────
  if (!isTyping) {
    const btnW = 240;
    const btnH = 60;
    const btnX = w / 2 - btnW / 2;
    const btnY = py + ph - btnH - h * 0.04;

    const hover = gc.mouseX >= btnX && gc.mouseX <= btnX + btnW &&
                  gc.mouseY >= btnY && gc.mouseY <= btnY + btnH;

    if (hover) {
      ctx.fillStyle = t.fg;
      ctx.fillRect(btnX, btnY, btnW, btnH);
    }
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth   = 3;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle    = hover ? (state.darkMode ? '#000' : '#fff') : t.fg;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 24px ${displayFont}`;
    ctx.fillText('BEGIN', btnX + btnW / 2, btnY + btnH / 2);

    gc.hitAreas.push({
      x: btnX, y: btnY, w: btnW, h: btnH,
      action: () => {
        gc.sounds.stop('typing');
        state.currentScreen = 'mainmenu';
        gc.render();
      },
    });
  } else {
    // While typing — show a "click anywhere to skip" hint
    ctx.fillStyle    = t.fgDim;
    ctx.font         = `12px ${bodyFont}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('click anywhere to skip ahead', w / 2, py + ph - 22);

    // Full-screen click-to-skip hit area (no pointer cursor)
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
