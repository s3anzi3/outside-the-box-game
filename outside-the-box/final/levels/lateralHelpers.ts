// Shared helpers for the lateral-thinking levels.
// Kept tiny on purpose — each level still owns its own puzzle logic.
import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, roundRect, uiScale, triggerStamp } from '../renderer';

export interface ChoiceOpts {
  fontSize?: number;
  textColor?: string;
  fill?: string;
  body?: boolean;      // accepted for back-compat; choices always use the UI font now
}

// A filled, bordered clickable answer card. Registers its own hit area.
// A caller-supplied `fill` (e.g. a coloured Stroop option) is always honoured;
// otherwise the card uses the paper palette and lights oxblood on hover.
export const drawChoice = (
  gc: GameContext,
  label: string,
  x: number, y: number, w: number, h: number,
  onClick: () => void,
  opts: ChoiceOpts = {},
) => {
  const { ctx, state, bodyFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  const hover = gc.mouseX >= x && gc.mouseX <= x + w && gc.mouseY >= y && gc.mouseY <= y + h;
  const tinted = opts.fill !== undefined;

  ctx.save();
  ctx.shadowColor = state.darkMode ? 'rgba(0,0,0,0.40)' : 'rgba(60,45,20,0.18)';
  ctx.shadowBlur = hover ? 12 : 7;
  ctx.shadowOffsetY = hover ? 3 : 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = opts.fill ?? (hover ? t.accent : t.panel);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = tinted ? t.stroke : (hover ? t.accentDeep : t.stroke);
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  ctx.fillStyle = opts.textColor ?? (tinted ? t.ink : (hover ? '#F7F1E3' : t.ink));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontPx = Math.min(Math.round((opts.fontSize ?? 24) * s), h * 0.6);
  ctx.font = `bold ${fontPx}px ${bodyFont}`;
  ctx.fillText(label, x + w / 2, y + h / 2, w - 16);

  gc.hitAreas.push({ x, y, w, h, action: onClick });
};

// Standard "you picked the conventional/wrong thing" handler: stamp + buzz + life.
export const wrong = (gc: GameContext) => {
  triggerStamp(gc, 'INCORRECT', getTheme(gc.state).danger);
  gc.sounds.ui('deny');
  gc.loseLife();
  gc.render();
};

// Reset levelSubPhase to 'active' on fresh entry (LevelSelect/advancing clears it to '').
export const ensureActive = (gc: GameContext) => {
  if (gc.state.levelSubPhase !== 'active' && gc.state.levelSubPhase !== 'win') {
    gc.state.levelSubPhase = 'active';
    gc.state.winChimeFor = -1;   // allow the win chime to fire again on the next solve
  }
};

// True exactly once per fresh entry into a level (levelSubPhase was cleared by the
// level change). Use it to (re)initialise module state, then it flips to 'active'.
export const freshEntry = (gc: GameContext): boolean => {
  if (gc.state.levelSubPhase !== 'active' && gc.state.levelSubPhase !== 'win') {
    gc.state.levelSubPhase = 'active';
    gc.state.winChimeFor = -1;
    return true;
  }
  return false;
};

// The examiner says something new: the typewriter re-runs on the new text.
export const say = (gc: GameContext, ...lines: string[]) => {
  gc.state.guideLines = lines;
};

// Is the level allowed to take input right now?
export const inputOpen = (gc: GameContext) =>
  !gc.state.paused && !gc.state.controlsOpen && !gc.state.gameOver && !gc.state.cheatsPopupOpen &&
  gc.state.levelSubPhase === 'active';

export const inRect = (x: number, y: number, r: { x: number; y: number; w: number; h: number } | undefined) =>
  !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// A pause-aware clock for levels: returns seconds elapsed since the level was entered,
// not counting time spent paused. Call every frame.
export const levelClock = (gc: GameContext, store: { last: number; elapsed: number }) => {
  const now = performance.now();
  const dt = store.last ? Math.min(0.05, (now - store.last) / 1000) : 0;
  store.last = now;
  if (!gc.state.paused && !gc.state.controlsOpen && !gc.state.gameOver && gc.state.levelSubPhase === 'active') store.elapsed += dt;
  return { dt: (gc.state.paused || gc.state.controlsOpen || gc.state.gameOver) ? 0 : dt, elapsed: store.elapsed };
};

// A form-style text field drawn in the paper: box, placeholder, value, blinking caret.
export const drawTypeIn = (
  gc: GameContext, x: number, y: number, w: number, h: number,
  value: string, focused: boolean, placeholder: string, onClick: () => void,
  opts: { fontSize?: number; mono?: boolean; center?: boolean } = {},
) => {
  const { ctx, state, bodyFont, monoFont } = gc;
  const t = getTheme(state);
  const s = uiScale(ctx);
  roundRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = t.bg;
  ctx.fill();
  ctx.strokeStyle = focused ? t.accent : t.hairline;
  ctx.lineWidth = focused ? 3 : 1.5;
  ctx.stroke();
  const fontPx = Math.round((opts.fontSize ?? 22) * s);
  ctx.font = `${opts.mono ? '' : 'bold '}${fontPx}px ${opts.mono ? monoFont : bodyFont}`;
  ctx.textBaseline = 'middle';
  const text = value.length ? value : (focused ? '' : placeholder);
  ctx.fillStyle = value.length ? t.ink : t.fgDim;
  const pad = 16;
  if (opts.center) {
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2, w - pad * 2);
    if (focused && state.guideCursor) {
      const tw = Math.min(ctx.measureText(value).width, w - pad * 2);
      ctx.fillStyle = t.ink;
      ctx.fillRect(x + w / 2 + tw / 2 + 2, y + h * 0.22, 2, h * 0.56);
    }
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text, x + pad, y + h / 2, w - pad * 2);
    if (focused && state.guideCursor) {
      const tw = Math.min(ctx.measureText(value).width, w - pad * 2);
      ctx.fillStyle = t.ink;
      ctx.fillRect(x + pad + tw + 2, y + h * 0.22, 2, h * 0.56);
    }
  }
  gc.hitAreas.push({ x, y, w, h, action: onClick, noCursor: true });
};

// Shared win splash with a CONTINUE button that advances to nextLevel.
export const drawWinScreen = (
  gc: GameContext,
  title: string,
  subtitle: string,
  nextLevel: number,
) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxY, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  // One-shot reward feedback the first frame this win is shown.
  if (state.winChimeFor !== state.currentLevel) {
    state.winChimeFor = state.currentLevel;
    gc.sounds.ui('chime');
    triggerStamp(gc, 'CORRECT', t.pass);
  }

  ctx.fillStyle    = t.pass;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold ${Math.round(42 * s)}px ${displayFont}`;
  ctx.fillText(title, cx, topBoxY + topBoxHeight * 0.30, w * 0.7);

  // Subtitle: word-wrapped so a long "lesson learned" line never squashes.
  ctx.font      = `${Math.round(18 * s)}px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  const maxW  = w * 0.62;
  const lines: string[] = [];
  let cur = '';
  for (const word of subtitle.split(' ')) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = word; }
    else cur = next;
  }
  if (cur) lines.push(cur);
  const lineH = Math.round(24 * s);
  const subY  = topBoxY + topBoxHeight * 0.48 - (lines.length - 1) * lineH / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, subY + i * lineH));

  drawButton(gc, 'CONTINUE  →', cx - 110, topBoxY + topBoxHeight * 0.64, 220, Math.max(44, topBoxHeight * 0.13), () => {
    state.currentLevel  = nextLevel;
    state.levelSubPhase = '';
    gc.render();
  }, 18);
};
