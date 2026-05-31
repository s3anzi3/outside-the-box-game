// Shared helpers for the lateral-thinking levels (11–20).
// Kept tiny on purpose — each level still owns its own puzzle logic.
import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';

export interface ChoiceOpts {
  fontSize?: number;
  textColor?: string;
  fill?: string;
  body?: boolean;      // use the body font instead of the display font
}

// A filled, bordered clickable button. Registers its own hit area.
export const drawChoice = (
  gc: GameContext,
  label: string,
  x: number, y: number, w: number, h: number,
  onClick: () => void,
  opts: ChoiceOpts = {},
) => {
  const { ctx, state } = gc;
  const t = getTheme(state);

  ctx.fillStyle = opts.fill ?? (state.darkMode ? '#1e1e1e' : '#e8e8e8');
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle    = opts.textColor ?? t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${opts.fontSize ?? 24}px ${opts.body ? gc.bodyFont : gc.displayFont}`;
  ctx.fillText(label, x + w / 2, y + h / 2, w - 14);

  gc.hitAreas.push({ x, y, w, h, action: onClick });
};

// Standard "you picked the conventional/wrong thing" handler.
export const wrong = (gc: GameContext) => { gc.loseLife(); gc.render(); };

// Reset levelSubPhase to 'active' on fresh entry (LevelSelect/advancing clears it to '').
export const ensureActive = (gc: GameContext) => {
  if (gc.state.levelSubPhase !== 'active' && gc.state.levelSubPhase !== 'win') {
    gc.state.levelSubPhase = 'active';
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
  const cx = w / 2;

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 44px ${displayFont}`;
  ctx.fillText(title, cx, topBoxY + topBoxHeight * 0.32, w * 0.7);

  ctx.font      = `20px ${bodyFont}`;
  ctx.fillStyle = t.fgMid;
  ctx.fillText(subtitle, cx, topBoxY + topBoxHeight * 0.50, w * 0.62);

  drawButton(gc, 'CONTINUE  →', cx - 100, topBoxY + topBoxHeight * 0.66, 200, 48, () => {
    state.currentLevel  = nextLevel;
    state.levelSubPhase = '';
    gc.render();
  }, 18);
};
