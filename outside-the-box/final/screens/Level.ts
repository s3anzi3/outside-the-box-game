import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
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
import { drawLevel11 } from "../levels/Level11";
import { drawLevel12 } from "../levels/Level12";
import { drawLevel13 } from "../levels/Level13";
import { drawLevel14 } from "../levels/Level14";
import { drawLevel15 } from "../levels/Level15";
import { drawLevel16 } from "../levels/Level16";
import { drawLevel17 } from "../levels/Level17";
import { drawLevel18 } from "../levels/Level18";
import { drawLevel19 } from "../levels/Level19";
import { drawLevel20 } from "../levels/Level20";
import { drawLevel30 } from "../levels/Level30";
import { drawLevel31 } from "../levels/Level31";
import { drawLevel32 } from "../levels/Level32";
import { drawLevel33 } from "../levels/Level33";
import { drawLevel34 } from "../levels/Level34";
import { drawLevel35 } from "../levels/Level35";
import { drawLevel36 } from "../levels/Level36";
import { drawLevel37 } from "../levels/Level37";
import { drawLevel38 } from "../levels/Level38";
import { drawLevel39 } from "../levels/Level39";
import { drawLevel40 } from "../levels/Level40";
import { drawLevel41 } from "../levels/Level41";
import { drawLevel42 } from "../levels/Level42";
import { drawLevel43 } from "../levels/Level43";
import { drawLevel44 } from "../levels/Level44";
import { drawLevel45 } from "../levels/Level45";
import { drawLevel46 } from "../levels/Level46";
import { drawLevel47 } from "../levels/Level47";
import { drawLevel48 } from "../levels/Level48";
import { drawLevel49 } from "../levels/Level49";
import { drawLevel50 } from "../levels/Level50";
import { LEVEL_COUNT } from "../levelData";

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

  // ── Levels 11–20 — bespoke lateral-thinking puzzles ───────────────────────
  if (lvl === 11) { drawLevel11(gc); drawLevelHUD(gc); return; }
  if (lvl === 12) { drawLevel12(gc); drawLevelHUD(gc); return; }
  if (lvl === 13) { drawLevel13(gc); drawLevelHUD(gc); return; }
  if (lvl === 14) { drawLevel14(gc); drawLevelHUD(gc); return; }
  if (lvl === 15) { drawLevel15(gc); drawLevelHUD(gc); return; }
  if (lvl === 16) { drawLevel16(gc); drawLevelHUD(gc); return; }
  if (lvl === 17) { drawLevel17(gc); drawLevelHUD(gc); return; }
  if (lvl === 18) { drawLevel18(gc); drawLevelHUD(gc); return; }
  if (lvl === 19) { drawLevel19(gc); drawLevelHUD(gc); return; }
  if (lvl === 20) { drawLevel20(gc); drawLevelHUD(gc); return; }

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
  if (lvl === 30) { drawLevel30(gc); drawLevelHUD(gc); return; }
  if (lvl === 31) { drawLevel31(gc); drawLevelHUD(gc); return; }
  if (lvl === 32) { drawLevel32(gc); drawLevelHUD(gc); return; }
  if (lvl === 33) { drawLevel33(gc); drawLevelHUD(gc); return; }
  if (lvl === 34) { drawLevel34(gc); drawLevelHUD(gc); return; }
  if (lvl === 35) { drawLevel35(gc); drawLevelHUD(gc); return; }
  if (lvl === 36) { drawLevel36(gc); drawLevelHUD(gc); return; }
  if (lvl === 37) { drawLevel37(gc); drawLevelHUD(gc); return; }
  if (lvl === 38) { drawLevel38(gc); drawLevelHUD(gc); return; }
  if (lvl === 39) { drawLevel39(gc); drawLevelHUD(gc); return; }
  if (lvl === 40) { drawLevel40(gc); drawLevelHUD(gc); return; }
  if (lvl === 41) { drawLevel41(gc); drawLevelHUD(gc); return; }
  if (lvl === 42) { drawLevel42(gc); drawLevelHUD(gc); return; }
  if (lvl === 43) { drawLevel43(gc); drawLevelHUD(gc); return; }
  if (lvl === 44) { drawLevel44(gc); drawLevelHUD(gc); return; }
  if (lvl === 45) { drawLevel45(gc); drawLevelHUD(gc); return; }
  if (lvl === 46) { drawLevel46(gc); drawLevelHUD(gc); return; }
  if (lvl === 47) { drawLevel47(gc); drawLevelHUD(gc); return; }
  if (lvl === 48) { drawLevel48(gc); drawLevelHUD(gc); return; }
  if (lvl === 49) { drawLevel49(gc); drawLevelHUD(gc); return; }
  if (lvl === 50) {
    drawLevel50(gc);
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
