import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, uiScale } from '../renderer';

// The Main Menu, dressed as the cover sheet of an official examination booklet.
export const drawMainMenu = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t   = getTheme(state);
  const cx  = topBoxX + topBoxWidth / 2;
  const top = topBoxY;
  const H   = topBoxHeight;
  const s   = uiScale(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // eyebrow
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('CANDIDATE  EXAMINATION', cx, top + H * 0.13);

  // serif title
  ctx.fillStyle = t.ink;
  ctx.font = `bold ${Math.max(24, Math.min(54, Math.round(topBoxWidth * 0.047)))}px ${displayFont}`;
  ctx.fillText('A Test of Lateral Thinking', cx, top + H * 0.25);

  // form-field strip (mono)
  ctx.fillStyle = t.fgMid;
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('FORM No. OTB-50        SECTIONS I–V        50 ITEMS', cx, top + H * 0.39);
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText('DURATION:  UNTIMED *', cx, top + H * 0.46);

  // primary + secondary actions
  const btnW = Math.min(topBoxWidth * 0.46, 420);
  const bx   = cx - btnW / 2;

  drawButton(gc, 'BEGIN EXAMINATION', bx, top + H * 0.55, btnW, H * 0.135, () => {
    state.currentLevel  = 1;
    state.lives         = 3;
    state.paused        = false;
    state.gameOver      = false;
    state.skips         = 0;
    state.levelSubPhase = '';
    state.playMode      = 'play';
    state.examStartTime = 0;
    state.currentScreen = 'level';
    gc.render();
  }, 21);

  drawButton(gc, 'EXAMINATION GUIDELINES', bx, top + H * 0.72, btnW, H * 0.11, () => {
    state.controlsOpen = true;
    gc.render();
  }, 16);

  // footnote — the joke under the "untimed" claim
  ctx.fillStyle = t.fgDim;
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(11 * s)}px ${monoFont}`;
  ctx.fillText('* you are, in fact, being timed.', cx, top + H * 0.92);
};
