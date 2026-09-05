import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, uiScale } from '../renderer';
import { LEVEL_COUNT } from '../levelData';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

// Level Select, dressed as a candidate answer sheet: numbered bubbles in a
// 10-column grid, one Act per row.
export const drawLevelSelect = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = topBoxX + topBoxWidth / 2;
  const t  = getTheme(state);
  const s  = uiScale(ctx);

  // heading
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.max(24, Math.min(38, Math.round(topBoxWidth * 0.034)))}px ${displayFont}`;
  ctx.fillText('Candidate Answer Sheet', cx, topBoxY + topBoxHeight * 0.09);

  ctx.fillStyle = t.fgDim;
  ctx.font      = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText('MARK AN ITEM TO ATTEMPT IT', cx, topBoxY + topBoxHeight * 0.155);

  // grid metrics (kept close to the original so spacing stays comfortable)
  const cols  = 10;
  const tileW = topBoxWidth  * 0.072;
  const tileH = topBoxHeight * 0.116;
  const hGap  = (topBoxWidth * 0.86 - tileW * cols) / (cols - 1);
  const vGap  = topBoxHeight * 0.030;
  const gridW = tileW * cols + hGap * (cols - 1);
  const gridX = cx - gridW / 2;
  const gridY = topBoxY + topBoxHeight * 0.24;
  const bubbleR = Math.min(tileW, tileH) * 0.40;

  for (let i = 0; i < LEVEL_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tx  = gridX + col * (tileW + hGap);
    const ty  = gridY + row * (tileH + vGap);
    const lvl = i + 1;
    const bx  = tx + tileW / 2;
    const by  = ty + tileH / 2;

    // Act numeral at the start of each row
    if (col === 0) {
      ctx.fillStyle    = t.fgMid;
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'middle';
      ctx.font         = `${Math.round(11 * s)}px ${monoFont}`;
      ctx.fillText(ROMAN[row] ?? '', gridX - bubbleR - 8, by);
    }

    const hovered = gc.mouseX >= tx && gc.mouseX <= tx + tileW &&
                    gc.mouseY >= ty && gc.mouseY <= ty + tileH;

    // bubble
    ctx.beginPath();
    ctx.arc(bx, by, bubbleR, 0, Math.PI * 2);
    ctx.fillStyle = hovered ? t.accent : t.bg;
    ctx.fill();
    ctx.strokeStyle = hovered ? t.accentDeep : t.hairline;
    ctx.lineWidth   = hovered ? 2 : 1.5;
    ctx.stroke();

    // item number
    ctx.fillStyle    = hovered ? '#F7F1E3' : t.fgMid;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `${Math.round(bubbleR * 0.95)}px ${monoFont}`;
    ctx.fillText(`${lvl}`, bx, by + 1);

    const captured = lvl;
    gc.hitAreas.push({
      x: tx, y: ty, w: tileW, h: tileH,
      action: () => {
        state.currentLevel  = captured;
        state.playMode      = 'levelselect';
        state.gameOver      = false;
        state.lives         = 3;
        state.levelTimerEnd = 0;
        state.levelSubPhase = '';
        state.currentScreen = 'level';
        gc.render();
      },
    });
  }
};

// Drawn separately after drawBottomPanel so nothing can render over it.
export const drawLevelSelectBackButton = (gc: GameContext) => {
  const { ctx } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);

  const btnW = Math.round(topBoxWidth * 0.11);
  const btnH = Math.round(btnW * 0.34);
  // Top-left corner of the paper, beside the centered heading. The bubble grid
  // runs to ~94% of the paper height, so the bottom edge has no free room.
  const btnX = topBoxX + Math.round(topBoxWidth * 0.02);
  const btnY = topBoxY + Math.round(topBoxHeight * 0.035);

  drawButton(gc, '← BACK', btnX, btnY, btnW, btnH, () => {
    gc.state.currentScreen = 'mainmenu';
    gc.resetPlayerName();
    gc.render();
  }, 14);
};
