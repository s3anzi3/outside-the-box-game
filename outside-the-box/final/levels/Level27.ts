import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';

const SECRET = 'KEYBOARD';

let typed27 = '';
let listenersAdded27 = false;

function ensureListeners27(gc: GameContext): void {
  if (listenersAdded27) return;
  listenersAdded27 = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (gc.state.currentLevel !== 27 || gc.state.currentScreen !== 'level') return;
    if (gc.state.paused || gc.state.controlsOpen || gc.state.gameOver) return;
    if (gc.state.levelSubPhase !== 'active') return;

    if (e.key === 'Backspace') {
      typed27 = typed27.slice(0, -1);
      gc.render();
      return;
    }

    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      typed27 = (typed27 + e.key).toUpperCase().slice(-SECRET.length);
      if (typed27 === SECRET) {
        gc.sounds.play("correctAnswer", { volume: 0.55 });
        gc.state.currentLevel  = 28;
        gc.state.levelSubPhase = '';
        typed27                = '';
      }
      gc.render();
    }
  });
}

export const drawLevel27 = (gc: GameContext) => {
  ensureListeners27(gc);

  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Init ──────────────────────────────────────────────────────────────────
  if (state.levelSubPhase !== 'active') {
    typed27 = '';
    state.levelSubPhase = 'active';
  }

  // ── Riddle text (multi-line) ──────────────────────────────────────────────
  const riddleLines = [
    'I have keys but no locks.',
    'I have space but no rooms.',
    'You can enter but cannot go inside.',
    'What am I?',
  ];

  ctx.fillStyle    = t.fg;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `italic 22px ${bodyFont}`;
  const riddleY0 = topBoxY + topBoxHeight * 0.15;
  for (let i = 0; i < riddleLines.length; i++) {
    ctx.fillText(riddleLines[i], cx, riddleY0 + i * 30);
  }

  // ── Decoy answer buttons ──────────────────────────────────────────────────
  const options = ['HOUSE', 'MAP', 'PIANO', 'KEYBOARD'] as const;
  const btnW    = topBoxWidth * 0.16;
  const btnH    = topBoxHeight * 0.13;
  const btnGap  = topBoxWidth * 0.022;
  const totalBW = btnW * options.length + btnGap * (options.length - 1);
  const btnSX   = cx - totalBW / 2;
  const btnY    = topBoxY + topBoxHeight * 0.66;

  for (let i = 0; i < options.length; i++) {
    const bx = btnSX + i * (btnW + btnGap);

    if (gc.levelBGLoaded) {
      ctx.drawImage(gc.levelBGImg, 326, 132, 888, 810, bx, btnY, btnW, btnH);
    } else {
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth   = 2;
      ctx.strokeRect(bx, btnY, btnW, btnH);
    }

    ctx.fillStyle    = '#1a1a1a';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 18px ${displayFont}`;
    ctx.fillText(options[i], bx + btnW / 2, btnY + btnH / 2);

    gc.hitAreas.push({
      x: bx, y: btnY, w: btnW, h: btnH,
      action: () => gc.loseLife(),
    });
  }

  // ── Subtle in-progress preview of typed letters ───────────────────────────
  if (typed27.length > 0) {
    ctx.fillStyle    = t.fgDim;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = `bold 14px ${displayFont}`;
    ctx.fillText(typed27, cx, topBoxY + topBoxHeight * 0.92);
  }
};
