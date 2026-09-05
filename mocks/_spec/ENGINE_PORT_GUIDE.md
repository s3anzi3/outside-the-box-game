# Porting a mock into the real game (`outside-the-box/final/`)

The real game is a single 2D canvas app (TypeScript, bundled by gulp+browserify+babel; babel strips types, so ALSO run `npx tsc -p tsconfig.check.json` from the repo root and make sure your file adds no errors). Every level is `final/levels/LevelNN.ts` exporting `drawLevelNN(gc)`; `screens/Level.ts` calls it every frame and then `drawLevelHUD(gc)`. The main loop re-renders continuously with requestAnimationFrame, so **a level's draw function runs ~60 times a second**: draw the current state, register hit areas, and advance animations from timestamps. Module-level `let` variables hold level state (see any existing level).

## The contract every level follows
```ts
import { GameContext } from '../types';
import { getTheme } from '../theme';
import { getLayout } from '../layout';
import { drawButton, roundRect, uiScale, triggerStamp, drawStamp } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock, drawTypeIn } from './lateralHelpers';

export const drawLevelNN = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);   // the PLAY AREA (below the header band)
  const t = getTheme(state); const s = uiScale(ctx); const cx = w / 2;
  if (state.levelSubPhase === 'win') { drawWinScreen(gc, 'TITLE.', 'One dry line.', NN + 1); return; }
  if (freshEntry(gc)) { /* reset module state; say(gc, 'opening remark') is optional (LEVEL_DATA has the default) */ }
  // ... draw + hit areas ...
};
```
- **Geometry**: `topBoxX/Y/Width/Height` = the play area inside the paper, below the 46px header band (the mocks' `#play`: x 118..1162, y 171..552 at 1280×860). `getLayout` also returns `paperX/paperY/paperW/paperH/headerH`, `bottomBoxY/bottomBoxHeight`, `s` (ui scale), `w/h` (canvas size = window size). Position everything as fractions of the play area; scale fonts by `s`.
- **Theme**: `t.ink, t.fgMid, t.fgDim, t.bg, t.panel, t.stroke, t.hairline, t.accent, t.accentDeep, t.seal, t.pass, t.danger`. Ink palette for coloured things: red #C03A2E, blue #2E6BA8, green #3F8F55, yellow #D8A81F. Fonts: `displayFont` (serif), `bodyFont` (sans), `monoFont`.
- **Buttons**: `drawChoice(gc, label, x, y, w, h, onClick, { fontSize })` (embossed paper button + hit area) or `drawButton(gc, label, x, y, w, h, onClick, fontSize)`. Hit areas: `gc.hitAreas.push({ x, y, w, h, action, noCursor?, onRightClick? })`; they are rebuilt every frame. Left click calls `action`, right click calls `onRightClick` (browser menu suppressed).
- **Wrong answer**: `wrong(gc)` = INCORRECT stamp + deny sound + lose a life. Never call `gc.loseLife()` for exploring.
- **Win**: set `state.levelSubPhase = 'win'` and let `drawWinScreen(gc, title, subtitle, nextLevel)` draw it (it plays the chime and CORRECT stamp, and its CONTINUE advances). For a custom stamp text use `triggerStamp(gc, 'CASE CLOSED', t.pass)` before switching to win, then pass the same title.
- **Examiner remarks**: the default is `LEVEL_DATA[NN-1].lines` (edit `levelData.ts` for the opening line). `say(gc, 'line', 'line2')` replaces it (the typewriter re-runs automatically). Hint ladders: keep a `fails` counter and `say` the next rung after `wrong(gc)`.
- **Mouse**: `gc.mouseX/mouseY` (canvas px), `gc.mouseDown` (true while the left button is held, also released when the mouse leaves the window). Drags = poll `gc.mouseDown` + position each frame (see Level21's paddle-hold or Level32's knob). Wheel: `gc.wheelDeltaY` is non-zero during the frame a wheel event fires.
- **Keyboard**: `gc.keysDown` (Set of `e.key`) for held keys; for typed text add a `window.addEventListener('keydown')` once (module flag) and guard on `gc.state.currentLevel === NN && gc.state.currentScreen === 'level' && inputOpen(gc)` (Level22/27 pattern). Call `e.preventDefault()` for Space/arrows.
- **Time**: use `levelClock(gc, store)` (pause-aware) or `performance.now()`; freeze everything while `state.paused || state.controlsOpen || state.gameOver`.
- **Sound**: `gc.sounds.play(key, { loop, volume, restart, startTime })` with keys `correctAnswer wrongAnswer boom dash typing pongBounce clickDontClick mazeOof allOfTheLights eraser bgmLevel21 ...`; `gc.sounds.ui('chime' | 'deny' | 'click' | 'tick' | 'thud' | 'seal')`. Master volume: `gc.sounds.getMasterVolume()` (the pause menu's SOUND slider, 0..1).
- **Dark mode**: `state.darkMode`; use theme tokens, never hard-coded paper colours.

## Chrome hooks (new engine features the ported levels rely on)
- `gc.chrome` — rects rebuilt every frame: `logo, bulb, qLabel, pause, paper, play, caption, examiner, remarks, heartsRow, hearts[]`. Read them AFTER the chrome drew, i.e. inside `gc.afterPanel`.
- `gc.afterPanel = (gc) => {...}` — set it every draw; it runs after the examiner panel and HUD are drawn and before overlays. Use it to glow chrome pieces (Q35), draw the bulb cap over the logo (Q31), draw a flying heart over the panel (Q42), draw dictation inside the remarks (Q41), draw the word gap (Q33) or push hit areas on chrome rects (Q34 hearts, Q35 keys, Q31 bulb).
- `gc.afterOverlays = (gc) => {...}` — runs after the pause overlay is drawn (Q22 keeps the flashed digits visible while paused).
- `state.guideLines` (via `say`), `state.paperCaption` (Q23 CONFIDENTIAL, Q40 REBOOTING, Q49 COMBINATION), `state.hudHiddenHearts` (indexes drawn as empty slots), `state.hudExtraHeart` (fourth wrong heart, Q34), `state.hudHeartsLabel`, `state.pauseDisabled` + `gc.pauseIntercept` (Q35), `state.pauseCheatPlaceholder` + `state.pauseCheatDone` + `gc.pauseCheatHandler` (Q39: the › button beside INVIGILATOR OVERRIDE calls the handler; return true to consume), `state.pauseCartouche` (Q22 "(CONVENIENT)"). All of these are cleared automatically when the level changes; set them during the level's draw (cheap to set every frame) or once in `freshEntry`.
- `setPaperExtend(px)` from `../layout` widens the paper's right edge (Q37); reset happens automatically on level change.
- Drawing outside the paper (desk margin) is fine: the canvas is the whole window (Q29 stamps, Q15 desk).
- `drawHeart(ctx, cx, cy, size, fill|null, stroke)` from `../renderer` draws the HUD's vector heart anywhere.
- `drawTypeIn(gc, x, y, w, h, value, focused, placeholder, onClick, { fontSize, mono, center })` draws a form field; you own the value and the keydown listener.

## Testing (mandatory)
Build from the repo root with `npm run build`, then drive the real game headlessly: `node mocks/_test/game.js mocks/_test/tests/game-qNN.test.js`. The test file exports `async (page, g) => {}`; `g.goto(NN)` jumps straight to the level (level-select mode, 3 lives); `g.state()` returns `{ level, lives, phase, paused, remarks, stamp, caption }`; `g.click/rclick/drag/key/type/wait/shot/eval/chrome/assert` mirror the mock harness; the viewport is 1280×860 so canvas coordinates equal the mock frame coordinates. Levels may expose test hooks on `(window as any).__gc.lv = {...}` (read with `g.levelVar('field')`) but the test must play with real input. Look at every screenshot (`mocks/_test/out/game-*.png`).

## Faithful to the mock
The mock (`mocks/_spec/parts/qNN.js` + the built `mocks/qNN-*.html`) is the spec: same copy, same hint ladder, same numbers, same layout proportions, same quirks. No em dashes in copy. Update `levelData.ts` for the level's opening remark if the mock's differs. Update `overlays/CheatsOverlay.ts` HINTS for the level to describe the new solution.
