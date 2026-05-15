import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';

// ── Logic: (P → Q) ∧ (Q → P) ─────────────────────────────────────────────────
// Rows: [T,T] [T,F] [F,T] [F,F]
// Fillable columns per row: [P→Q,  Q→P,  Result]
const P_COL  = ['T','T','F','F'] as const;
const Q_COL  = ['T','F','T','F'] as const;
const ANSWER: ['T'|'F','T'|'F','T'|'F'][] = [
  ['T','T','T'],
  ['F','T','F'],
  ['T','F','F'],
  ['T','T','T'],
];
const COL_HEADS = ['P', 'Q', 'P → Q', 'Q → P', 'Result'];

type Cell = 'T' | 'F' | '?';

function fresh23(): Cell[][] {
  return Array.from({ length: 4 }, () => ['?', '?', '?'] as Cell[]);
}
function nextVal(c: Cell): Cell { return c === '?' ? 'T' : c === 'T' ? 'F' : '?'; }
function allFilled(cells: Cell[][]): boolean { return cells.every(r => r.every(c => c !== '?')); }
function allCorrect(cells: Cell[][]): boolean {
  return cells.every((r, ri) => r.every((c, ci) => c === ANSWER[ri][ci]));
}

// ── Module state ──────────────────────────────────────────────────────────────
let cells23: Cell[][] = fresh23();

// ── Draw ──────────────────────────────────────────────────────────────────────
export const drawLevel23 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Win screen ───────────────────────────────────────────────────────────────
  if (state.levelSubPhase === 'win') {
    ctx.fillStyle    = t.fg;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 44px ${displayFont}`;
    ctx.fillText('CASE CLOSED.', cx, topBoxY + topBoxHeight * 0.32);
    ctx.font      = `19px ${bodyFont}`;
    ctx.fillStyle = t.fgMid;
    ctx.fillText('The vault is secure when both conditions match.', cx, topBoxY + topBoxHeight * 0.47);
    ctx.font      = `14px ${bodyFont}`;
    ctx.fillStyle = t.fgDim;
    ctx.fillText('(P → Q) ∧ (Q → P)  is equivalent to  P ↔ Q', cx, topBoxY + topBoxHeight * 0.56);
    drawButton(gc, 'CONTINUE  →', cx - 100, topBoxY + topBoxHeight * 0.68, 200, 48, () => {
      state.currentLevel  = 24;
      state.levelSubPhase = '';
      gc.render();
    });
    return;
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    cells23 = fresh23();
    state.levelSubPhase = 'active';
  }

  // ── Plot header ───────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 15px ${displayFont}`;
  ctx.fillText('CASE FILE  #7 — VAULT SECURITY PROTOCOL', cx, topBoxY + topBoxHeight * 0.05);

  ctx.font      = `12px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  ctx.fillText('The vault has two conditions:   P — vault is sealed     Q — guard is on duty', cx, topBoxY + topBoxHeight * 0.11);

  ctx.font      = `bold 12px ${bodyFont}`;
  ctx.fillStyle = t.fgDim;
  ctx.fillText('Security passes when:   (P → Q)  ∧  (Q → P)', cx, topBoxY + topBoxHeight * 0.17);

  // ── Truth table ───────────────────────────────────────────────────────────────
  const tblW  = topBoxWidth  * 0.76;
  const colW  = tblW / 5;
  const rowH  = topBoxHeight * 0.097;
  const tblH  = rowH * 5;
  const tblX  = cx - tblW / 2;
  const tblY  = topBoxY + topBoxHeight * 0.22;

  // Header background
  ctx.fillStyle = state.darkMode ? '#1e1e1e' : '#d8d8d8';
  ctx.fillRect(tblX, tblY, tblW, rowH);

  // Outer border
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth   = 2;
  ctx.strokeRect(tblX, tblY, tblW, tblH);

  // Inner grid lines
  ctx.strokeStyle = t.divider;
  ctx.lineWidth   = 1;
  for (let r = 1; r < 5; r++) {
    ctx.beginPath();
    ctx.moveTo(tblX, tblY + r * rowH);
    ctx.lineTo(tblX + tblW, tblY + r * rowH);
    ctx.stroke();
  }
  for (let c = 1; c < 5; c++) {
    ctx.beginPath();
    ctx.moveTo(tblX + c * colW, tblY);
    ctx.lineTo(tblX + c * colW, tblY + tblH);
    ctx.stroke();
  }
  // Separator after Q column (thicker)
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(tblX + 2 * colW, tblY);
  ctx.lineTo(tblX + 2 * colW, tblY + tblH);
  ctx.stroke();

  // Header text
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 13px ${bodyFont}`;
  COL_HEADS.forEach((h, i) => {
    ctx.fillStyle = i < 2 ? t.fgDim : t.fgMid;
    ctx.fillText(h, tblX + colW * i + colW / 2, tblY + rowH / 2);
  });

  // Data rows
  for (let r = 0; r < 4; r++) {
    const ry  = tblY + (r + 1) * rowH;
    const rcy = ry + rowH / 2;

    // Fixed P, Q
    ctx.fillStyle = t.fgDim;
    ctx.font      = `bold 15px ${bodyFont}`;
    ctx.textAlign = 'center';
    ctx.fillText(P_COL[r], tblX + colW * 0.5, rcy);
    ctx.fillText(Q_COL[r], tblX + colW * 1.5, rcy);

    // Fillable cells (columns 2, 3, 4)
    for (let fi = 0; fi < 3; fi++) {
      const colIdx = fi + 2;
      const cellX  = tblX + colIdx * colW;
      const cellCX = cellX + colW / 2;
      const val    = cells23[r][fi];

      // Hover highlight
      const over = gc.mouseX >= cellX && gc.mouseX <= cellX + colW &&
                   gc.mouseY >= ry    && gc.mouseY <= ry + rowH;
      if (over) {
        ctx.fillStyle = state.darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(cellX + 1, ry + 1, colW - 2, rowH - 2);
      }

      // Cell value
      if (val === '?') {
        ctx.fillStyle    = t.fgDim;
        ctx.font         = `14px ${bodyFont}`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('—', cellCX, rcy);
      } else {
        ctx.fillStyle = val === 'T'
          ? (state.darkMode ? '#55cc77' : '#1a7a3a')
          : (state.darkMode ? '#ee5555' : '#bb1111');
        ctx.font      = `bold 17px ${displayFont}`;
        ctx.textAlign = 'center';
        ctx.fillText(val, cellCX, rcy);
      }

      // Hit area
      const cr = r, cfi = fi;
      gc.hitAreas.push({
        x: cellX, y: ry, w: colW, h: rowH,
        action: () => {
          cells23[cr][cfi] = nextVal(cells23[cr][cfi]);
          feedback = '';
          gc.render();
        },
      });
    }
  }

  // Small instruction below table
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `10px ${bodyFont}`;
  ctx.fillText('Click cells to cycle  T / F / —', cx, tblY + tblH + 10);

  // ── Conclusion options ────────────────────────────────────────────────────────
  const tableOK = allFilled(cells23) && allCorrect(cells23);
  const optBtnW = topBoxWidth  * 0.44;
  const optBtnH = 36;
  const optGapX = topBoxWidth  * 0.03;
  const optGapY = 7;
  const optY0   = topBoxY + topBoxHeight * 0.78;

  const opts = [
    { text: 'Protocol is always satisfied',         right: false },
    { text: 'Satisfied only when vault is sealed',  right: false },
    { text: 'Satisfied when both conditions match', right: true  },
    { text: 'Protocol is never satisfied',          right: false },
  ];

  opts.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx  = cx - optBtnW - optGapX / 2 + col * (optBtnW + optGapX);
    const by  = optY0 + row * (optBtnH + optGapY);

    // Uniform stone-tile background — same as Level 3 / Level 9 buttons
    if (gc.levelBGLoaded) {
      ctx.drawImage(gc.levelBGImg, 326, 132, 888, 810, bx, by, optBtnW, optBtnH);
    } else {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth   = 1.5;
      ctx.strokeRect(bx, by, optBtnW, optBtnH);
    }

    ctx.fillStyle    = '#1a1a1a';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 12px ${bodyFont}`;
    ctx.fillText(opt.text, bx + optBtnW / 2, by + optBtnH / 2, optBtnW - 12);

    gc.hitAreas.push({
      x: bx, y: by, w: optBtnW, h: optBtnH,
      action: () => {
        if (opt.right && tableOK) {
          state.levelSubPhase = 'win';
        } else {
          gc.loseLife();
        }
        gc.render();
      },
    });
  });
};
