import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale }     from '../renderer';
import { wrong }       from './lateralHelpers';

// ── Letter layout (33 letters, exactly 13 F's) ────────────────────────────────
// cx/cy are normalised 0-1 within the chalkboard area
interface BoardLetter { char: string; cx: number; cy: number; size: number; }

const LETTERS: BoardLetter[] = [
  { char:'F', cx:0.08, cy:0.14, size:28 }, { char:'E', cx:0.18, cy:0.10, size:24 },
  { char:'F', cx:0.28, cy:0.18, size:30 }, { char:'T', cx:0.39, cy:0.12, size:26 },
  { char:'P', cx:0.50, cy:0.17, size:25 }, { char:'I', cx:0.60, cy:0.11, size:27 },
  { char:'F', cx:0.71, cy:0.16, size:29 }, { char:'L', cx:0.82, cy:0.13, size:24 },
  { char:'E', cx:0.92, cy:0.18, size:26 },
  { char:'F', cx:0.06, cy:0.33, size:31 }, { char:'T', cx:0.16, cy:0.28, size:25 },
  { char:'F', cx:0.28, cy:0.36, size:27 }, { char:'E', cx:0.39, cy:0.30, size:28 },
  { char:'F', cx:0.51, cy:0.35, size:30 }, { char:'P', cx:0.62, cy:0.29, size:24 },
  { char:'I', cx:0.73, cy:0.34, size:26 }, { char:'T', cx:0.84, cy:0.31, size:28 },
  { char:'F', cx:0.94, cy:0.37, size:22 },
  { char:'E', cx:0.10, cy:0.52, size:27 }, { char:'L', cx:0.21, cy:0.48, size:25 },
  { char:'F', cx:0.34, cy:0.55, size:29 }, { char:'P', cx:0.45, cy:0.50, size:26 },
  { char:'I', cx:0.56, cy:0.57, size:28 }, { char:'F', cx:0.67, cy:0.49, size:24 },
  { char:'E', cx:0.78, cy:0.54, size:30 }, { char:'T', cx:0.89, cy:0.51, size:25 },
  { char:'F', cx:0.12, cy:0.72, size:32 }, { char:'L', cx:0.25, cy:0.68, size:26 },
  { char:'F', cx:0.38, cy:0.75, size:28 }, { char:'E', cx:0.52, cy:0.70, size:27 },
  { char:'F', cx:0.65, cy:0.76, size:30 }, { char:'P', cx:0.77, cy:0.69, size:24 },
  { char:'F', cx:0.89, cy:0.74, size:26 },
];
// F's at indices: 0,2,6,9,11,13,17,20,23,26,28,30,32 = 13 ✓

const BOARD_FRAC = 0.72;   // top 72% of topBox is chalkboard
const ERASER_W   = 52;
const ERASER_H   = 22;
const ERASE_PAD  = 14;     // px tolerance around eraser rect for erasure

// ── Eraser state ──────────────────────────────────────────────────────────────
let eraserX    = -1;
let eraserY    = -1;
let isDragging = false;
const erasedSet = new Set<number>();

export const drawLevel7 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t = getTheme(state);

  // Reset on fresh entry
  if (state.levelSubPhase !== "active") {
    eraserX = -1; eraserY = -1;
    isDragging = false;
    erasedSet.clear();
    state.levelSubPhase = "active";
  }

  const boardH = topBoxHeight * BOARD_FRAC;
  const deskY  = topBoxY + boardH;
  const deskH  = topBoxHeight - boardH;

  // Init eraser position on desk
  if (eraserX < 0) {
    eraserX = topBoxX + topBoxWidth * 0.14;
    eraserY = deskY   + deskH * 0.28;
  }

  // ── Eraser drag logic ─────────────────────────────────────────────────────
  if (gc.mouseDown) {
    const ecx  = eraserX + ERASER_W / 2;
    const ecy  = eraserY + ERASER_H / 2;
    const dist = Math.sqrt((gc.mouseX - ecx) ** 2 + (gc.mouseY - ecy) ** 2);
    if (dist < 55 || isDragging) {
      isDragging = true;
      eraserX    = gc.mouseX - ERASER_W / 2;
      eraserY    = gc.mouseY - ERASER_H / 2;

      // Erase letters the eraser overlaps
      LETTERS.forEach((l, i) => {
        if (erasedSet.has(i)) return;
        const lx = topBoxX + l.cx * topBoxWidth;
        const ly = topBoxY + l.cy * boardH;
        if (lx >= eraserX - ERASE_PAD && lx <= eraserX + ERASER_W + ERASE_PAD &&
            ly >= eraserY - ERASE_PAD && ly <= eraserY + ERASER_H + ERASE_PAD) {
          erasedSet.add(i);
        }
      });
    }
  } else {
    isDragging = false;
  }

  // Eraser audio — loop while dragging, stop when released
  if (isDragging) {
    gc.sounds.play("eraser", { loop: true, volume: 0.5, restart: false });
  } else {
    gc.sounds.stop("eraser");
  }


  // ── Draw chalkboard ───────────────────────────────────────────────────────
  ctx.fillStyle = "#1b3320";
  ctx.fillRect(topBoxX, topBoxY, topBoxWidth, boardH);

  // Frame around board
  ctx.strokeStyle = "#5a3a14";
  ctx.lineWidth   = 14;
  ctx.strokeRect(topBoxX, topBoxY, topBoxWidth, boardH);

  // Chalk tray at bottom of board
  ctx.fillStyle = "#5a3a14";
  ctx.fillRect(topBoxX, topBoxY + boardH - 14, topBoxWidth, 14);

  // Letters
  LETTERS.forEach((l, i) => {
    if (erasedSet.has(i)) return;
    const lx = topBoxX + l.cx * topBoxWidth;
    const ly = topBoxY + l.cy * boardH;
    // Slight opacity variation for chalk effect
    const alpha = 0.72 + (i % 5) * 0.04;
    ctx.fillStyle    = `rgba(225, 218, 200, ${alpha})`;
    ctx.font         = `bold ${l.size}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(l.char, lx, ly);
  });

  // Eraser smudge marks (subtle chalk dust)
  if (erasedSet.size > 0) {
    ctx.fillStyle = "rgba(200,200,180,0.06)";
    erasedSet.forEach(i => {
      const l  = LETTERS[i];
      const lx = topBoxX + l.cx * topBoxWidth;
      const ly = topBoxY + l.cy * boardH;
      ctx.fillRect(lx - 20, ly - 16, 40, 32);
    });
  }

  // ── Draw desk ─────────────────────────────────────────────────────────────
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(topBoxX, deskY, topBoxWidth, deskH);
  // desk top edge
  ctx.fillStyle = "#8b5c30";
  ctx.fillRect(topBoxX, deskY, topBoxWidth, 5);

  // Stack of books (right side)
  const bookX = topBoxX + topBoxWidth * 0.76;
  const bookBaseY = deskY + deskH * 0.55;
  [["#8b2222", 56, 14], ["#224488", 52, 14], ["#1a5c1a", 58, 13]].forEach(([col, bw, bh], b) => {
    ctx.fillStyle = col as string;
    ctx.fillRect(bookX, bookBaseY - b * (bh as number + 1), bw as number, bh as number);
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1;
    ctx.strokeRect(bookX, bookBaseY - b * (bh as number + 1), bw as number, bh as number);
  });

  // Pencil on desk
  const penX = topBoxX + topBoxWidth * 0.88;
  const penY = deskY + deskH * 0.25;
  ctx.fillStyle = "#e8c844";
  ctx.fillRect(penX, penY, 8, 58);
  ctx.fillStyle = "#cc4444";
  ctx.fillRect(penX, penY + 50, 8, 8);
  ctx.fillStyle = "#f5d5a0";
  ctx.beginPath(); ctx.moveTo(penX, penY + 58); ctx.lineTo(penX + 4, penY + 68); ctx.lineTo(penX + 8, penY + 58); ctx.fill();

  // ── Draw eraser ───────────────────────────────────────────────────────────
  ctx.fillStyle   = "#f0b8b8";
  ctx.fillRect(eraserX, eraserY, ERASER_W, ERASER_H);
  ctx.strokeStyle = "#cc8888";
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(eraserX, eraserY, ERASER_W, ERASER_H);
  // stripe detail
  ctx.strokeStyle = "rgba(200,120,120,0.5)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(eraserX + 10, eraserY); ctx.lineTo(eraserX + 10, eraserY + ERASER_H);
  ctx.moveTo(eraserX + 20, eraserY); ctx.lineTo(eraserX + 20, eraserY + ERASER_H);
  ctx.stroke();

  // Live count of F's still visible on the board
  const remainingFs = LETTERS.filter((l, i) => l.char === 'F' && !erasedSet.has(i)).length;

  // ── Answer buttons ────────────────────────────────────────────────────────
  // Correct answer = whichever option matches the actual number of F's still on board.
  // "15" is always wrong (only 13 F's exist). 8, 11, 0 are correct if that many remain.
  const options    = ["8", "11", "15", "0"];
  const btnW       = topBoxWidth * 0.145;
  const btnH       = deskH  * 0.40;
  const btnGap     = topBoxWidth * 0.028;
  const totalBW    = btnW * 4 + btnGap * 3;
  const btnStartX  = topBoxX + (topBoxWidth - totalBW) / 2;
  const btnY       = deskY + deskH * 0.50;

  options.forEach((opt, i) => {
    const bx      = btnStartX + i * (btnW + btnGap);

    // All buttons always active — same styling
    ctx.fillStyle    = "#e8e0cc";
    ctx.fillRect(bx, btnY, btnW, btnH);
    ctx.strokeStyle  = "#5a3a14";
    ctx.lineWidth    = 1.5;
    ctx.strokeRect(bx, btnY, btnW, btnH);
    ctx.fillStyle    = "#2a1a08";
    ctx.font         = `bold ${Math.round(22 * uiScale(ctx))}px ${displayFont}`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opt, bx + btnW / 2, btnY + btnH / 2);

    if (!isDragging) {
      gc.hitAreas.push({
        x: bx, y: btnY, w: btnW, h: btnH,
        action: () => {
          if (parseInt(opt) === remainingFs) {
            // Correct — answer matches actual visible F count
            eraserX = -1; erasedSet.clear(); isDragging = false;
            gc.sounds.ui("chime");
            state.currentLevel  = 8;
            state.levelSubPhase = "";
            gc.render();
          } else {
            wrong(gc);
          }
        },
      });
    }
  });
};
