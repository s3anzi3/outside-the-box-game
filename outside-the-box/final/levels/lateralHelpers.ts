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

  ctx.font      = `${Math.round(18 * s)}px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  ctx.fillText(subtitle, cx, topBoxY + topBoxHeight * 0.48, w * 0.62);

  drawButton(gc, 'CONTINUE  →', cx - 110, topBoxY + topBoxHeight * 0.64, 220, Math.max(44, topBoxHeight * 0.13), () => {
    state.currentLevel  = nextLevel;
    state.levelSubPhase = '';
    gc.render();
  }, 18);
};
