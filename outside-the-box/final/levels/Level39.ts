import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { uiScale, roundRect } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, levelClock } from './lateralHelpers';

// ── Q39 — Issued to the Invigilator ───────────────────────────────────────────
// "The instruction for this question has been issued to the invigilator."
// A B C D are on the paper and every one of them costs a heart, D included,
// because the instruction has not been issued yet. The invigilator is the pause
// screen: its INVIGILATOR OVERRIDE box reads "PRESS D · NOT YET ISSUED" and the
// › button beside it (which no level has ever used) is the signature. Press it,
// the box flips to ISSUED, and only then is D a real answer.

const LADDER = [
  'Not yet. The instruction is in the suspension screen, waiting for a signature.',
  'Pause. Find the invigilator\'s box. Press the button beside it.',
  'It says PRESS D. Press the › to issue it. Then press D.',
];
const OPENING   = 'Issued to the invigilator. Nothing on this paper is valid until the invigilator signs it.';
const UNISSUED  = 'That has not been issued yet.';
const SIGNED    = 'Issued. The invigilator has signed it. D is now a real answer.';
const MY_BOX    = 'That is my box. It needs a signature. The button beside it.';

const BOX_UNISSUED = 'PRESS D · NOT YET ISSUED';
const BOX_ISSUED   = '✓ PRESS D · ISSUED';

const LETTERS = ['A', 'B', 'C', 'D'];

let fails39   = 0;
let issued39  = false;
let opened39  = false;   // the suspension screen has been seen at least once
let pulseAt39 = 0;       // performance.now() when the › ring started pulsing
const clock39 = { last: 0, elapsed: 0 };

// The INVIGILATOR OVERRIDE box + › button live in the pause overlay. These rects
// mirror the geometry in overlays/PauseOverlay.ts so this level can pulse the
// chevron and answer a click on the box itself.
const cheatRects = (gc: GameContext) => {
  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(gc.ctx);
  const pad = topBoxWidth * 0.05;
  const ox = topBoxX + pad, oy = topBoxY + pad;
  const ow = topBoxWidth - pad * 2, oh = topBoxHeight - pad * 2;
  const sliderW = Math.min(ow * 0.34, 220);
  const sliderX = ox + ow * 0.14;
  const sliderY = oy + oh * 0.54;
  const boxW = sliderW, boxH = 38;
  const boxX = sliderX, boxY = sliderY + 38;
  return {
    box: { x: boxX, y: boxY, w: boxW, h: boxH },
    go:  { x: boxX + boxW + 12, y: boxY, w: 40, h: boxH },
  };
};

// Word-wrap a line of display text into at most `maxWidth` px.
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

export const drawLevel39 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    drawWinScreen(
      gc,
      'ISSUED.',
      'The instruction was real once the invigilator signed it. That button has now been used exactly once.',
      40,
    );
    return;
  }
  if (freshEntry(gc)) {
    fails39 = 0; issued39 = false; opened39 = false; pulseAt39 = 0;
    clock39.last = 0; clock39.elapsed = 0;
    // The box has to read as the invigilator's instruction, not as a half-typed
    // override key left behind on an earlier item.
    state.pauseCheatInput = '';
    state.pauseCheatFocused = false;
    say(gc, OPENING);
  }

  // Pause-aware level clock: it must not advance while the exam is suspended.
  levelClock(gc, clock39);

  // The invigilator's box, re-declared every frame (chrome overrides are cleared
  // on level change, and the › handler is a per-draw hook).
  state.pauseCheatPlaceholder = issued39 ? BOX_ISSUED : BOX_UNISSUED;
  state.pauseCheatDone = issued39;
  gc.pauseCheatHandler = () => {
    if (issued39) return false;                              // already signed: nothing to consume
    if (state.pauseCheatInput === 'SBUOTB') return false;    // leave the real override key alone
    issued39 = true;
    state.pauseCheatDone = true;
    state.pauseCheatPlaceholder = BOX_ISSUED;
    gc.sounds.ui('seal');
    say(gc, SIGNED);
    return true;
  };

  // First time the candidate suspends the exam, the chevron pulses three times.
  if (state.paused && !opened39) { opened39 = true; pulseAt39 = performance.now(); }

  (gc as unknown as { lv: Record<string, unknown> }).lv = {
    issued: issued39,
    fails: fails39,
    opened: opened39,
    elapsed: Math.round(clock39.elapsed * 100) / 100,
  };

  // ── paper ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = t.fgDim;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText('I N S T R U C T I O N   W I T H H E L D', cx, topBoxY + topBoxHeight * 0.12);

  ctx.fillStyle = t.ink;
  ctx.font = `${Math.round(30 * s)}px ${displayFont}`;
  const promptW = topBoxWidth * 0.77;
  const lines = wrapText(ctx, 'The instruction for this question has been issued to the invigilator.', promptW);
  const lineH = Math.round(40 * s);
  let ty = topBoxY + topBoxHeight * 0.22 + lineH * 0.5;
  for (const ln of lines) { ctx.fillText(ln, cx, ty, promptW); ty += lineH; }

  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  ctx.fillText('S E L E C T   T H E   I N D I C A T E D   B U T T O N', cx, ty);

  // ── A B C D ────────────────────────────────────────────────────────────────
  const bw  = topBoxWidth * 0.1437;
  const bh  = topBoxHeight * 0.152;
  const gap = topBoxWidth * 0.0345;
  const total = bw * 4 + gap * 3;
  const bx0 = cx - total / 2;
  const by  = topBoxY + topBoxHeight * 0.758;

  LETTERS.forEach((lab, i) => {
    drawChoice(gc, lab, bx0 + i * (bw + gap), by, bw, bh, () => {
      if (!inputOpen(gc)) return;
      if (lab === 'D' && issued39) { state.levelSubPhase = 'win'; gc.render(); return; }
      const unissuedD = lab === 'D';
      fails39++;
      wrong(gc);
      if (unissuedD) say(gc, UNISSUED);
      const at = fails39;
      setTimeout(() => {
        if (gc.state.currentLevel !== 39 || gc.state.levelSubPhase !== 'active' || gc.state.gameOver) return;
        if (fails39 !== at) return;
        say(gc, LADDER[Math.min(fails39 - 1, LADDER.length - 1)]);
        gc.render();
      }, 700);
    }, { fontSize: 25 });
  });

  // ── on top of the suspension screen ────────────────────────────────────────
  gc.afterOverlays = (g) => {
    const r = cheatRects(g);

    // Clicking the box itself: the invigilator points at the button beside it.
    // Unshifted so it lands before the overlay's own focus hit area. While the
    // instruction is unissued the box does NOT take focus, because a caret would
    // hide the very line the candidate is meant to read; once it is signed the
    // field behaves normally again (the override key still works).
    g.hitAreas.unshift({
      x: r.box.x, y: r.box.y, w: r.box.w, h: r.box.h, noCursor: true,
      action: () => {
        if (issued39) g.state.pauseCheatFocused = true;
        else say(g, MY_BOX);
        g.render();
      },
    });

    if (issued39 || !pulseAt39) return;
    const age = performance.now() - pulseAt39;
    if (age > 4200) return;                     // three 1.4s pulses, then it rests
    const alpha = Math.sin(((age % 1400) / 1400) * Math.PI);
    g.ctx.save();
    g.ctx.strokeStyle = `rgba(212,176,90,${(0.55 * alpha).toFixed(3)})`;
    g.ctx.lineWidth = 5;
    roundRect(g.ctx, r.go.x - 2.5, r.go.y - 2.5, r.go.w + 5, r.go.h + 5, 6);
    g.ctx.stroke();
    g.ctx.restore();
  };
};
