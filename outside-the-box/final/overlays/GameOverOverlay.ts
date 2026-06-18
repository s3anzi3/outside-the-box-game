import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { drawButton, drawDocumentBox, drawStamp, uiScale } from "../renderer";

// Shrinks the font until `text` fits within maxW, so headings never spill the panel.
const fitFont = (
  ctx: CanvasRenderingContext2D, text: string, maxW: number,
  desiredPx: number, family: string, weight = "",
) => {
  ctx.font = `${weight} ${desiredPx}px ${family}`;
  const wdt = ctx.measureText(text).width;
  return wdt <= maxW ? desiredPx : Math.max(9, Math.floor(desiredPx * maxW / wdt));
};

export const drawGameOverOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, h } = getLayout(ctx);
  const cx = w / 2;
  const cy = h / 2;
  const t = getTheme(state);
  const s = uiScale(ctx);

  // Full-canvas dim
  ctx.fillStyle = "rgba(20,15,10,0.80)";
  ctx.fillRect(0, 0, w, h);

  // Notice panel
  const panelW = Math.min(w * 0.7, 600);
  const panelH = Math.min(h * 0.62, 470);
  const panelX = cx - panelW / 2;
  const panelY = cy - panelH / 2;
  drawDocumentBox(gc, panelX, panelY, panelW, panelH, { title: "Proctor Notice" });

  const innerW = panelW * 0.84;

  // eyebrow
  ctx.fillStyle = t.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText("CANDIDATURE  VOIDED", cx, panelY + panelH * 0.16);

  // heading — shrunk to fit the panel
  ctx.fillStyle = t.danger;
  const headPx = fitFont(ctx, "Examination Terminated", innerW, Math.round(34 * s), displayFont, "bold");
  ctx.font = `bold ${headPx}px ${displayFont}`;
  ctx.fillText("Examination Terminated", cx, panelY + panelH * 0.31);

  // body — shrunk to fit
  const bodyText = `Better luck next time, ${state.playerName}.`;
  ctx.fillStyle = t.fgMid;
  const bodyPx = fitFont(ctx, bodyText, innerW, Math.round(18 * s), bodyFont);
  ctx.font = `${bodyPx}px ${bodyFont}`;
  ctx.fillText(bodyText, cx, panelY + panelH * 0.45);

  // contained VOID stamp, upper-right inside the panel
  drawStamp(gc, panelX + panelW * 0.80, panelY + panelH * 0.155, "VOID", t.danger, { angle: -12, fontPx: 17 });

  // divider
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + panelW * 0.12, panelY + panelH * 0.55);
  ctx.lineTo(panelX + panelW * 0.88, panelY + panelH * 0.55);
  ctx.stroke();

  // Clear underlying hit areas so the game behind is blocked
  gc.hitAreas = [];

  const btnW = Math.min(panelW * 0.62, 240);
  const btnH = Math.max(40, panelH * 0.13);

  if (state.playMode === "play") {
    drawButton(gc, "TRY AGAIN", cx - btnW / 2, panelY + panelH * 0.62, btnW, btnH, () => {
      state.lives = 3;
      state.gameOver = false;
      state.currentLevel = 1;
      gc.resetPlayerName();
      gc.render();
    }, 18);

    drawButton(gc, "MAIN MENU", cx - btnW / 2, panelY + panelH * 0.62 + btnH + panelH * 0.045, btnW, btnH, () => {
      state.lives = 3;
      state.gameOver = false;
      state.currentScreen = "mainmenu";
      gc.resetPlayerName();
      gc.render();
    }, 18);
  } else {
    drawButton(gc, "MAIN MENU", cx - btnW / 2, panelY + panelH * 0.72, btnW, btnH, () => {
      state.lives = 3;
      state.gameOver = false;
      state.currentScreen = "mainmenu";
      gc.resetPlayerName();
      gc.render();
    }, 18);
  }
};
