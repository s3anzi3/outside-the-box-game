import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawChoice, wrong, drawWinScreen } from './lateralHelpers';

export const drawLevel9 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  if (state.levelSubPhase === "win") {
    gc.afterPanel = undefined;
    drawWinScreen(gc, "SHOW ALL WORK.",
      "Every option was wrong on purpose. When none of the answers fit, question the question.", 10);
    return;
  }

  // Integral: (x-1)^2 from 1 to 4
  // Answer is 9 via u-sub: [(x-1)^3 / 3] from 1 to 4 = 27/3 - 0 = 9
  // The number 9 never appears in the expression itself.
  const integralCY = topBoxY + topBoxHeight * 0.40;
  const integralX  = cx - 70;

  // large integral sign
  ctx.fillStyle    = t.fg;
  ctx.font         = `88px serif`;
  ctx.textAlign    = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("\u222b", integralX, integralCY + topBoxHeight * 0.015);

  // upper bound: 4
  ctx.font         = `bold 20px ${displayFont}`;
  ctx.textAlign    = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("4", integralX + 2, integralCY - topBoxHeight * 0.085);

  // lower bound: 1
  ctx.textBaseline = "top";
  ctx.fillText("1", integralX - 4, integralCY + topBoxHeight * 0.085);

  // integrand: (x-1)^2
  const exprX = integralX + 8;
  ctx.font         = `bold 32px serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "left";
  ctx.fillText("(x\u22121)", exprX, integralCY);

  // superscript 2
  ctx.font         = `bold 18px serif`;
  ctx.textBaseline = "top";
  ctx.fillText("2", exprX + 82, integralCY - 20);

  // dx
  ctx.font         = `bold 32px serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign    = "left";
  ctx.fillText(" dx", exprX + 100, integralCY);

  // Answer buttons — all wrong; correct answer (9) is not shown here.
  // 27: forgot to divide by 3, used [(x-1)^3] = 27
  // 18: doubled result from a symmetry assumption
  //  0: treated it like an odd function that cancels (wrong, it's a square)
  //  6: differentiated instead: 2(x-1) at x=4 gives 6
  const options   = ["27", "18", "0", "6"];
  const btnW      = topBoxWidth * 0.17;
  const btnH      = topBoxHeight * 0.15;
  const btnGap    = topBoxWidth * 0.025;
  const totalBW   = btnW * 4 + btnGap * 3;
  const btnStartX = cx - totalBW / 2;
  const btnY      = topBoxY + topBoxHeight * 0.72;

  for (let i = 0; i < options.length; i++) {
    const bx = btnStartX + i * (btnW + btnGap);
    drawChoice(gc, options[i], bx, btnY, btnW, btnH, () => wrong(gc), { fontSize: 28 });
  }

  // Secret hit area: clicking the "Q.9" label in the paper's header band advances the level.
  // The label is drawn by drawLevelHUD after this function, so the rect is read in afterPanel.
  gc.afterPanel = (g) => {
    const r = g.chrome.qLabel;
    if (!r) return;
    g.hitAreas.push({
      x: r.x, y: r.y, w: r.w, h: r.h,
      noCursor: true,
      action: () => {
        state.levelSubPhase = "win";
        state.levelTimerEnd = 0;
        g.render();
      },
    });
  };
};
