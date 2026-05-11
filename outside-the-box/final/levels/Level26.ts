import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';

const TARGET_CLICKS = 100;

let cookieClicks26 = 0;
let squishUntil26  = 0;   // performance.now() timestamp; cookie scales down until then

export const drawLevel26 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Init on fresh entry ───────────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    cookieClicks26 = 0;
    squishUntil26  = 0;
    state.levelSubPhase = 'active';
  }

  // ── Prompt ────────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 26px ${displayFont}`;
  ctx.fillText(`Click the cookie ${TARGET_CLICKS} times.`, cx, topBoxY + topBoxHeight * 0.16);

  // ── The cookie ────────────────────────────────────────────────────────────
  const baseR  = Math.min(topBoxWidth, topBoxHeight) * 0.18;
  const cookieY = topBoxY + topBoxHeight * 0.55;

  const now = performance.now();
  const squishT = squishUntil26 > now ? (squishUntil26 - now) / 110 : 0;  // 110ms squish
  const r = baseR * (1 - squishT * 0.08);

  // Body
  ctx.fillStyle = '#c98a44';
  ctx.beginPath();
  ctx.arc(cx, cookieY, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5e3a13';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Chocolate chips
  ctx.fillStyle = '#3d220b';
  const chips: Array<[number, number, number]> = [
    [-0.45, -0.30, 0.10], [ 0.30, -0.40, 0.08],
    [-0.10,  0.10, 0.12], [ 0.45,  0.20, 0.09],
    [-0.35,  0.45, 0.10], [ 0.15,  0.55, 0.08],
    [ 0.55, -0.05, 0.07], [-0.55,  0.05, 0.06],
  ];
  for (const [fx, fy, fr] of chips) {
    ctx.beginPath();
    ctx.arc(cx + fx * r, cookieY + fy * r, fr * r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Counter (big number) ──────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 32px ${displayFont}`;
  ctx.fillText(`${cookieClicks26} / ${TARGET_CLICKS}`, cx, cookieY + baseR + 38);

  // ── Progress bar ──────────────────────────────────────────────────────────
  const barW = topBoxWidth * 0.42;
  const barH = 10;
  const barX = cx - barW / 2;
  const barY = cookieY + baseR + 64;
  ctx.strokeStyle = t.divider;
  ctx.lineWidth   = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle   = '#c98a44';
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * (cookieClicks26 / TARGET_CLICKS), barH - 2);

  // ── Cookie hit area — every click counts ──────────────────────────────────
  gc.hitAreas.push({
    x: cx - baseR,
    y: cookieY - baseR,
    w: baseR * 2,
    h: baseR * 2,
    action: () => {
      cookieClicks26++;
      squishUntil26 = performance.now() + 110;
      gc.sounds.play("dash", { volume: 0.18, restart: true });
      if (cookieClicks26 >= TARGET_CLICKS) {
        gc.sounds.play("correctAnswer", { volume: 0.55 });
        state.currentLevel  = 27;
        state.levelSubPhase = '';
      }
      gc.render();
    },
  });
};
