import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { roundRect, drawDocumentBox, uiScale } from "../renderer";

export const drawControlsOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t = getTheme(state);
  const s = uiScale(ctx);

  const pad = topBoxWidth * 0.05;
  const ox = topBoxX + pad;
  const oy = topBoxY + pad;
  const ow = topBoxWidth - pad * 2;
  const oh = topBoxHeight - pad * 2;
  const cx = ox + ow / 2;

  drawDocumentBox(gc, ox, oy, ow, oh, { title: "Examination Guidelines" });

  ctx.fillStyle = t.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(27 * s)}px ${displayFont}`;
  ctx.fillText("Basic Controls", cx, oy + oh * 0.12);

  const controls = [
    { key: "W / A / S / D", desc: "Move / Navigate" },
    { key: "H",            desc: "Hold / Release Blocks" },
    { key: "CLICK",        desc: "Interact / Select answer" },
    { key: "ESC",          desc: "Close this panel" },
  ];

  const listY    = oy + oh * 0.28;
  const rowH     = oh * 0.15;
  const keyBoxW  = ow * 0.3;
  const keyBoxH  = rowH * 0.7;
  const keyBoxX  = ox + ow * 0.08;
  const descX    = ox + ow * 0.5;

  for (let i = 0; i < controls.length; i++) {
    const rowY = listY + i * rowH;
    const boxCenterY = rowY + keyBoxH / 2;

    // keycap
    roundRect(ctx, keyBoxX, rowY, keyBoxW, keyBoxH, 4);
    ctx.fillStyle = t.bg;
    ctx.fill();
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = t.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(15 * s)}px ${monoFont}`;
    ctx.fillText(controls[i].key, keyBoxX + keyBoxW / 2, boxCenterY, keyBoxW - 12);

    ctx.fillStyle = t.fgMid;
    ctx.textAlign = "left";
    ctx.font = `${Math.round(17 * s)}px ${bodyFont}`;
    ctx.fillText(controls[i].desc, descX, boxCenterY);
  }

  ctx.fillStyle = t.fgDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText("CONTROLS MAY VARY BETWEEN ITEMS   ·   PRESS ESC TO CLOSE", cx, oy + oh * 0.9);
};
