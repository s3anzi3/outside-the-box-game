import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';
import { drawChoice }  from './lateralHelpers';

export const drawLevel8 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  const phase = state.levelSubPhase || "stranger";

  // Cover the gameplay frame border — this level renders as a standalone interaction
  ctx.fillStyle = t.bg;
  ctx.fillRect(topBoxX, topBoxY, topBoxWidth, topBoxHeight);

  // ── shared panel (no border) ──────────────────────────────────────────────
  const panelW = topBoxWidth  * 0.82;
  const panelH = topBoxHeight * 0.80;
  const panelX = topBoxX + (topBoxWidth  - panelW) / 2;
  const panelY = topBoxY + (topBoxHeight - panelH) / 2;

  ctx.fillStyle = t.bg;
  ctx.fillRect(panelX, panelY, panelW, panelH);

  // ── PHASE: stranger ───────────────────────────────────────────────────────
  if (phase === "stranger") {
    // Beggar image — left side of panel
    const imgW = panelW * 0.30;
    const imgH = gc.beggarLoaded
      ? imgW * (gc.beggarImg.naturalHeight / gc.beggarImg.naturalWidth)
      : imgW;
    const imgX = panelX + panelW * 0.005;
    const imgY = panelY + (panelH * 0.82 - imgH) / 2;
    if (gc.beggarLoaded) {
      ctx.drawImage(gc.beggarImg, imgX, imgY, imgW, imgH);
    }

    // ── Speech bubble (canvas-drawn rounded rect) ─────────────────────────
    const bubbleX = panelX + panelW * 0.33;
    const bubbleY = panelY + panelH * 0.03;
    const bubbleW = panelW * 0.63;
    const bubbleH = panelH * 0.60;
    // Stone-matching flat color — same visual tone as the levelBGImg button tiles
    // without the distortion caused by scaling the framed button image to bubble size
    const bubbleFill   = t.panel;
    const bubbleRadius = 12;

    // Pointer triangle
    const ptrTip = bubbleX - panelW * 0.03;
    ctx.fillStyle = bubbleFill;
    ctx.beginPath();
    ctx.moveTo(bubbleX, bubbleY + bubbleH * 0.36);
    ctx.lineTo(ptrTip,  bubbleY + bubbleH * 0.50);
    ctx.lineTo(bubbleX, bubbleY + bubbleH * 0.58);
    ctx.fill();

    // Bubble background + border
    ctx.fillStyle   = bubbleFill;
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, bubbleRadius);
    ctx.fill();
    ctx.stroke();

    // Speech text
    const bx = bubbleX + bubbleW / 2;
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";

    ctx.fillStyle = t.ink;
    ctx.font      = `bold 15px ${bodyFont}`;
    ctx.fillText("Please\u2026 I\u2019m begging you.", bx, bubbleY + bubbleH * 0.07, bubbleW * 0.84);

    ctx.font      = `14px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    const speechLines = [
      "My daughter needs a heart transplant.",
      "Without it, she won\u2019t survive the week.",
      "",
      "I\u2019ll give you 3 level skips in exchange",
      "for just one of your hearts.",
      "",
      "You have plenty to spare.",
      "She has nothing.",
    ];
    const slH      = 21;
    const slStartY = bubbleY + bubbleH * 0.20;
    for (let i = 0; i < speechLines.length; i++) {
      ctx.fillText(speechLines[i], bx, slStartY + i * slH, bubbleW * 0.84);
    }

    // ── Buttons ───────────────────────────────────────────────────────────
    const btnW      = 170;
    const btnH      = 52;
    const btnGap    = panelW * 0.05;
    const totalBW   = btnW * 2 + btnGap;
    const btnY      = panelY + panelH * 0.82;
    const btnStartX = cx - totalBW / 2;

    // "Give Heart" — paper card with the heart PNG on top
    drawChoice(gc, "", btnStartX, btnY, btnW, btnH, () => {
      gc.loseLife();
      state.levelSubPhase = "scammed";
      gc.render();
    });
    if (gc.heartLoaded) {
      const heartSize = Math.round(btnH * 0.72);
      ctx.drawImage(gc.heartImg, 274, 0, 1011, 864,
        btnStartX + btnW / 2 - heartSize / 2, btnY + btnH / 2 - heartSize / 2, heartSize, heartSize);
    }

    // "Let a CHILD Die" — the cold, correct choice
    const childBtnX = btnStartX + btnW + btnGap;
    drawChoice(gc, "Let a CHILD Die", childBtnX, btnY, btnW, btnH, () => {
      gc.sounds.ui("chime");
      state.currentLevel  = 9;
      state.levelSubPhase = "";
      state.levelTimerEnd = 0;
      gc.render();
    }, { fontSize: 15 });

    return;
  }

  // ── PHASE: scammed ────────────────────────────────────────────────────────
  if (phase === "scammed") {
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";

    ctx.fillStyle = t.fgDim;
    ctx.font      = `italic 15px ${bodyFont}`;
    ctx.fillText("*The man runs off with your heart*", cx, panelY + panelH * 0.08, panelW * 0.82);

    ctx.fillStyle = t.fg;
    ctx.font      = `bold 22px ${displayFont}`;
    ctx.fillText("\"Gullible, are ya?\"", cx, panelY + panelH * 0.20, panelW * 0.82);

    ctx.font      = `16px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    const msg = [
      "Did you even see a child with him?",
      "He will probably sell it on the dark web or something.",
      "",
      "What's even worse is I think he had a Tatum Jersey on.",
      "Imagine he buys Celtics tickets with the money?",
      "",
      "What a waste!",
    ];
    const lineH  = 26;
    const startY = panelY + panelH * 0.34;
    for (let i = 0; i < msg.length; i++) {
      ctx.fillText(msg[i], cx, startY + i * lineH, panelW * 0.82);
    }

    const btnW = 150;
    const btnH = 42;
    drawButton(gc, "CONTINUE", cx - btnW / 2, panelY + panelH * 0.84, btnW, btnH, () => {
      state.currentLevel  = 9;
      state.levelSubPhase = "";
      state.levelTimerEnd = 0;
      gc.render();
    });
  }
};
