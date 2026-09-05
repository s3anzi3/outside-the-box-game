import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, drawSeal, drawMedallion, drawHeart, roundRect, uiScale } from '../renderer';
import { say, wrong, inputOpen, levelClock } from './lateralHelpers';

// ── Q50 — Your Name ───────────────────────────────────────────────────────────
// The final item asks the one question the candidate answered before the exam
// began: the name typed into Q1. Anything else is not the name on file, costs a
// heart and clears the field. The right name opens the CORRECT screen and then
// the certificate: tier-coloured double border, spinning medallion, elapsed
// time, and a serial line that records the standing you finished on.

const WRONG_LINE = 'That is not the name you gave me. I have it written down.';
const WIN_LINE   = 'Certified. Corporate would like to remind you this is not a real certificate.';

// Module state (reset on fresh entry, in drawNameRecall).
let fails50 = 0;
const clock50 = { last: 0, elapsed: 0 };

// ── Certificate content per tier ──────────────────────────────────────────────
const TIERS = {
  gold: {
    label:       'GOLD',
    color:       '#C79A2E',
    colorDim:    'rgba(199,154,46,0.34)',
    title:       'Distinguished Excellence Award',
    timeLabel:   'Elite Completion',
    body: [
      'This certificate stands as irrefutable proof of your undeniable',
      'critical thinking and problem solving prowess.',
      'Employers should be drooling at the thought of you joining their team.',
    ],
    footnote: 'Completed in record time. Outstanding.',
  },
  silver: {
    label:       'SILVER',
    color:       '#8C97A0',
    colorDim:    'rgba(140,151,160,0.34)',
    title:       'Certificate of Achievement',
    timeLabel:   'Strong Completion',
    body: [
      'This certificate is proof of your undeniable critical thinking',
      'and problem solving skills.',
      'Any employer would be lucky, truly lucky, to have you on their team.',
    ],
    footnote: 'Solid performance. Well earned.',
  },
  bronze: {
    label:       'BRONZE',
    color:       '#B0703A',
    colorDim:    'rgba(176,112,58,0.34)',
    title:       'Certificate of Completion',
    timeLabel:   'Completion',
    body: [
      'This certificate is proof that you possess critical thinking',
      'and problem solving skills.',
      'The right employer will recognise your potential. Keep going.',
    ],
    footnote: 'Finished is finished. That counts.',
  },
} as const;

type Tier = keyof typeof TIERS;

function getTier(finalMs: number): Tier {
  const minutes = finalMs / 60000;
  if (minutes < 20) return 'gold';
  if (minutes < 28) return 'silver';
  return 'bronze';
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatDate(): string {
  const d = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function serialFor(name: string): string {
  const n = Math.abs(Array.from(name).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 9000 + 1000;
  return `No. OTB-50-${n}`;
}

// Shrinks font px until the text fits maxW.
function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, px: number, family: string, weight = ''): number {
  ctx.font = `${weight} ${px}px ${family}`;
  const wdt = ctx.measureText(text).width;
  return wdt <= maxW ? px : Math.max(10, Math.floor(px * maxW / wdt));
}

// Small diamond ornaments at the inner-border corners.
function drawCertCorners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, s: number) {
  const d = 7 * s;
  ctx.fillStyle = color;
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-d / 2, -d / 2, d, d);
    ctx.restore();
  }
}

// A faux handwritten signature scribble.
function drawSignature(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, s: number) {
  const u = 16 * s;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, 1.8 * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 2.6 * u, cy + 0.3 * u);
  ctx.bezierCurveTo(cx - 1.8 * u, cy - 1.2 * u, cx - 1.2 * u, cy + 1.0 * u, cx - 0.6 * u, cy - 0.2 * u);
  ctx.bezierCurveTo(cx - 0.2 * u, cy - 1.1 * u, cx + 0.2 * u, cy + 0.9 * u, cx + 0.8 * u, cy - 0.1 * u);
  ctx.bezierCurveTo(cx + 1.4 * u, cy - 1.1 * u, cx + 2.0 * u, cy + 0.6 * u, cx + 2.7 * u, cy - 0.3 * u);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 0.4 * u, cy + 0.7 * u);
  ctx.lineTo(cx + 1.7 * u, cy - 0.5 * u);
  ctx.stroke();
  ctx.restore();
}

// The serial line, right-aligned: STANDING AT COMPLETION <hearts>  ·  No. OTB-50-####
// The hearts are the HUD's own vector heart, so the diploma records what the
// candidate finished on: full for the hearts still held, faded for the spent ones.
function drawStandingLine(gc: GameContext, rightX: number, y: number) {
  const { ctx, state, monoFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);

  const label = 'STANDING AT COMPLETION';
  const tail  = `   ·   ${serialFor(state.playerName)}`;
  const heartSize = Math.round(11 * s);
  const heartStep = heartSize + Math.round(3 * s);
  const heartsW   = heartStep * 3;
  const gap = 7 * s;

  ctx.font = `${Math.round(10 * s)}px ${monoFont}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const labelW = ctx.measureText(label).width;
  const tailW  = ctx.measureText(tail).width;

  let mx = rightX - (labelW + gap + heartsW + tailW);
  ctx.fillStyle = t.fgDim;
  ctx.fillText(label, mx, y);
  mx += labelW + gap;

  for (let i = 0; i < 3; i++) {
    const hcx = mx + heartStep * i + heartSize / 2;
    ctx.save();
    if (i >= state.lives) ctx.globalAlpha = 0.35;   // the mock fades the spent hearts
    drawHeart(ctx, hcx, y, heartSize, t.accent, t.accentDeep, 1);
    ctx.restore();
  }
  mx += heartsW;

  ctx.fillStyle = t.fgDim;
  ctx.fillText(tail, mx, y);
}

// ── The diploma (full-screen presentation) ────────────────────────────────────
function drawCertificate(gc: GameContext) {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const tier = getTier(state.examFinalMs);
  const tc = TIERS[tier];

  // backdrop focus
  ctx.fillStyle = state.darkMode ? 'rgba(0,0,0,0.34)' : 'rgba(40,30,15,0.12)';
  ctx.fillRect(0, 0, w, h);

  const certW = Math.min(w * 0.66, 780);
  const certH = Math.min(h * 0.74, 560);
  const certX = (w - certW) / 2;
  const certY = (h - certH) / 2 - h * 0.03;
  const cx = certX + certW / 2;
  const Y = (f: number) => certY + certH * f;

  // paper
  ctx.save();
  ctx.shadowColor = 'rgba(40,25,5,0.40)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, certX, certY, certW, certH, 4);
  ctx.fillStyle = state.darkMode ? '#221C13' : '#FCF9F0';
  ctx.fill();
  ctx.restore();

  // tier-coloured double border + corner diamonds
  ctx.strokeStyle = tc.color;
  ctx.lineWidth = 3;
  roundRect(ctx, certX + 8, certY + 8, certW - 16, certH - 16, 2);
  ctx.stroke();
  ctx.strokeStyle = tc.colorDim;
  ctx.lineWidth = 1;
  roundRect(ctx, certX + 14, certY + 14, certW - 28, certH - 28, 2);
  ctx.stroke();
  drawCertCorners(ctx, certX + 8, certY + 8, certW - 16, certH - 16, tc.color, s);

  // faint seal watermark behind the text
  ctx.save();
  ctx.globalAlpha = 0.05;
  drawSeal(gc, cx, Y(0.55), certH * 0.3, { color: tc.color });
  ctx.restore();

  // date (left) and standing + serial (right) along the top
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(10 * s)}px ${monoFont}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(formatDate(), certX + 28, Y(0.075));
  drawStandingLine(gc, certX + certW - 28, Y(0.075));

  // institute eyebrow
  ctx.fillStyle = tc.color;
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.fillText('INSTITUTE OF LATERAL COGNITION', cx, Y(0.14));

  // spinning award medallion (the 3D hero)
  drawMedallion(gc, cx, Y(0.235), certH * 0.085);

  // tier badge
  ctx.fillStyle = tc.color;
  ctx.font = `bold ${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText(`✦   ${tc.label} TIER   ✦`, cx, Y(0.34));

  // title (shrunk to fit)
  ctx.fillStyle = t.ink;
  const titlePx = fitText(ctx, tc.title, certW * 0.84, Math.round(30 * s), displayFont, 'bold');
  ctx.font = `bold ${titlePx}px ${displayFont}`;
  ctx.fillText(tc.title, cx, Y(0.42));

  // certify line
  ctx.fillStyle = t.fgDim;
  ctx.font = `italic ${Math.round(14 * s)}px ${displayFont}`;
  ctx.fillText('This is to certify that', cx, Y(0.50));

  // candidate name + flourish
  ctx.fillStyle = tc.color;
  const namePx = fitText(ctx, state.playerName, certW * 0.7, Math.round(40 * s), displayFont, 'bold');
  ctx.font = `bold ${namePx}px ${displayFont}`;
  ctx.fillText(state.playerName, cx, Y(0.585));
  const nameW = Math.min(ctx.measureText(state.playerName).width, certW * 0.7);
  ctx.strokeStyle = tc.colorDim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - nameW / 2 - 12, Y(0.63));
  ctx.lineTo(cx + nameW / 2 + 12, Y(0.63));
  ctx.stroke();

  // body
  ctx.fillStyle = t.fgMid;
  const bodyPx = Math.round(12.5 * s);
  ctx.font = `${bodyPx}px ${bodyFont}`;
  tc.body.forEach((line, i) => ctx.fillText(line, cx, Y(0.685) + i * (bodyPx * 1.5), certW * 0.82));

  // divider
  ctx.strokeStyle = tc.colorDim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(certX + certW * 0.12, Y(0.80));
  ctx.lineTo(certX + certW * 0.88, Y(0.80));
  ctx.stroke();

  // grade + time
  ctx.fillStyle = tc.color;
  ctx.font = `bold ${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText(`${tc.timeLabel.toUpperCase()}    ·    ${formatTime(state.examFinalMs)}`, cx, Y(0.845));

  // footnote
  ctx.fillStyle = t.fgDim;
  ctx.font = `italic ${Math.round(11 * s)}px ${displayFont}`;
  ctx.fillText(tc.footnote, cx, Y(0.885));

  // signatures
  const sigY = Y(0.95);
  const lx = certX + certW * 0.27;
  const rx = certX + certW * 0.73;
  drawSignature(ctx, lx, sigY - 14 * s, tc.color, s);
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(lx - 72 * s, sigY); ctx.lineTo(lx + 72 * s, sigY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(rx - 72 * s, sigY); ctx.lineTo(rx + 72 * s, sigY); ctx.stroke();
  drawSignature(ctx, rx, sigY - 14 * s, tc.color, s);
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(9.5 * s)}px ${monoFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CHIEF EXAMINER', lx, sigY + 6);
  ctx.fillText('REGISTRAR', rx, sigY + 6);

  // main menu
  const btnW = Math.min(certW * 0.34, 240);
  const btnH = Math.max(42, h * 0.058);
  drawButton(gc, 'MAIN MENU', cx - btnW / 2, certY + certH + h * 0.025, btnW, btnH, () => {
    state.currentScreen = 'mainmenu';
    state.examStartTime = 0;
    gc.resetPlayerName();
    gc.render();
  }, 18);
}

// The examiner's closing remark, drawn on the CORRECT screen. The engine hides
// the examiner panel for the whole level-50 endgame, so if the panel is not on
// screen (gc.chrome.remarks is missing) the level draws the remark itself, with
// the same typewriter reveal the panel uses.
function drawWinRemark(gc: GameContext) {
  if (gc.chrome.remarks) return;   // the real panel is up and already says it
  const { ctx, state, bodyFont, monoFont } = gc;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const cx = w / 2;

  const lines = state.guideLines && state.guideLines.length ? state.guideLines : [WIN_LINE];
  const totalChars = lines.reduce((sum, line) => sum + line.length, 0);
  const isTyping = state.guideReveal < totalChars;

  let charsLeft = Math.max(0, state.guideReveal);
  const shown: string[] = [];
  for (const line of lines) {
    if (charsLeft <= 0) break;
    shown.push(line.slice(0, Math.min(charsLeft, line.length)));
    charsLeft -= line.length;
  }
  if (shown.length && (isTyping || state.guideCursor)) shown[shown.length - 1] += ' |';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.fillText("EXAMINER'S REMARKS", cx, h * 0.775);

  ctx.fillStyle = t.fg;
  ctx.font = `${Math.round(16 * s)}px ${bodyFont}`;
  const gapY = 26 * s;
  shown.forEach((line, i) => ctx.fillText(line, cx, h * 0.825 + i * gapY, w * 0.7));
}

// ── Win reveal (full-screen) ──────────────────────────────────────────────────
function drawWin(gc: GameContext) {
  const { ctx, state, displayFont, bodyFont } = gc;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const cx = w / 2;

  if (state.winChimeFor !== 50) {
    state.winChimeFor = 50;
    gc.sounds.ui('seal');
    say(gc, WIN_LINE);
  }

  ctx.fillStyle = t.pass;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(56 * s)}px ${displayFont}`;
  ctx.fillText('CORRECT.', cx, h * 0.34);

  ctx.fillStyle = t.fgMid;
  ctx.font = `${Math.round(22 * s)}px ${bodyFont}`;
  ctx.fillText(`That is right. You are ${state.playerName}.`, cx, h * 0.46, w * 0.7);

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(15 * s)}px ${bodyFont}`;
  ctx.fillText('Examination complete. Your certificate awaits.', cx, h * 0.53, w * 0.7);

  const btnW = Math.min(w * 0.32, 300);
  const btnH = Math.max(48, h * 0.07);
  drawButton(gc, 'VIEW CERTIFICATE  →', cx - btnW / 2, h * 0.62, btnW, btnH, () => {
    state.levelSubPhase = 'certificate';
    gc.render();
  }, 20);

  gc.afterPanel = drawWinRemark;
}

// ── Final question (in the exam-paper frame) ──────────────────────────────────
function drawNameRecall(gc: GameContext) {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t = getTheme(state);
  const s = uiScale(ctx);
  const cx = topBoxX + topBoxWidth / 2;

  if (state.levelSubPhase !== 'active') {
    state.nameInput = '';
    state.nameFocused = false;
    state.winChimeFor = -1;
    state.levelSubPhase = 'active';
    fails50 = 0;
    clock50.last = 0;
    clock50.elapsed = 0;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = t.accent;
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText('FINAL ITEM  ·  50 OF 50', cx, topBoxY + topBoxHeight * 0.12);

  ctx.fillStyle = t.ink;
  ctx.font = `bold ${Math.round(26 * s)}px ${displayFont}`;
  ctx.fillText('One last question, candidate.', cx, topBoxY + topBoxHeight * 0.25);
  ctx.font = `bold ${Math.round(22 * s)}px ${displayFont}`;
  ctx.fillText('What is your name?', cx, topBoxY + topBoxHeight * 0.37);

  // input
  const inputW = topBoxWidth * 0.5;
  const inputH = Math.max(46, topBoxHeight * 0.13);
  const inputX = cx - inputW / 2;
  const inputY = topBoxY + topBoxHeight * 0.46;
  roundRect(ctx, inputX, inputY, inputW, inputH, 5);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = state.nameFocused ? t.accent : t.hairline;
  ctx.lineWidth = state.nameFocused ? 3 : 1.5;
  ctx.stroke();

  const displayText = state.nameInput.length > 0
    ? state.nameInput
    : state.nameFocused ? '' : 'Type your answer…';
  ctx.fillStyle = state.nameInput.length > 0 ? t.ink : t.fgDim;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(22 * s)}px ${bodyFont}`;
  ctx.fillText(displayText, inputX + 16, inputY + inputH / 2, inputW - 32);

  if (state.nameFocused) {
    const measured = ctx.measureText(state.nameInput).width;
    const cursorX = inputX + 16 + Math.min(measured, inputW - 32);
    // pause-aware blink: the caret holds still while the exam is suspended
    const blink = Math.floor(clock50.elapsed / 0.53) % 2 === 0;
    if (blink) {
      ctx.strokeStyle = t.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, inputY + inputH * 0.22);
      ctx.lineTo(cursorX, inputY + inputH * 0.78);
      ctx.stroke();
    }
  }

  gc.hitAreas.push({
    x: inputX, y: inputY, w: inputW, h: inputH,
    action: () => { state.nameFocused = true; gc.render(); },
  });

  const submitW = Math.min(topBoxWidth * 0.3, 220);
  const submitH = Math.max(44, topBoxHeight * 0.12);
  drawButton(gc, 'SUBMIT →', cx - submitW / 2, topBoxY + topBoxHeight * 0.66, submitW, submitH, () => {
    if (!inputOpen(gc)) return;
    const typed = state.nameInput.trim().toLowerCase();
    const correct = state.playerName.toLowerCase();
    state.nameFocused = false;
    if (typed === correct) {
      state.examFinalMs = state.examStartTime > 0 ? performance.now() - state.examStartTime : 0;
      state.levelSubPhase = 'win';
      gc.render();
    } else {
      state.nameInput = '';
      fails50++;
      say(gc, WRONG_LINE);
      wrong(gc);
    }
  }, 20);
}

export const drawLevel50 = (gc: GameContext) => {
  const { state } = gc;

  // Pause-aware level clock: it only advances on the question screen and stops
  // dead while the exam is suspended.
  levelClock(gc, clock50);

  if (state.levelSubPhase === 'certificate') drawCertificate(gc);
  else if (state.levelSubPhase === 'win') drawWin(gc);
  else drawNameRecall(gc);

  // Test hook: internals only. The level is still played with real input.
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    t: clock50.elapsed,
    typed: state.nameInput,
    focused: state.nameFocused,
    fails: fails50,
    registered: state.playerName,
    tier: getTier(state.examFinalMs),
    standing: state.lives,
    phase: state.levelSubPhase,
  };
};
