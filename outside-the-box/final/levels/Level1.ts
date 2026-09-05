import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { drawButton, roundRect, uiScale } from "../renderer";
import { drawWinScreen } from "./lateralHelpers";

export const drawNameEntry = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = topBoxX + topBoxWidth / 2;
  const t = getTheme(state);
  const s = uiScale(ctx);

  if (state.levelSubPhase === "win") {
    drawWinScreen(gc, "REGISTERED.",
      "The first answer you gave this exam was your own name. Hold on to it. The exam will try to take it.", 2);
    return;
  }

  // eyebrow
  ctx.fillStyle = t.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText("SECTION I  ·  ITEM 1  ·  CANDIDATE REGISTRATION", cx, topBoxY + topBoxHeight * 0.14);

  // Prompt
  ctx.fillStyle = t.ink;
  ctx.font = `bold ${Math.round(32 * s)}px ${displayFont}`;
  ctx.fillText("What is your name?", cx, topBoxY + topBoxHeight * 0.28);

  // Input field — rounded paper
  const inputW = topBoxWidth * 0.5;
  const inputH = Math.max(46, topBoxHeight * 0.12);
  const inputX = cx - inputW / 2;
  const inputY = topBoxY + topBoxHeight * 0.42;

  roundRect(ctx, inputX, inputY, inputW, inputH, 5);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = state.nameFocused ? t.accent : t.hairline;
  ctx.lineWidth = state.nameFocused ? 3 : 1.5;
  ctx.stroke();

  const displayText =
    state.nameInput.length > 0
      ? state.nameInput
      : state.nameFocused
        ? ""
        : "Type your name…";
  ctx.fillStyle = state.nameInput.length > 0 ? t.ink : t.fgDim;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(22 * s)}px ${bodyFont}`;
  ctx.fillText(displayText, inputX + 16, inputY + inputH / 2, inputW - 32);

  // Blinking cursor
  if (state.nameFocused) {
    const measured = ctx.measureText(state.nameInput).width;
    const cursorX = inputX + 16 + Math.min(measured, inputW - 32);
    const blink = Math.floor(Date.now() / 530) % 2 === 0;
    if (blink) {
      ctx.strokeStyle = t.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, inputY + inputH * 0.22);
      ctx.lineTo(cursorX, inputY + inputH * 0.78);
      ctx.stroke();
    }
  }

  gc.hitAreas.push({
    x: inputX, y: inputY, w: inputW, h: inputH,
    action: () => { state.nameFocused = true; gc.render(); },
  });

  // Confirm button
  const confirmW = Math.min(topBoxWidth * 0.32, 240);
  const confirmH = Math.max(44, topBoxHeight * 0.12);
  drawButton(gc, "CONFIRM →", cx - confirmW / 2, topBoxY + topBoxHeight * 0.62, confirmW, confirmH, () => {
    state.playerName = state.nameInput.trim() || "Box";
    state.nameFocused = false;
    if (state.playMode === "play" && state.examStartTime === 0) {
      state.examStartTime = performance.now();
    }
    state.levelSubPhase = "win";
    gc.render();
  }, 20);
};
