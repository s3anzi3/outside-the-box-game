import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout, getMovementLayout } from "../layout";
import { drawButton, drawImgButton, drawLevelHUD } from "../renderer";
import { drawNameEntry } from "../levels/Level1";
import { drawLevel2 } from "../levels/Level2";
import { drawLevel3 } from "../levels/Level3";
import { drawLevel4 } from "../levels/Level4";
import { drawLevel5 } from "../levels/Level5";
import { drawLevel6 } from "../levels/Level6";
import { drawLevel7 } from "../levels/Level7";
import { drawLevel8 } from "../levels/Level8";
import { drawLevel9 } from "../levels/Level9";
import { drawLevel10 } from "../levels/Level10";
import { drawLevel21 } from "../levels/Level21";
import { drawLevel22 } from "../levels/Level22";
import { drawLevel23 } from "../levels/Level23";
import { drawLevel24 } from "../levels/Level24";
import { drawLevel25 } from "../levels/Level25";
import { drawLevel26 } from "../levels/Level26";
import { drawLevel27 } from "../levels/Level27";
import { drawLevel28 } from "../levels/Level28";
import { drawLevel29 } from "../levels/Level29";
import { drawLevel30 } from "../levels/Level30";
import { LEVEL_COUNT } from "../levelData";

const drawMovementLevelNavigation = (gc: GameContext) => {
  const { state } = gc;
  const movementLayout = getMovementLayout(gc.ctx);
  const navBtnH = 42;
  const navBtnW = 150;
  const navY = movementLayout.bottomFrameY + movementLayout.bottomFrameHeight - navBtnH - 22;
  const centerX = movementLayout.bottomFrameWidth / 2;

  if (state.playMode !== "levelselect") {
    return;
  }

  if (state.currentLevel > 1) {
    drawButton(gc, "<- PREV", 26, navY, navBtnW, navBtnH, () => {
      state.currentLevel--;
      gc.render();
    }, 18);
  }

  drawImgButton(gc, gc.levelSelectImg, gc.levelSelectLoaded,
    247, 337, 1044, 217, centerX - navBtnW / 2, navY, navBtnW,
    () => { gc.resetPlayerName(); state.currentScreen = "levelselect"; gc.render(); },
    "LEVEL SELECT",
  );

  if (state.currentLevel < LEVEL_COUNT) {
    drawButton(gc, "NEXT ->", movementLayout.bottomFrameWidth - navBtnW - 26, navY, navBtnW, navBtnH, () => {
      state.currentLevel++;
      gc.render();
    }, 18);
  }
};

const drawAnswerZone = (gc: GameContext) => {
  const { ctx, state } = gc;
  const slotStroke = state.darkMode ? "rgba(255,255,255,0.92)" : "rgba(40,40,40,0.82)";
  const slotFill = state.darkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)";

  for (const slot of gc.answerSlots) {
    ctx.fillStyle = slotFill;
    ctx.fillRect(slot.x, slot.y, slot.size, slot.size);
    ctx.strokeStyle = slotStroke;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(slot.x, slot.y, slot.size, slot.size);
    ctx.setLineDash([]);
  }
};

export const drawLevel = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = w / 2;
  const lvl = state.currentLevel;
  const t = getTheme(state);

  if (lvl === 1) {
    drawNameEntry(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 2) {
    drawLevel2(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 3) {
    drawLevel3(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 4) {
    drawLevel4(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 5) {
    drawLevel5(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 6) {
    drawLevel6(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 7) {
    drawLevel7(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 8) {
    drawLevel8(gc);
    return;
  }

  if (lvl === 9) {
    drawLevel9(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 10) {
    drawLevel10(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl >= 11 && lvl <= 20 && !state.movementIntroSeen) {
    // ── Movement intro popup ────────────────────────────────────────────────
    const px = topBoxX + topBoxWidth * 0.04;
    const py = topBoxY + topBoxHeight * 0.05;
    const pw = topBoxWidth * 0.92;
    const ph = topBoxHeight * 0.90;

    // Backdrop
    ctx.fillStyle = state.darkMode ? "rgba(10,20,10,0.96)" : "rgba(240,240,230,0.97)";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    // ── Player sprite avatar ─────────────────────────────────────────────────
    const robotCX = px + pw * 0.12;
    const spriteSize = 56;
    const spriteX = robotCX - spriteSize / 2;
    const spriteY = py + ph * 0.12;
    const dirSpritesIntro = {
      down:  { img: gc.playerDownImg,  loaded: gc.playerDownLoaded },
      up:    { img: gc.playerUpImg,    loaded: gc.playerUpLoaded },
      left:  { img: gc.playerLeftImg,  loaded: gc.playerLeftLoaded },
      right: { img: gc.playerRightImg, loaded: gc.playerRightLoaded },
    };
    const { img: introSpriteImg, loaded: introSpriteLoaded } = dirSpritesIntro[gc.guideCharDir] ?? dirSpritesIntro.down;
    if (introSpriteLoaded) {
      ctx.drawImage(introSpriteImg, spriteX, spriteY, spriteSize, spriteSize);
    }
    ctx.fillStyle = t.fgDim;
    ctx.font = `bold 8px ${displayFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("EXAM  GUIDE", robotCX, spriteY + spriteSize + 4);

    // ── Guide speech ────────────────────────────────────────────────────────
    const speechX = px + pw * 0.22;
    const speechW = pw * 0.74;
    ctx.fillStyle = t.fg;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `bold 13px ${displayFont}`;
    ctx.fillStyle = t.fgDim;
    ctx.fillText("EXAM GUIDE  »", speechX, py + ph * 0.08);

    const guideLines = [
      "It is now time to check your problem solving skills",
      "when you know its someones life at stake....  so im going in!!!",
      "These next ones work a bit differently — get ready to move.",
    ];
    ctx.fillStyle = t.fg;
    ctx.font = `16px ${bodyFont}`;
    guideLines.forEach((line, i) => {
      ctx.fillText(line, speechX, py + ph * 0.14 + i * 24, speechW);
    });

    // ── Divider ─────────────────────────────────────────────────────────────
    const divY = py + ph * 0.36;
    ctx.strokeStyle = t.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + pw * 0.05, divY);
    ctx.lineTo(px + pw * 0.95, divY);
    ctx.stroke();

    // ── Controls blurb ──────────────────────────────────────────────────────
    ctx.fillStyle = t.fg;
    ctx.font = `bold 15px ${displayFont}`;
    ctx.textAlign = "left";
    ctx.fillText("LEVELS 11–20 — MOVEMENT CHALLENGE", px + pw * 0.05, divY + 14);

    const controlLines = [
      "WASD — move your character, SPACE - dash , H - pick up/release blocks (must be facing it)",
      "Carry blocks into the answer zone at the top and spell the correct answer, then hit SUBMIT. Watch out for special block types:",
      "These levels are incomplete. The quiz is very simple now, but the movement and block mechanics are all there. The final version will have more complex layouts and puzzles.",
      "",
      "  Heavy — slows you to 25% speed while held",
      "  Glass — breaks if you drop and try to pick it up again",
      "  Invisible — hidden until you pick it up",
      "  Countdown — counts down while held, explodes at 0",
    ];

    ctx.font = `13px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    controlLines.forEach((line, i) => {
      ctx.fillText(line, px + pw * 0.05, divY + 38 + i * 20, pw * 0.9);
    });

    // ── Let's go button ─────────────────────────────────────────────────────
    const btnW = 180; const btnH = 44;
    const btnX = px + (pw - btnW) / 2;
    const btnY = py + ph - btnH - 18;
    drawButton(gc, "LET'S GO!", btnX, btnY, btnW, btnH, () => {
      state.movementIntroSeen = true;
      gc.render();
    }, 18);

    return;
  }

  if (lvl >= 11 && lvl <= 20) {
    const movementLayout = getMovementLayout(ctx);

    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 4;
    ctx.strokeRect(
      movementLayout.gameFrameX,
      movementLayout.gameFrameY,
      movementLayout.gameFrameWidth,
      movementLayout.gameFrameHeight,
    );

    drawAnswerZone(gc);

    for (const block of gc.blocks) {
      block.draw(ctx);
    }

    gc.player.draw(ctx);
    drawMovementLevelNavigation(gc);
    drawLevelHUD(gc);
    return;
  }

  if (lvl === 21 && !state.level21IntroSeen) {
    // ── Level 21 return popup ───────────────────────────────────────────────
    const px = topBoxX + topBoxWidth * 0.04;
    const py = topBoxY + topBoxHeight * 0.05;
    const pw = topBoxWidth * 0.92;
    const ph = topBoxHeight * 0.90;

    ctx.fillStyle = state.darkMode ? "rgba(10,20,10,0.96)" : "rgba(240,240,230,0.97)";
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    // Player sprite avatar
    const robotCX = px + pw * 0.12;
    const spriteSize21 = 56;
    const spriteX21 = robotCX - spriteSize21 / 2;
    const spriteY21 = py + ph * 0.12;
    const dirSprites21 = {
      down:  { img: gc.playerDownImg,  loaded: gc.playerDownLoaded },
      up:    { img: gc.playerUpImg,    loaded: gc.playerUpLoaded },
      left:  { img: gc.playerLeftImg,  loaded: gc.playerLeftLoaded },
      right: { img: gc.playerRightImg, loaded: gc.playerRightLoaded },
    };
    const { img: sprite21Img, loaded: sprite21Loaded } = dirSprites21[gc.guideCharDir] ?? dirSprites21.down;
    if (sprite21Loaded) {
      ctx.drawImage(sprite21Img, spriteX21, spriteY21, spriteSize21, spriteSize21);
    }
    ctx.fillStyle = t.fgDim;
    ctx.font = `bold 8px ${displayFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("EXAM  GUIDE", robotCX, spriteY21 + spriteSize21 + 4);

    // Speech
    const speechX21 = px + pw * 0.22;
    const speechW21 = pw * 0.74;
    ctx.textAlign = "left";
    ctx.font = `bold 13px ${displayFont}`;
    ctx.fillStyle = t.fgDim;
    ctx.fillText("EXAM GUIDE  »", speechX21, py + ph * 0.10);

    const guideLines21 = [
      "Good job not killing me... I guess.",
      "Back to your regularly scheduled exam. Try not to mess this up.",
    ];
    ctx.fillStyle = t.fg;
    ctx.font = `16px ${bodyFont}`;
    guideLines21.forEach((line, i) => {
      ctx.fillText(line, speechX21, py + ph * 0.20 + i * 26, speechW21);
    });

    // Button
    const btnW21 = 180; const btnH21 = 44;
    const btnX21 = px + (pw - btnW21) / 2;
    const btnY21 = py + ph - btnH21 - 18;
    drawButton(gc, "CONTINUE", btnX21, btnY21, btnW21, btnH21, () => {
      state.level21IntroSeen = true;
      gc.render();
    }, 18);

    return;
  }

  if (lvl === 21) { drawLevel21(gc); drawLevelHUD(gc); return; }
  if (lvl === 22) { drawLevel22(gc); drawLevelHUD(gc); return; }
  if (lvl === 23) { drawLevel23(gc); drawLevelHUD(gc); return; }
  if (lvl === 24) { drawLevel24(gc); drawLevelHUD(gc); return; }
  if (lvl === 25) { drawLevel25(gc); drawLevelHUD(gc); return; }
  if (lvl === 26) { drawLevel26(gc); drawLevelHUD(gc); return; }
  if (lvl === 27) { drawLevel27(gc); drawLevelHUD(gc); return; }
  if (lvl === 28) { drawLevel28(gc); drawLevelHUD(gc); return; }
  if (lvl === 29) { drawLevel29(gc); drawLevelHUD(gc); return; }
  if (lvl === 30) {
    drawLevel30(gc);
    // No HUD on the win/certificate screens — clean slate
    if (state.levelSubPhase !== 'certificate' && state.levelSubPhase !== 'win') {
      drawLevelHUD(gc);
    }
    return;
  }

  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `bold 34px ${displayFont}`;
  ctx.fillText(`LEVEL ${lvl}`, cx, topBoxY + topBoxHeight * 0.16);

  ctx.font = `22px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  ctx.fillText("This level is under construction.", cx, topBoxY + topBoxHeight * 0.38, topBoxWidth * 0.6);

  ctx.font = `16px ${bodyFont}`;
  ctx.fillStyle = t.fgDim;
  ctx.fillText("Questions, choices, and interactions will be wired in here.", cx, topBoxY + topBoxHeight * 0.52, topBoxWidth * 0.6);

  if (state.playMode === "levelselect") {
    const navBtnH = 42;
    const navBtnW = 150;
    const navY = topBoxY + topBoxHeight * 0.79;

    if (lvl > 1) {
      drawButton(gc, "<- PREV", topBoxX + topBoxWidth * 0.05, navY, navBtnW, navBtnH, () => {
        state.currentLevel--;
        gc.render();
      }, 18);
    }

    drawImgButton(gc, gc.levelSelectImg, gc.levelSelectLoaded,
      247, 337, 1044, 217, cx - navBtnW / 2, navY, navBtnW,
      () => { gc.resetPlayerName(); state.currentScreen = "levelselect"; gc.render(); },
      "LEVEL SELECT",
    );

    if (lvl < LEVEL_COUNT) {
      drawButton(gc, "NEXT ->", topBoxX + topBoxWidth * 0.77, navY, navBtnW, navBtnH, () => {
        state.currentLevel++;
        gc.render();
      }, 18);
    }
  }

  drawLevelHUD(gc);
};
