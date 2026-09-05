import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, roundRect, getGuideTextMetrics } from '../renderer';
import { freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock, wrong } from './lateralHelpers';

// ── Q33 — Misplaced ───────────────────────────────────────────────────────────
// "One word on this page is wrong." The paragraph is flawless Institute
// boilerplate except that the word "because" sits in the middle of a sentence
// where it makes no sense. The examiner's own remark has the hole it fell out
// of: "Read it like it matters, ______ it does." Accusing a word costs a heart;
// dragging the wrong word into his gap costs a heart; dragging "because" down
// into the remarks hands it back and passes the item. Replaces the old
// "spot the misspelling" proofreading level.

const TEXT =
  'The Institute of Lateral Cognition certifies candidates on the basis of demonstrated thinking. ' +
  'Each item is reviewed twice. Results are final. The Institute because issues certificates annually, ' +
  'and reserves the right to revise any verdict without notice. Candidates who disagree with a verdict ' +
  'may submit an appeal in writing, which will be read, filed, and forgotten in that order.';

const WORDS = TEXT.split(' ');
const norm = (word: string) => word.replace(/[^A-Za-z]/g, '').toLowerCase();
const LOST_INDEX = WORDS.findIndex((word) => norm(word) === 'because');

const PREFIX = 'Quality control. One word on this page is wrong. Read it like it matters, ';
const GAP    = '______';
const SUFFIX = ' it does.';
const LINE1  = PREFIX + GAP + SUFFIX;

const LADDER = [
  'Wrong is not the same as misspelled. Some words are simply not where they belong.',
  'I seem to be missing one. Look at my remarks. Look at the gap.',
  'The word because is in your paragraph. It is mine. Drag it down here.',
];

interface WordRect { i: number; text: string; x: number; y: number; w: number; h: number; cx: number; cy: number; }
interface GapRect { x: number; y: number; w: number; h: number; cy: number; fontPx: number; }

let fails33   = 0;
let drag33: { i: number; x0: number; y0: number; moved: boolean } | null = null;
let wasDown33 = false;
let gone33    = false;   // "because" has been lifted out of the paragraph for good
let filled33  = false;   // the examiner's gap now reads "because"
let solvedAt33 = 0;
let hint33    = '';
let words33: WordRect[] = [];
let gapRect33: GapRect | null = null;
const clock33 = { last: 0, elapsed: 0 };

// The examiner speaks his permanent line; the ladder rung rides underneath it.
const remark = (gc: GameContext, line: string) => {
  hint33 = line;
  if (line) say(gc, LINE1, line);
  else say(gc, LINE1);
};

// Deferred by a tick: the release is detected inside the draw, and wrong() ends
// with a render of its own, which must not re-enter the frame being drawn.
const failed = (gc: GameContext, line?: string) => {
  setTimeout(() => {
    if (gc.state.currentLevel !== 33 || gc.state.levelSubPhase !== 'active' || solvedAt33) return;
    fails33++;
    wrong(gc);
    const rung = line || LADDER[Math.min(fails33 - 1, LADDER.length - 1)];
    setTimeout(() => {
      if (gc.state.currentLevel === 33 && gc.state.levelSubPhase === 'active' && !solvedAt33) {
        remark(gc, rung);
        gc.render();
      }
    }, 700);
  }, 0);
};

// ── the examiner's gap, measured inside his remarks ──────────────────────────
// drawBottomPanel draws remark line 0 with fillText(..., speechW), so an
// over-long line is condensed to exactly that width; the same factor is applied
// to the prefix so the gap lands on the underscores the panel actually drew.
const measureGap = (gc: GameContext): GapRect | null => {
  const r = gc.chrome.remarks;
  if (!r) return null;
  const { ctx, bodyFont } = gc;
  const m = getGuideTextMetrics(ctx);
  ctx.save();
  ctx.font = `${m.fontPx}px ${bodyFont}`;
  const fullW  = ctx.measureText(LINE1).width;
  const squash = fullW > r.w ? r.w / fullW : 1;
  const preW   = ctx.measureText(PREFIX).width * squash;
  const gapW   = ctx.measureText(GAP).width * squash;
  ctx.restore();
  const cy = r.y + m.lineGap / 2;
  return { x: r.x + preW, y: cy - m.lineGap / 2, w: gapW, h: m.lineGap, cy, fontPx: m.fontPx };
};

const overGap = (x: number, y: number, s: number) =>
  !!gapRect33 && inRect(x, y, {
    x: gapRect33.x - 24 * s, y: gapRect33.y - 18 * s,
    w: gapRect33.w + 48 * s, h: gapRect33.h + 36 * s,
  });

// Painted over the panel: erase the underscores, draw our own rule (or the
// returned word), then the dragged ghost so it can travel down off the paper.
const paintPanel = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const g = measureGap(gc);
  gapRect33 = g;
  if (g) {
    const hot = !!drag33 && drag33.moved && overGap(gc.mouseX, gc.mouseY, s);
    ctx.save();
    // erase the literal underscores the panel typed
    ctx.fillStyle = t.panel;
    ctx.fillRect(g.x - 1, g.cy - g.h * 0.42, g.w + 2, g.h * 0.92);
    if (filled33) {
      ctx.fillStyle = t.accent;
      ctx.font = `italic ${g.fontPx}px ${bodyFont}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('because', g.x, g.cy, g.w);
    } else {
      if (hot) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = t.accent;
        ctx.fillRect(g.x - 3 * s, g.cy - 11 * s, g.w + 6 * s, 19 * s);
        ctx.globalAlpha = 1;
      }
      // once the examiner has pointed at his own remarks, the rule breathes
      const pulse = fails33 >= 2 ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(clock33.elapsed * 3.2)) : 1;
      ctx.globalAlpha = hot ? 1 : pulse;
      ctx.fillStyle = hot ? t.accent : t.fgDim;
      ctx.fillRect(g.x, g.cy + g.fontPx * 0.40, g.w, 2 * s);
    }
    ctx.restore();
  }

  // the lifted word, riding the cursor
  if (drag33 && drag33.moved) {
    const fontPx = Math.round(21 * s);
    const label = WORDS[drag33.i];
    ctx.save();
    ctx.font = `${fontPx}px ${displayFont}`;
    const tw = ctx.measureText(label).width;
    const bw = tw + 16 * s, bh = fontPx * 1.5;
    ctx.translate(gc.mouseX, gc.mouseY);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.shadowColor = 'rgba(40,25,5,0.30)';
    ctx.shadowBlur = 16 * s;
    ctx.shadowOffsetY = 8 * s;
    ctx.fillStyle = t.panel;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = t.stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 4);
    ctx.stroke();
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
};

export const drawLevel33 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { topBoxY, topBoxWidth, topBoxHeight, w } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    gc.afterPanel = paintPanel;
    drawWinScreen(gc, 'RETURNED.', 'The word was fine. It was in the wrong paragraph. Corporate calls that a typo.', 34);
    return;
  }
  if (freshEntry(gc)) {
    fails33 = 0; drag33 = null; wasDown33 = false; gone33 = false; filled33 = false;
    solvedAt33 = 0; hint33 = ''; words33 = []; gapRect33 = null;
    clock33.last = 0; clock33.elapsed = 0;
    remark(gc, '');
  }
  levelClock(gc, clock33);

  // ── directive ──────────────────────────────────────────────────────────────
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('Q U A L I T Y   C O N T R O L', cx, topBoxY + topBoxHeight * 0.08);

  // ── the document: justified paragraph, one rect per word ───────────────────
  const docW = Math.min(820 * s, topBoxWidth * 0.82);
  const docX = cx - docW / 2;
  const docY = topBoxY + topBoxHeight * 0.22;
  const padX = 36 * s, padT = 28 * s, padB = 30 * s;
  const contentW = docW - padX * 2;
  const maxBottom = topBoxY + topBoxHeight - 8 * s;

  const visible = WORDS.map((text, i) => ({ text, i })).filter((entry) => !(gone33 && entry.i === LOST_INDEX));

  let fontPx = Math.round(21 * s);
  let lines: { text: string; i: number; w: number }[][] = [];
  let lineH = fontPx * 1.65;
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `${fontPx}px ${displayFont}`;
    const spaceW = ctx.measureText(' ').width;
    lines = [];
    let row: { text: string; i: number; w: number }[] = [];
    let rowW = 0;
    for (const entry of visible) {
      const ww = ctx.measureText(entry.text).width;
      const next = row.length ? rowW + spaceW + ww : ww;
      if (row.length && next > contentW) { lines.push(row); row = []; rowW = 0; }
      row.push({ text: entry.text, i: entry.i, w: ww });
      rowW = row.length === 1 ? ww : rowW + spaceW + ww;
    }
    if (row.length) lines.push(row);
    lineH = fontPx * 1.65;
    if (docY + padT + lines.length * lineH + padB <= maxBottom || fontPx <= 14) break;
    fontPx -= 1;
  }
  ctx.font = `${fontPx}px ${displayFont}`;
  const spaceW = ctx.measureText(' ').width;
  const docH = padT + lines.length * lineH + padB;

  ctx.fillStyle = t.bg;
  ctx.fillRect(docX, docY, docW, docH);
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(docX, docY, docW, docH);

  words33 = [];
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((row, li) => {
    const cy = docY + padT + lineH * (li + 0.5);
    const natural = row.reduce((sum, word) => sum + word.w, 0) + spaceW * (row.length - 1);
    const justify = li < lines.length - 1 && row.length > 1;
    const gapPx = justify ? spaceW + (contentW - natural) / (row.length - 1) : spaceW;
    let x = docX + padX;
    for (const word of row) {
      words33.push({ i: word.i, text: word.text, x: x - 2 * s, y: cy - lineH * 0.42, w: word.w + 4 * s, h: lineH * 0.84, cx: x + word.w / 2, cy });
      x += word.w + gapPx;
    }
  });

  for (const wr of words33) {
    const lifted = !!drag33 && drag33.moved && drag33.i === wr.i;
    const hover = !lifted && !drag33 && inputOpen(gc) && inRect(gc.mouseX, gc.mouseY, wr);
    if (hover) {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = t.accent;
      roundRect(ctx, wr.x, wr.y, wr.w, wr.h, 3);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = lifted ? 0.25 : 1;
    ctx.fillStyle = t.ink;
    ctx.fillText(wr.text, wr.x + 2 * s, wr.cy);
    ctx.restore();
    // cursor affordance only; picking up and dropping is polled, not clicked
    gc.hitAreas.push({ x: wr.x, y: wr.y, w: wr.w, h: wr.h, action: () => {} });
  }

  // ── pick up / carry / release (polled every frame) ─────────────────────────
  if (inputOpen(gc) && !solvedAt33) {
    if (!drag33 && gc.mouseDown && !wasDown33) {
      for (const wr of words33) {
        if (inRect(gc.mouseX, gc.mouseY, wr)) { drag33 = { i: wr.i, x0: gc.mouseX, y0: gc.mouseY, moved: false }; break; }
      }
    }
    if (drag33 && gc.mouseDown && !drag33.moved &&
        Math.hypot(gc.mouseX - drag33.x0, gc.mouseY - drag33.y0) > 6 * s) {
      drag33.moved = true;
      gc.sounds.ui('click');
    }
    if (drag33 && !gc.mouseDown) {
      const held = drag33;
      drag33 = null;
      const isLost = held.i === LOST_INDEX;
      if (!held.moved) {
        // a bare click accuses the word
        if (isLost) remark(gc, 'That is the word. It is not wrong. It is lost.');
        else failed(gc);
      } else if (overGap(gc.mouseX, gc.mouseY, s)) {
        if (isLost) {
          gone33 = true;
          filled33 = true;
          solvedAt33 = performance.now();
          gc.sounds.ui('thud');
          remark(gc, '...Thank you. That is mine.');
          setTimeout(() => {
            if (gc.state.currentLevel === 33 && gc.state.levelSubPhase === 'active') {
              gc.state.levelSubPhase = 'win';
              gc.render();
            }
          }, 900);
        } else {
          failed(gc, 'That is not my word.');
        }
      }
    }
  } else if (drag33 && !gc.mouseDown) {
    drag33 = null;
  }
  wasDown33 = gc.mouseDown;

  gc.afterPanel = paintPanel;

  (gc as unknown as { lv?: Record<string, unknown> }).lv = {
    fails: fails33,
    hint: hint33,
    dragging: drag33 ? WORDS[drag33.i] : '',
    moved: !!drag33 && drag33.moved,
    gone: gone33,
    filled: filled33,
    elapsed: clock33.elapsed,
    lostIndex: LOST_INDEX,
    lostWord: words33.find((wr) => wr.i === LOST_INDEX) ?? null,
    firstWord: words33[0] ?? null,
    gap: gapRect33,
  };
};
