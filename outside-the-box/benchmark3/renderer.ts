import { GameContext } from "./types";
import { getTheme } from "./theme";
import { getLayout } from "./layout";
import { LEVEL_DATA } from "./levelData";

export const isSkippable = (currentLevel: number): boolean => {
  const entry = LEVEL_DATA[currentLevel - 1];
  return entry ? entry.skippable !== false : true;
};

export const drawBackground = (gc: GameContext) => {
  const { ctx, state } = gc;
  const t = getTheme(state);
  document.body.style.background = t.bg;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawLogo = (gc: GameContext) => {
  const { ctx, state, logo, logoLoaded, displayFont } = gc;
  const { w, logoY } = getLayout(ctx);
  if (logoLoaded && logo.naturalWidth > 0) {
    const logoW = w * 0.10;
    const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
    ctx.drawImage(logo, w / 2 - logoW / 2, logoY - logoH / 2, logoW, logoH);
  } else {
    ctx.fillStyle = getTheme(state).fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold 54px ${displayFont}`;
    ctx.fillText("Outside-the-Box", w / 2, logoY);
  }
};

export const drawGameplayFrame = (gc: GameContext) => {
  const { ctx, state, gameplayFrame, gameplayFrameLoaded } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t = getTheme(state);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(topBoxX, topBoxY, topBoxWidth, topBoxHeight);

};

export const drawButton = (
  gc: GameContext,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  action: () => void,
  fontSize = 22,
) => {
  const { ctx, state, displayFont } = gc;
  const t = getTheme(state);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px ${displayFont}`;
  ctx.fillText(label, x + w / 2, y + h / 2, w - 16);
  gc.hitAreas.push({ x, y, w, h, action });
};

// Draws a PNG as a button, preserving aspect ratio from crop bounds.
// Falls back to drawButton if the image isn't loaded yet.
export const drawImgButton = (
  gc: GameContext,
  img: HTMLImageElement,
  loaded: boolean,
  sx: number, sy: number, sw: number, sh: number,  // source crop
  x: number, y: number, w: number,                 // destination x/y/width (height derived from ratio)
  action: () => void,
  fallbackLabel = "",
) => {
  const h = w * (sh / sw);
  if (loaded) {
    gc.ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    drawButton(gc, fallbackLabel, x, y, w, h, action);
  }
  gc.hitAreas.push({ x, y, w, h, action });
};

export const drawBottomPanel = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;

  const { frameX, frameW, bottomBoxY, bottomBoxHeight } = getLayout(ctx);
  const t = getTheme(state);
  const contentX = frameX;
  const contentWidth = frameW;

  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 4;
  ctx.strokeRect(contentX, bottomBoxY, contentWidth, bottomBoxHeight);

  const panelCY = bottomBoxY + bottomBoxHeight / 2;
  const robotCX = contentX + contentWidth * 0.07;
  const spriteSize = Math.min(bottomBoxHeight * 0.75, 56);
  const charX = robotCX + gc.guideCharOffsetX;
  const charY = panelCY - spriteSize / 2 + gc.guideCharOffsetY;

  const dirSprites: Record<string, { img: HTMLImageElement; loaded: boolean }> = {
    down:  { img: gc.playerDownImg,  loaded: gc.playerDownLoaded },
    up:    { img: gc.playerUpImg,    loaded: gc.playerUpLoaded },
    left:  { img: gc.playerLeftImg,  loaded: gc.playerLeftLoaded },
    right: { img: gc.playerRightImg, loaded: gc.playerRightLoaded },
  };
  const { img: spriteImg, loaded: spriteLoaded } = dirSprites[gc.guideCharDir] ?? dirSprites.down;

  if (spriteLoaded) {
    ctx.drawImage(spriteImg, charX - spriteSize / 2, charY, spriteSize, spriteSize);
  }

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 9px ${displayFont}`;
  ctx.fillText("EXAM  GUIDE", charX, charY + spriteSize + 4, spriteSize + 16);

  const divX = contentX + contentWidth * 0.155;
  ctx.strokeStyle = t.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(divX, bottomBoxY + bottomBoxHeight * 0.10);
  ctx.lineTo(divX, bottomBoxY + bottomBoxHeight * 0.90);
  ctx.stroke();

  const speechX = divX + contentWidth * 0.025;
  const speechW = contentX + contentWidth - speechX - contentWidth * 0.02;

  const levelData = state.currentScreen === "level"
    ? LEVEL_DATA[state.currentLevel - 1]
    : { title: state.storyTitle, lines: state.storyLines };

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `bold 11px ${displayFont}`;
  ctx.fillText("EXAM GUIDE  »", speechX, bottomBoxY + bottomBoxHeight * 0.10);

  const fullLines = levelData.lines;
  const totalChars = fullLines.reduce((sum, line) => sum + line.length, 0);
  const isTyping = state.guideReveal < totalChars;

  let charsLeft = Math.max(0, state.guideReveal);
  const displayLines: string[] = [];
  for (const line of fullLines) {
    if (charsLeft <= 0) {
      break;
    }
    const shown = Math.min(charsLeft, line.length);
    displayLines.push(line.slice(0, shown));
    charsLeft -= shown;
  }

  if (displayLines.length > 0 && (isTyping || state.guideCursor)) {
    displayLines[displayLines.length - 1] += " |";
  }

  const lineGap = 27;
  const totalH = fullLines.length * lineGap;
  const startY = panelCY - totalH / 2 + lineGap * 0.1;

  ctx.fillStyle = t.fg;
  ctx.textBaseline = "middle";
  ctx.font = `18px ${bodyFont}`;
  for (let i = 0; i < displayLines.length; i++) {
    ctx.fillText(displayLines[i], speechX, startY + i * lineGap, speechW);
  }
};

export const drawLevelHUD = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;

  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const padX = topBoxWidth * 0.05;
  const padY = topBoxHeight * 0.08;
  const t = getTheme(state);

  ctx.fillStyle = t.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `bold 26px ${displayFont}`;
  ctx.fillText(state.currentLevel === 3 ? `Q${state.currentLevel}` : `Q.${state.currentLevel}`, topBoxX + padX, topBoxY + padY);

  const pauseSize = padY * 1.6;
  const pauseX = topBoxX + topBoxWidth - padX - pauseSize;
  const pauseY = topBoxY + padY - pauseSize / 2;
  if (gc.pauseButtonLoaded) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pauseX + pauseSize / 2, pauseY + pauseSize / 2, pauseSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(gc.pauseButton, 406, 118, 735, 760, pauseX, pauseY, pauseSize, pauseSize);
    ctx.restore();
  } else {
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(pauseX, pauseY, pauseSize, pauseSize);
    ctx.fillStyle = t.fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold 16px ${displayFont}`;
    ctx.fillText("II", pauseX + pauseSize / 2, pauseY + pauseSize / 2);
  }
  gc.hitAreas.push({
    x: pauseX,
    y: pauseY,
    w: pauseSize,
    h: pauseSize,
    action: () => {
      state.paused = true;
      gc.render();
    },
  });

  const heartSize = 36;
  const heartGap  = 8;
  const totalHW   = 3 * heartSize + 2 * heartGap;
  const livesX    = topBoxX + topBoxWidth - padX - totalHW;
  const livesY    = topBoxY + topBoxHeight - padY * 1.2 - heartSize / 2;

  for (let i = 0; i < 3; i++) {
    const img    = i < state.lives ? gc.heartImg    : gc.lostHeartImg;
    const loaded = i < state.lives ? gc.heartLoaded : gc.lostHeartLoaded;
    const sx = i < state.lives ? 274  : 343;
    const sy = i < state.lives ? 0    : 55;
    const sw = i < state.lives ? 1011 : 856;
    const sh = i < state.lives ? 864  : 821;
    const hx = livesX + i * (heartSize + heartGap);
    if (loaded) {
      ctx.drawImage(img, sx, sy, sw, sh, hx, livesY, heartSize, heartSize);
    } else {
      ctx.fillStyle    = i < state.lives ? "#e03030" : state.darkMode ? "#444444" : "#bbbbbb";
      ctx.font         = `${heartSize}px sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign    = "left";
      ctx.fillText("\u2665", hx, livesY);
    }
  }
};

export const drawCheatsButton = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;

  const { topBoxX, topBoxY } = getLayout(ctx);
  const btnX = topBoxX;
  const btnY = topBoxY - 30;

  const btnW = 84;
  const btnH = 24;

  const hover = gc.mouseX >= btnX && gc.mouseX <= btnX + btnW &&
                gc.mouseY >= btnY && gc.mouseY <= btnY + btnH;

  ctx.fillStyle   = hover ? "#f0cc28" : "#d4b820";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = "#7a6400";
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle    = "#1a1200";
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold 12px ${displayFont}`;
  ctx.fillText("CHEATS", btnX + btnW / 2, btnY + btnH / 2);

  gc.hitAreas.push({
    x: btnX, y: btnY, w: btnW, h: btnH,
    action: () => {
      state.cheatsPopupOpen = !state.cheatsPopupOpen;
      gc.render();
    },
  });
};

export const drawExamTimer = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;

  // Position top-right above the play area (mirrored from cheats button on the left)
  const { topBoxX, topBoxY, topBoxWidth } = getLayout(ctx);
  const rightEdge = topBoxX + topBoxWidth;
  const btnY = topBoxY - 30;

  const elapsedMs = performance.now() - state.examStartTime;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Color tiers: gold < 12 min, silver 12–15 min, bronze 15+ min
  let timerColor: string;
  if (minutes < 12) {
    timerColor = "#d4b820"; // gold
  } else if (minutes < 15) {
    timerColor = "#a8b8c0"; // silver
  } else {
    timerColor = "#cd7f32"; // bronze
  }

  const btnW = 84;
  const btnH = 24;
  const btnX = rightEdge - btnW;

  ctx.fillStyle   = "rgba(0,0,0,0.55)";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = timerColor;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle    = timerColor;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.font         = `bold 13px ${displayFont}`;
  ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2);
};
