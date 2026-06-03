import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { getGuideTextMetrics } from "../renderer";

export const drawLevel3 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const cx = w / 2;
  const t = getTheme(state);

  // 2×2 grid of decoy options — all wrong
  // levelBGImg (same crop used by the level-select tiles) is the reliable button background
  const cols  = 2;
  const tileW = topBoxWidth * 0.38;
  const tileH = Math.round(topBoxHeight * 0.20);
  const hGap  = topBoxWidth * 0.06;
  const vGap  = topBoxHeight * 0.06;
  const gridW = cols * tileW + hGap;
  const gridX = cx - gridW / 2;
  const gridY = topBoxY + topBoxHeight * 0.18;

  for (let i = 0; i < 4; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const tx = gridX + col * (tileW + hGap);
    const ty = gridY + row * (tileH + vGap);

    // Stone-tile button background — same crop used in the level select screen
    if (gc.levelBGLoaded) {
      ctx.drawImage(gc.levelBGImg, 326, 132, 888, 810, tx, ty, tileW, tileH);
    } else {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(tx, ty, tileW, tileH);
    }

    ctx.fillStyle    = "#1a1a1a";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";

    // Font sizes scale with BOTH tile height and width so labels can't spill out
    // of a narrow tile; maxW is a hard cap as the final safety net.
    const big   = Math.round(Math.min(tileH * 0.38, tileW * 0.17));
    const med   = Math.round(Math.min(tileH * 0.28, tileW * 0.075));
    const small = Math.round(Math.min(tileH * 0.24, tileW * 0.085));
    const maxW  = tileW * 0.74;

    if (i === 0) {
      ctx.font = `bold ${big}px ${displayFont}`;
      ctx.fillText("dot", tx + tileW / 2, ty + tileH / 2, maxW);
    } else if (i === 1) {
      ctx.font = `bold ${med}px ${displayFont}`;
      ctx.fillText("Kendrick 'K-dot' Lamar", tx + tileW / 2, ty + tileH / 2, maxW);
    } else if (i === 2) {
      ctx.font = `bold ${big}px ${displayFont}`;
      ctx.fillText("\u2022 \u2022 \u2022", tx + tileW / 2, ty + tileH / 2, maxW);
    } else {
      ctx.font = `bold ${med}px ${displayFont}`;
      ctx.fillText("Dept. of Technology", tx + tileW / 2, ty + tileH * 0.38, maxW);
      ctx.font = `${small}px ${bodyFont}`;
      ctx.fillStyle = "#444";
      ctx.fillText("(D.O.T)", tx + tileW / 2, ty + tileH * 0.72, maxW);
    }

    gc.hitAreas.push({
      x: tx,
      y: ty,
      w: tileW,
      h: tileH,
      action: () => gc.loseLife(),
    });
  }

  // Hidden hit area: the tittle (dot) on the 'i' in "Click" in the bottom panel.
  // Use the SAME responsive metrics the panel renders with, so the dot stays
  // aligned and clickable at any screen size.
  const gm = getGuideTextMetrics(ctx);
  const speechX = gm.speechX;
  const lineGap = gm.lineGap;
  const startY  = gm.panelCY - lineGap / 2 + lineGap * 0.1;

  ctx.font = `${gm.fontPx}px ${bodyFont}`;
  const prefixW = ctx.measureText("Cl").width;
  const iCharW  = ctx.measureText("i").width;
  const iDotCX  = speechX + prefixW + iCharW / 2;
  const iDotCY  = startY - gm.fontPx * 0.33;
  const hitR    = Math.max(8, gm.fontPx * 0.55);

  gc.hitAreas.push({
    x: iDotCX - hitR,
    y: iDotCY - hitR,
    w: hitR * 2,
    h: hitR * 2,
    action: () => {
      state.currentLevel = 4;
      gc.render();
    },
  });
};
