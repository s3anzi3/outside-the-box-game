import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';

// ── Certificate content per tier ──────────────────────────────────────────────
const TIERS = {
  gold: {
    label:       'GOLD',
    color:       '#d4b820',
    colorDim:    'rgba(212,184,32,0.35)',
    title:       'Distinguished Excellence Award',
    timeLabel:   'Elite Completion',
    body: [
      'This certificate stands as irrefutable proof of your undeniable',
      'critical thinking and problem solving prowess.',
      'Employers should be absolutely drooling at the thought of you joining their team.',
    ],
    footnote: 'Completed in record time. Outstanding.',
  },
  silver: {
    label:       'SILVER',
    color:       '#a8b8c0',
    colorDim:    'rgba(168,184,192,0.35)',
    title:       'Certificate of Achievement',
    timeLabel:   'Strong Completion',
    body: [
      'This certificate is proof of your undeniable critical thinking',
      'and problem solving skills.',
      'Any employer would be lucky — truly lucky — to have you on their team.',
    ],
    footnote: 'Solid performance. Well earned.',
  },
  bronze: {
    label:       'BRONZE',
    color:       '#cd7f32',
    colorDim:    'rgba(205,127,50,0.35)',
    title:       'Certificate of Completion',
    timeLabel:   'Completion',
    body: [
      'This certificate is proof that you possess critical thinking',
      'and problem solving skills.',
      'The right employer will recognise your potential — keep going.',
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
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Draw ──────────────────────────────────────────────────────────────────────
export const drawLevel50 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = topBoxX + topBoxWidth / 2;

  // ── Certificate screen ────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'certificate') {
    const tier = getTier(state.examFinalMs);
    const tc   = TIERS[tier];

    // Certificate box — slightly inset, leaving room below for the button
    const padX  = topBoxWidth  * 0.10;
    const padTop = topBoxHeight * 0.05;
    const certX = topBoxX + padX;
    const certY = topBoxY + padTop;
    const certW = topBoxWidth  - padX * 2;
    const certH = topBoxHeight * 0.82;   // ends before the bottom of the play area

    // Background
    ctx.fillStyle = state.darkMode ? 'rgba(10,8,0,0.85)' : 'rgba(252,248,235,0.95)';
    ctx.fillRect(certX, certY, certW, certH);

    // Outer border
    ctx.strokeStyle = tc.color;
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(certX, certY, certW, certH);
    // Inner border
    ctx.strokeStyle = tc.colorDim;
    ctx.lineWidth   = 1;
    ctx.strokeRect(certX + 6, certY + 6, certW - 12, certH - 12);

    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Tier badge
    ctx.fillStyle = tc.color;
    ctx.font      = `bold 11px ${displayFont}`;
    ctx.fillText(`✦  ${tc.label} TIER  ✦`, cx, certY + certH * 0.09);

    // Main title
    ctx.fillStyle = state.darkMode ? '#f0e8d0' : '#1a1200';
    ctx.font      = `bold 21px ${displayFont}`;
    ctx.fillText(tc.title, cx, certY + certH * 0.20);

    // Divider
    ctx.strokeStyle = tc.colorDim;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(certX + certW * 0.12, certY + certH * 0.29);
    ctx.lineTo(certX + certW * 0.88, certY + certH * 0.29);
    ctx.stroke();

    // "This certifies that"
    ctx.fillStyle = t.fgDim;
    ctx.font      = `13px ${bodyFont}`;
    ctx.fillText('This certifies that', cx, certY + certH * 0.37);

    // Player name
    ctx.fillStyle = tc.color;
    ctx.font      = `bold 28px ${displayFont}`;
    ctx.fillText(state.playerName, cx, certY + certH * 0.48);

    // Body text
    ctx.fillStyle = t.fgMid;
    ctx.font      = `13px ${bodyFont}`;
    tc.body.forEach((line, i) => {
      ctx.fillText(line, cx, certY + certH * 0.59 + i * 18, certW * 0.84);
    });

    // Divider
    ctx.strokeStyle = tc.colorDim;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(certX + certW * 0.12, certY + certH * 0.77);
    ctx.lineTo(certX + certW * 0.88, certY + certH * 0.77);
    ctx.stroke();

    // Time + footnote
    ctx.fillStyle = tc.color;
    ctx.font      = `bold 12px ${displayFont}`;
    ctx.fillText(
      `${tc.timeLabel}  •  ${formatTime(state.examFinalMs)}`,
      cx, certY + certH * 0.84,
    );

    ctx.fillStyle = t.fgDim;
    ctx.font      = `11px ${bodyFont}`;
    ctx.fillText(tc.footnote, cx, certY + certH * 0.92);

    // Main menu button — sits BELOW the certificate border
    const btnY = certY + certH + 12;
    const btnW = 160;
    const btnH = 36;
    drawButton(gc, 'MAIN MENU', cx - btnW / 2, btnY, btnW, btnH, () => {
      state.currentScreen = 'mainmenu';
      state.examStartTime = 0;
      gc.resetPlayerName();
      gc.render();
    }, 14);
    return;
  }

  // ── Win screen ────────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = t.fg;
    ctx.font      = `bold 44px ${displayFont}`;
    ctx.fillText('CORRECT.', cx, topBoxY + topBoxHeight * 0.28);

    ctx.fillStyle = t.fgMid;
    ctx.font      = `20px ${bodyFont}`;
    ctx.fillText(`That is right. You are ${state.playerName}.`, cx, topBoxY + topBoxHeight * 0.44);

    ctx.fillStyle = t.fgDim;
    ctx.font      = `15px ${bodyFont}`;
    ctx.fillText('Exam complete. Your certificate awaits.', cx, topBoxY + topBoxHeight * 0.56);

    drawButton(gc, 'VIEW CERTIFICATE  →', cx - 120, topBoxY + topBoxHeight * 0.68, 240, 48, () => {
      state.levelSubPhase = 'certificate';
      gc.render();
    }, 18);
    return;
  }

  // ── Initialise ────────────────────────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    state.nameInput    = '';
    state.nameFocused  = false;
    state.levelSubPhase = 'active';
  }

  // ── Prompt ────────────────────────────────────────────────────────────────────
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = t.fg;
  ctx.font      = `bold 26px ${displayFont}`;
  ctx.fillText('One last question, candidate.', cx, topBoxY + topBoxHeight * 0.14);

  ctx.fillStyle = t.fgMid;
  ctx.font      = `bold 22px ${displayFont}`;
  ctx.fillText('What is your name?', cx, topBoxY + topBoxHeight * 0.27);

  // ── Input box ─────────────────────────────────────────────────────────────────
  const inputW = topBoxWidth * 0.50;
  const inputH = 52;
  const inputX = cx - inputW / 2;
  const inputY = topBoxY + topBoxHeight * 0.40;

  ctx.strokeStyle = state.nameFocused
    ? state.darkMode ? '#ffffff' : '#111111'
    : t.divider;
  ctx.lineWidth = state.nameFocused ? 3 : 2;
  ctx.strokeRect(inputX, inputY, inputW, inputH);

  const displayText = state.nameInput.length > 0
    ? state.nameInput
    : state.nameFocused ? '' : 'Type your answer…';
  ctx.fillStyle    = state.nameInput.length > 0 ? t.fg : t.fgDim;
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.font         = `22px ${bodyFont}`;
  ctx.fillText(displayText, inputX + 14, inputY + inputH / 2, inputW - 28);

  // Blinking cursor
  if (state.nameFocused) {
    const measured = ctx.measureText(state.nameInput).width;
    const cursorX  = inputX + 14 + Math.min(measured, inputW - 28);
    const cursorY  = inputY + inputH * 0.20;
    const cursorH  = inputH * 0.60;
    const blink    = Math.floor(Date.now() / 530) % 2 === 0;
    if (blink) {
      ctx.strokeStyle = t.fg;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX, cursorY + cursorH);
      ctx.stroke();
    }
  }

  gc.hitAreas.push({
    x: inputX, y: inputY, w: inputW, h: inputH,
    action: () => { state.nameFocused = true; gc.render(); },
  });

  // ── Submit button ─────────────────────────────────────────────────────────────
  const submitW = 180;
  const submitH = 48;
  drawButton(gc, 'SUBMIT →', cx - submitW / 2, topBoxY + topBoxHeight * 0.61, submitW, submitH, () => {
    const typed   = state.nameInput.trim().toLowerCase();
    const correct = state.playerName.toLowerCase();
    state.nameFocused = false;
    if (typed === correct) {
      // Capture final time before transitioning
      state.examFinalMs   = state.examStartTime > 0
        ? performance.now() - state.examStartTime
        : 0;
      state.levelSubPhase = 'win';
    } else {
      gc.loseLife();
      state.nameInput = '';
    }
    gc.render();
  }, 20);
};
