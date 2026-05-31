import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';
import { LEVEL_COUNT } from '../levelData';

export const drawLevelSelect = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = w / 2;
  const t  = getTheme(state);

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold 36px ${displayFont}`;
  ctx.fillText("LEVEL SELECT", cx, topBoxY + topBoxHeight * 0.1);

  // 10-column × 5-row grid (50 levels)
  const cols  = 10;
  const tileW = topBoxWidth  * 0.072;
  const tileH = topBoxHeight * 0.116;
  const hGap  = (topBoxWidth * 0.86 - tileW * cols) / (cols - 1);
  const vGap  = topBoxHeight * 0.030;
  const gridW = tileW * cols + hGap * (cols - 1);
  const gridX = cx - gridW / 2;
  const gridY = topBoxY + topBoxHeight * 0.17;

  for (let i = 0; i < LEVEL_COUNT; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tx  = gridX + col * (tileW + hGap);
    const ty  = gridY + row * (tileH + vGap);
    const lvl = i + 1;

    const locked = false;

    if (gc.levelBGLoaded) {
      ctx.drawImage(gc.levelBGImg, 326, 132, 888, 810, tx, ty, tileW, tileH);
    } else {
      ctx.strokeStyle = locked ? "#555555" : t.stroke;
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(tx, ty, tileW, tileH);
    }

    // Dark overlay for locked levels
    if (locked) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(tx, ty, tileW, tileH);
    }

    ctx.fillStyle    = locked ? "#666666" : "#1a1a1a";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.font         = `bold ${Math.round(tileH * 0.42)}px ${displayFont}`;
    ctx.fillText(`${lvl}`, tx + tileW / 2, ty + tileH / 2);

    if (!locked) {
      const captured = lvl;
      gc.hitAreas.push({
        x: tx, y: ty, w: tileW, h: tileH,
        action: () => {
          state.currentLevel    = captured;
          state.playMode        = "levelselect";
          state.gameOver        = false;
          state.lives           = 3;
          state.levelTimerEnd   = 0;
          state.levelSubPhase   = "";
          state.currentScreen   = "level";
          gc.render();
        },
      });
    }
  }

};

// Drawn separately after drawBottomPanel so nothing can render over it
export const drawLevelSelectBackButton = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);

  const btnW = Math.round(topBoxWidth * 0.09);
  const btnH = Math.round(btnW * 0.38);
  const btnX = topBoxX + Math.round(topBoxWidth * 0.025);
  const btnY = topBoxY + topBoxHeight - btnH - Math.round(topBoxHeight * 0.04);
  const r    = 6;

  const hovered = gc.mouseX >= btnX && gc.mouseX <= btnX + btnW &&
                  gc.mouseY >= btnY && gc.mouseY <= btnY + btnH;

  // Paper/cream fill to echo back.png style
  ctx.beginPath();
  ctx.moveTo(btnX + r, btnY);
  ctx.lineTo(btnX + btnW - r, btnY);
  ctx.arcTo(btnX + btnW, btnY,         btnX + btnW, btnY + r,         r);
  ctx.lineTo(btnX + btnW, btnY + btnH - r);
  ctx.arcTo(btnX + btnW, btnY + btnH,  btnX + btnW - r, btnY + btnH,  r);
  ctx.lineTo(btnX + r,   btnY + btnH);
  ctx.arcTo(btnX,        btnY + btnH,  btnX, btnY + btnH - r,         r);
  ctx.lineTo(btnX,       btnY + r);
  ctx.arcTo(btnX,        btnY,         btnX + r, btnY,                r);
  ctx.closePath();

  ctx.fillStyle   = hovered ? "#d8d0c0" : "#e8e0d0";
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.fillStyle    = "#1a1a1a";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold ${Math.round(btnH * 0.46)}px ${displayFont}`;
  ctx.fillText("← BACK", btnX + btnW / 2, btnY + btnH / 2);

  gc.hitAreas.push({
    x: btnX, y: btnY, w: btnW, h: btnH,
    action: () => {
      state.currentScreen = "mainmenu";
      gc.resetPlayerName();
      gc.render();
    },
  });
};
