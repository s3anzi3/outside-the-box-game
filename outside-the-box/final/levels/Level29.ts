import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, drawStamp, uiScale, roundRect } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, inRect } from './lateralHelpers';

// ── Q29 — Self-Assessment ─────────────────────────────────────────────────────
// "The candidate has answered Question 29 correctly. Grade this statement."
// Two rubber stamps sit on the desk beside the paper. Stamping the statement
// INCORRECT (the honest instinct) costs a heart; stamping it CORRECT makes it
// true, because that is how grading works. Replaces the 2 + 2 × 2 riddle.

type Kind = 'INCORRECT' | 'CORRECT';
interface Impression { kind: Kind; x: number; y: number; angle: number; at: number; }

const LADDER = [
  'Grade the statement. The stamps are on the desk.',
  'You marked yourself wrong. I have recorded that you agree with me.',
  'There is a second stamp. It is green. Nobody uses it.',
  'Stamp the statement CORRECT. It becomes true when you do. That is how grading works.',
];

let fails29 = 0;
let submits29 = 0;
let drag29: { kind: Kind; dx: number; dy: number } | null = null;
let pos29: Record<Kind, { x: number; y: number }> = { INCORRECT: { x: 0, y: 0 }, CORRECT: { x: 0, y: 0 } };
let impressions29: Impression[] = [];
let solvedAt29 = 0;

const STAMP_W = 74, STAMP_H = 96;

const drawRubberStamp = (gc: GameContext, kind: Kind, x: number, y: number, lifted: boolean) => {
  const { ctx, state, monoFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const W = STAMP_W * s, H = STAMP_H * s;
  ctx.save();
  if (lifted) { ctx.translate(x + W / 2, y + H / 2); ctx.rotate(-4 * Math.PI / 180); ctx.scale(1.06, 1.06); ctx.translate(-(x + W / 2), -(y + H / 2)); }
  ctx.shadowColor = 'rgba(40,25,5,0.35)';
  ctx.shadowBlur = lifted ? 18 : 8;
  ctx.shadowOffsetY = lifted ? 16 : 6;
  // handle
  const hg = ctx.createLinearGradient(x + 26 * s, 0, x + 48 * s, 0);
  hg.addColorStop(0, '#8a5a2b'); hg.addColorStop(0.45, '#c9915a'); hg.addColorStop(1, '#8a5a2b');
  ctx.fillStyle = hg;
  roundRect(ctx, x + 26 * s, y, 22 * s, 44 * s, 8 * s); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#4a2e12'; ctx.lineWidth = 1; ctx.stroke();
  // neck + base
  ctx.fillStyle = '#5a3a1a'; roundRect(ctx, x + 19 * s, y + 42 * s, 36 * s, 12 * s, 3 * s); ctx.fill();
  const bg = ctx.createLinearGradient(0, y + 52 * s, 0, y + 82 * s);
  bg.addColorStop(0, '#3a2b22'); bg.addColorStop(1, '#241a14');
  ctx.fillStyle = bg; roundRect(ctx, x, y + 52 * s, W, 30 * s, 4 * s); ctx.fill();
  ctx.strokeStyle = '#120c08'; ctx.stroke();
  // label plate
  ctx.fillStyle = t.panel; roundRect(ctx, x + 6 * s, y + 58 * s, 62 * s, 18 * s, 2 * s); ctx.fill();
  ctx.strokeStyle = t.stroke; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = kind === 'CORRECT' ? t.pass : t.danger;
  ctx.font = `bold ${Math.round(8.5 * s)}px ${monoFont}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(kind, x + W / 2, y + 67 * s);
  // rubber face
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = kind === 'CORRECT' ? '#3E6B4F' : '#9a2b25';
  roundRect(ctx, x + 2 * s, y + 82 * s, 70 * s, 10 * s, 2 * s); ctx.fill();
  ctx.restore();
};

export const drawLevel29 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight, paperX, paperW, paperY } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'SELF-CERTIFIED.', 'The statement was false until you stamped it. Corporate calls this empowerment.', 30);
    return;
  }
  if (freshEntry(gc)) {
    fails29 = 0; submits29 = 0; drag29 = null; impressions29 = []; solvedAt29 = 0;
    const deskX = paperX + paperW + Math.round(20 * s);
    pos29 = { INCORRECT: { x: deskX, y: paperY + Math.round(80 * s) }, CORRECT: { x: deskX, y: paperY + Math.round(210 * s) } };
    say(gc, LADDER[0]);
  }

  // ── paper content ──────────────────────────────────────────────────────────
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('S E L F - A S S E S S M E N T', cx, topBoxY + topBoxHeight * 0.10);

  const boxW = Math.min(topBoxWidth * 0.69, 720 * s), boxH = topBoxHeight * 0.30;
  const boxX = cx - boxW / 2, boxY = topBoxY + topBoxHeight * 0.20;
  ctx.save();
  ctx.shadowColor = state.darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(60,45,20,0.18)';
  ctx.shadowBlur = 9; ctx.shadowOffsetY = 3;
  ctx.fillStyle = solvedAt29 ? (state.darkMode ? 'rgba(95,166,124,0.18)' : 'rgba(62,107,79,0.10)') : t.bg;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.restore();
  ctx.strokeStyle = solvedAt29 ? t.pass : t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(29 * s)}px ${displayFont}`;
  ctx.fillText('The candidate has answered Question 29', cx, boxY + boxH * 0.38, boxW - 40);
  ctx.fillText('correctly.', cx, boxY + boxH * 0.70, boxW - 40);

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('G R A D E   T H I S   S T A T E M E N T .', cx, topBoxY + topBoxHeight * 0.60);

  drawButton(gc, 'SUBMIT FOR GRADING', cx - 100 * s, topBoxY + topBoxHeight * 0.76, 200 * s, 44 * s, () => {
    if (!inputOpen(gc)) return;
    submits29++;
    if (submits29 === 1) { say(gc, 'The examiner is on break. Grade it yourself.'); return; }
    fails29++;
    gc.sounds.ui('deny');
    gc.loseLife();
    say(gc, LADDER[Math.min(fails29, LADDER.length - 1)]);
  }, 13);

  // impressions already on the paper
  for (const imp of impressions29) {
    const age = Math.min(1, (performance.now() - imp.at) / 500);
    const scale = 1.5 - 0.5 * (1 - Math.pow(1 - age, 3));
    ctx.save();
    ctx.translate(imp.x, imp.y); ctx.scale(scale, scale); ctx.translate(-imp.x, -imp.y);
    drawStamp(gc, imp.x, imp.y, imp.kind, imp.kind === 'CORRECT' ? t.pass : t.danger, { angle: imp.angle, fontPx: 34, alpha: 0.92 });
    ctx.restore();
  }

  // desk label
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(9 * s)}px ${monoFont}`;
  ctx.textAlign = 'center';
  ctx.fillText('GRADING', pos29.INCORRECT.x + STAMP_W * s / 2, paperY + 50 * s);
  ctx.fillText('STAMPS', pos29.INCORRECT.x + STAMP_W * s / 2, paperY + 62 * s);

  // ── drag logic (polled every frame) ────────────────────────────────────────
  const W = STAMP_W * s, H = STAMP_H * s;
  if (inputOpen(gc)) {
    if (!drag29 && gc.mouseDown) {
      for (const kind of ['CORRECT', 'INCORRECT'] as Kind[]) {
        const p = pos29[kind];
        if (inRect(gc.mouseX, gc.mouseY, { x: p.x, y: p.y, w: W, h: H })) { drag29 = { kind, dx: gc.mouseX - p.x, dy: gc.mouseY - p.y }; break; }
      }
    }
    if (drag29 && gc.mouseDown) {
      pos29[drag29.kind] = { x: gc.mouseX - drag29.dx, y: gc.mouseY - drag29.dy };
    }
    if (drag29 && !gc.mouseDown) {
      const kind = drag29.kind;
      const p = pos29[kind];
      const rubberX = p.x + W / 2, rubberY = p.y + H - 8 * s;
      const onStatement = rubberX >= boxX && rubberX <= boxX + boxW && rubberY >= boxY - 12 && rubberY <= boxY + boxH + 12;
      drag29 = null;
      const deskX = paperX + paperW + Math.round(20 * s);
      pos29[kind] = kind === 'INCORRECT' ? { x: deskX, y: paperY + Math.round(80 * s) } : { x: deskX, y: paperY + Math.round(210 * s) };
      if (onStatement) {
        const angle = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 5);
        impressions29.push({ kind, x: rubberX, y: rubberY - 10 * s, angle, at: performance.now() });
        gc.sounds.ui('thud');
        if (kind === 'INCORRECT') {
          fails29++;
          gc.loseLife();
          say(gc, fails29 === 1 ? 'Honesty noted. Standing reduced.' : LADDER[Math.min(fails29, LADDER.length - 1)]);
          if (fails29 === 1) setTimeout(() => {
            const still = gc.state.guideLines && gc.state.guideLines[0] === 'Honesty noted. Standing reduced.';
            if (still && gc.state.currentLevel === 29 && gc.state.levelSubPhase === 'active') { say(gc, LADDER[1]); gc.render(); }
          }, 3200);
        } else {
          solvedAt29 = performance.now();
          setTimeout(() => { if (gc.state.currentLevel === 29 && gc.state.levelSubPhase === 'active') { gc.state.levelSubPhase = 'win'; gc.render(); } }, 500);
        }
      }
    }
  } else if (drag29 && !gc.mouseDown) {
    drag29 = null;
  }

  for (const kind of ['INCORRECT', 'CORRECT'] as Kind[]) {
    const p = pos29[kind];
    if (drag29 && drag29.kind === kind) continue;
    drawRubberStamp(gc, kind, p.x, p.y, false);
    gc.hitAreas.push({ x: p.x, y: p.y, w: W, h: H, action: () => {}, noCursor: false });
  }
  if (drag29) { const p = pos29[drag29.kind]; drawRubberStamp(gc, drag29.kind, p.x, p.y, true); }
};
