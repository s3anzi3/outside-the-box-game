// How far the stone-border PNG extends outside the content/play area on each side.
// (Legacy constant kept for callers; the exam-paper chrome no longer uses a PNG frame.)
export const FRAME_BLEED = 0;

// ── Per-frame layout overrides set by the renderer / levels ──────────────────
// mode 'level' adds the paper's header band (item label + pause control) above the
// play area; 'plain' (menus, level select, full-takeover levels) uses the whole paper.
let layoutMode: "level" | "plain" = "plain";
// Extra width (canvas px) added to the paper's right edge — Q37 "Trim Marks".
let paperExtendPx = 0;

export const setLayoutMode = (mode: "level" | "plain") => { layoutMode = mode; };
export const setPaperExtend = (px: number) => { paperExtendPx = Math.max(0, px); };
export const getPaperExtend = () => paperExtendPx;

const scaleOf = (w: number, h: number) => Math.max(0.9, Math.min(Math.min(w / 1280, h / 800), 1.7));

export const getLayout = (ctx: CanvasRenderingContext2D) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const s = scaleOf(w, h);

  const contentWidth = w * 0.82;
  const contentX = (w - contentWidth) / 2;
  const logoY = h * 0.12;

  // ── The examination paper (the raised sheet) ───────────────────────────────
  // Geometry locked from the mocks: top 14.2%, height 50.3%, header band ~46px.
  const paperX = contentX;
  const paperY = h * 0.142;
  const paperW = contentWidth + paperExtendPx;
  const paperH = h * 0.503;
  const headerH = layoutMode === "level" ? Math.round(46 * s) : 0;

  // ── Play / content area: strictly below the header band ───────────────────
  // Every level positions its content relative to this box, so HUD chrome
  // never overlaps gameplay.
  const topBoxX      = paperX;
  const topBoxY      = paperY + headerH;
  const topBoxWidth  = paperW;
  const topBoxHeight = paperH - headerH;

  // Frame == the paper rect (legacy names kept for existing callers)
  const frameX = paperX;
  const frameY = paperY;
  const frameW = paperW;
  const frameH = paperH;

  // Safe inner area (legacy)
  const topInnerWidth  = topBoxWidth  * 0.42;
  const topInnerHeight = topBoxHeight * 0.62;
  const topInnerX      = w / 2 - topInnerWidth / 2;
  const topInnerY      = topBoxY + topBoxHeight * 0.16;

  const movementAreaWidth  = topBoxWidth  * 0.42;
  const movementAreaHeight = topBoxHeight * 0.62;
  const movementAreaX      = topInnerX;
  const movementAreaY      = topInnerY;

  // Examiner's panel below the paper
  const gap             = h * 0.038;
  const bottomBoxY      = paperY + paperH + gap;
  const bottomBoxHeight = h * 0.20;

  return {
    w,
    h,
    s,
    contentWidth,
    contentX,
    logoY,
    paperX,
    paperY,
    paperW,
    paperH,
    headerH,
    frameX,
    frameY,
    frameW,
    frameH,
    topBoxX,
    topBoxY,
    topBoxWidth,
    topBoxHeight,
    topInnerX,
    topInnerY,
    topInnerWidth,
    topInnerHeight,
    movementAreaX,
    movementAreaY,
    movementAreaWidth,
    movementAreaHeight,
    bottomBoxY,
    bottomBoxHeight,
  };
};

export const getMovementLayout = (ctx: CanvasRenderingContext2D) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  const gameFrameX = w * 0.05;
  const gameFrameY = h * 0.05;
  const gameFrameWidth = w * 0.9;
  const gameFrameHeight = h * 0.65;

  const bottomFrameX = 0;
  const bottomFrameY = h * 0.7;
  const bottomFrameWidth = w;
  const bottomFrameHeight = h * 0.3;

  const framePaddingX = 24;
  const framePaddingTop = 24;
  const framePaddingBottom = 24;
  const movementAreaX = gameFrameX + framePaddingX;
  const movementAreaY = gameFrameY + framePaddingTop;
  const movementAreaWidth = gameFrameWidth - framePaddingX * 2;
  const movementAreaHeight = gameFrameHeight - framePaddingTop - framePaddingBottom;

  return {
    w,
    h,
    gameFrameX,
    gameFrameY,
    gameFrameWidth,
    gameFrameHeight,
    bottomFrameX,
    bottomFrameY,
    bottomFrameWidth,
    bottomFrameHeight,
    movementAreaX,
    movementAreaY,
    movementAreaWidth,
    movementAreaHeight,
  };
};
