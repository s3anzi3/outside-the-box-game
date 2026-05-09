import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { drawImgButton } from "../renderer";

export const drawPauseOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const pad = topBoxWidth * 0.05;
  const ox = topBoxX + pad;
  const oy = topBoxY + pad;
  const ow = topBoxWidth - pad * 2;
  const oh = topBoxHeight - pad * 2;
  const cx = ox + ow / 2;
  const t = getTheme(state);

  ctx.fillStyle = t.overlayBg;
  ctx.fillRect(ox, oy, ow, oh);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, ow, oh);

  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 38px ${displayFont}`;
  ctx.fillText("PAUSED", cx, oy + oh * 0.18);

  ctx.strokeStyle = t.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox + ow * 0.1, oy + oh * 0.3);
  ctx.lineTo(ox + ow * 0.9, oy + oh * 0.3);
  ctx.stroke();

  // Clear all underlying hit areas so the game behind is blocked
  gc.hitAreas = [];

  const btnW = 220;
  const btnX = ox + ow * 0.62;
  const sliderW = Math.min(ow * 0.34, 220);
  const sliderH = 10;
  const sliderX = ox + ow * 0.14;
  const sliderY = oy + oh * 0.54;
  const sliderHitH = 28;
  const sliderLabelY = sliderY - 18;
  const leftPanelCenterX = sliderX + sliderW / 2;
  const cheatBoxW = sliderW;
  const cheatBoxH = 38;
  const cheatBoxX = sliderX;
  const cheatBoxY = sliderY + 38;
  const cheatButtonW = 34;
  const cheatButtonH = cheatBoxH;
  const cheatButtonGap = 12;
  const cheatButtonX = cheatBoxX + cheatBoxW + cheatButtonGap;
  const cheatButtonY = cheatBoxY;
  const volumePercent = Math.round(gc.sounds.getMasterVolume() * 100);
  const isOverSlider = (
    gc.mouseX >= sliderX &&
    gc.mouseX <= sliderX + sliderW &&
    gc.mouseY >= sliderY - sliderHitH / 2 &&
    gc.mouseY <= sliderY + sliderHitH / 2
  );
  const applyVolumeFromPointer = () => {
    const normalized = Math.min(1, Math.max(0, (gc.mouseX - sliderX) / sliderW));
    gc.sounds.setMasterVolume(normalized);
  };

  if (gc.mouseDown && isOverSlider) {
    applyVolumeFromPointer();
  }

  if (isOverSlider && gc.wheelDeltaY !== 0) {
    const delta = gc.wheelDeltaY < 0 ? 0.05 : -0.05;
    gc.sounds.setMasterVolume(gc.sounds.getMasterVolume() + delta);
  }

  drawImgButton(gc, gc.resumeImg, gc.resumeLoaded,
    304, 379, 929, 208, btnX, oy + oh * 0.30, btnW,
    () => { state.paused = false; gc.render(); },
    "RESUME",
  );

  drawImgButton(gc, gc.quitExamImg, gc.quitExamLoaded,
    303, 378, 930, 197, btnX, oy + oh * 0.48, btnW,
    () => { state.paused = false; state.lives = 3; gc.resetPlayerName(); state.currentScreen = "mainmenu"; gc.render(); },
    "QUIT TO MENU",
  );

  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `bold 16px ${displayFont}`;
  ctx.fillText(`SOUND ${volumePercent}%`, leftPanelCenterX, sliderLabelY);

  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(sliderX, sliderY - sliderH / 2, sliderW, sliderH);
  ctx.fillStyle = state.darkMode ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.10)";
  ctx.fillRect(sliderX, sliderY - sliderH / 2, sliderW, sliderH);
  ctx.fillStyle = t.fg;
  ctx.fillRect(sliderX, sliderY - sliderH / 2, sliderW * gc.sounds.getMasterVolume(), sliderH);

  const knobX = sliderX + sliderW * gc.sounds.getMasterVolume();
  ctx.beginPath();
  ctx.arc(knobX, sliderY, 10, 0, Math.PI * 2);
  ctx.fillStyle = t.fg;
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  gc.hitAreas.push({
    x: sliderX,
    y: sliderY - sliderHitH / 2,
    w: sliderW,
    h: sliderHitH,
    action: () => {
      applyVolumeFromPointer();
      gc.render();
    },
  });

  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `bold 13px ${displayFont}`;
  ctx.fillText("LEVEL SELECT CHEAT", leftPanelCenterX, cheatBoxY - 8);

  ctx.fillStyle = state.darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  ctx.fillRect(cheatBoxX, cheatBoxY, cheatBoxW, cheatBoxH);
  ctx.strokeStyle = state.pauseCheatFocused ? "#a7adb7" : t.stroke;
  ctx.lineWidth = state.pauseCheatFocused ? 3 : 2;
  ctx.strokeRect(cheatBoxX, cheatBoxY, cheatBoxW, cheatBoxH);

  ctx.fillStyle = state.pauseCheatInput.length > 0 ? t.fg : t.fgDim;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `bold 16px ${displayFont}`;
  const cheatText = state.pauseCheatInput.length > 0
    ? state.pauseCheatInput + (state.pauseCheatFocused ? "|" : "")
    : (state.pauseCheatFocused ? "|" : "Cheat Key");
  ctx.fillText(cheatText, cheatBoxX + 12, cheatBoxY + cheatBoxH / 2, cheatBoxW - 24);

  ctx.fillStyle = "#9ea4ad";
  ctx.fillRect(cheatButtonX, cheatButtonY, cheatButtonW, cheatButtonH);
  ctx.strokeStyle = "#595f69";
  ctx.lineWidth = 2;
  ctx.strokeRect(cheatButtonX, cheatButtonY, cheatButtonW, cheatButtonH);

  gc.hitAreas.push({
    x: cheatBoxX,
    y: cheatBoxY,
    w: cheatBoxW,
    h: cheatBoxH,
    action: () => {
      state.pauseCheatFocused = true;
      gc.render();
    },
  });

  gc.hitAreas.push({
    x: cheatButtonX,
    y: cheatButtonY,
    w: cheatButtonW,
    h: cheatButtonH,
    action: () => {
      gc.submitPauseCheat();
    },
  });

  // In dark mode show the "switch to light" button, and vice versa
  const modeImg    = state.darkMode ? gc.lightModeImg  : gc.darkModeImg;
  const modeLoaded = state.darkMode ? gc.lightModeLoaded : gc.darkModeLoaded;
  drawImgButton(gc, modeImg, modeLoaded,
    265, 380, 1007, 220, btnX, oy + oh * 0.66, btnW,
    () => { state.darkMode = !state.darkMode; gc.render(); },
    state.darkMode ? "LIGHT MODE" : "DARK MODE",
  );
};
