import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale }     from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock } from './lateralHelpers';

// ── Q34 — The Fourth Heart ────────────────────────────────────────────────────
// "One of these does not belong with the others." The grid of Institute seals is
// perfectly uniform. The thing that does not belong is in the HUD: a fourth heart.
// Nothing on this level costs a heart. Replaces the O-among-0s grid.

const LINES = {
  0: 'One of these does not belong with the others. I did not say which these.',
  1: 'The grid is uniform. I checked.',
  2: 'The grid is uniform. I checked. Look at what is not on the paper.',
  3: 'How many hearts do you have? How many should you have?',
  4: 'The fourth heart is not yours. Click it. It will not mind.',
};

let stage34 = 0;
let sealClicks34 = 0;
let popAt34 = 0;
const clock34 = { last: 0, elapsed: 0 };

const drawSeal = (gc: GameContext, cx: number, cy: number, r: number) => {
  const { ctx, monoFont, displayFont } = gc;
  ctx.save();
  ctx.strokeStyle = '#B0892F';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([3.4, 2.2]);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(176,137,47,0.10)';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#B0892F';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(r * 0.28)}px ${monoFont}`;
  ctx.fillText('ILC', cx, cy - r * 0.12);
  ctx.font = `italic ${Math.round(r * 0.24)}px ${displayFont}`;
  ctx.fillText('certified', cx, cy + r * 0.24);
  ctx.restore();
};

export const drawLevel34 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(gc, 'AUDITED.', 'You had three hearts. You have always had three hearts. Corporate would like the fourth back.', 35);
    return;
  }
  if (freshEntry(gc)) { stage34 = 0; sealClicks34 = 0; popAt34 = 0; clock34.last = 0; clock34.elapsed = 0; say(gc, LINES[0]); }
  state.hudExtraHeart = !popAt34;

  const { elapsed } = levelClock(gc, clock34);
  const bump = (st: number) => { if (st > stage34) { stage34 = st; say(gc, LINES[st as keyof typeof LINES]); } };
  if (elapsed >= 20) bump(2);
  if (elapsed >= 40) bump(3);
  if (elapsed >= 60) bump(4);

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('I T E M   3 4', cx, topBoxY + topBoxHeight * 0.09);
  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(28 * s)}px ${displayFont}`;
  ctx.fillText('One of these does not belong with the others.', cx, topBoxY + topBoxHeight * 0.20, topBoxWidth * 0.9);

  // 6×4 grid of identical seals
  const cols = 6, rows = 4;
  const r = Math.min(topBoxWidth * 0.026, topBoxHeight * 0.075);
  const gapX = topBoxWidth * 0.10, gapY = topBoxHeight * 0.17;
  const gridW = (cols - 1) * gapX, gridH = (rows - 1) * gapY;
  const gx0 = cx - gridW / 2, gy0 = topBoxY + topBoxHeight * 0.38;
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols, rr = Math.floor(i / cols);
    const sx = gx0 + c * gapX, sy = gy0 + rr * gapY;
    drawSeal(gc, sx, sy, r);
    gc.hitAreas.push({ x: sx - r, y: sy - r, w: r * 2, h: r * 2, noCursor: true, action: () => {
      if (!inputOpen(gc)) return;
      sealClicks34++;
      if (sealClicks34 === 1) { if (stage34 < 1) { stage34 = 1; say(gc, LINES[1]); } }
      else bump(2);
    } });
  }

  // hearts are clickable today: the real ones say "leave it", the fourth deflates
  gc.afterPanel = (g) => {
    const hearts = g.chrome.hearts ?? [];
    hearts.forEach((hr, i) => {
      g.hitAreas.push({ x: hr.x - 4, y: hr.y - 4, w: hr.w + 8, h: hr.h + 8, noCursor: true, action: () => {
        if (!inputOpen(g)) return;
        if (i === 3 && !popAt34) {
          popAt34 = performance.now();
          g.sounds.ui('thud');
          g.state.hudExtraHeart = false;
          setTimeout(() => { if (g.state.currentLevel === 34 && g.state.levelSubPhase === 'active') { g.state.levelSubPhase = 'win'; g.render(); } }, 480);
        } else if (i < 3) {
          say(g, 'That one is yours. Leave it.');
        }
      } });
    });
    if (popAt34 && hearts[3]) {
      const age = performance.now() - popAt34;
      if (age < 900) {
        const hr = hearts[3];
        g.ctx.save();
        g.ctx.globalAlpha = Math.max(0, 1 - age / 900);
        g.ctx.fillStyle = t.fgDim;
        g.ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
        g.ctx.textAlign = 'center';
        g.ctx.fillText('pfft', hr.x + hr.w / 2, hr.y - 6 - age / 40);
        g.ctx.restore();
      }
    }
  };
};
