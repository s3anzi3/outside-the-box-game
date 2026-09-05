import * as THREE from 'three';
import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton, roundRect, uiScale } from '../renderer';
import { drawChoice, wrong, freshEntry, drawWinScreen, say, inputOpen, inRect, levelClock } from './lateralHelpers';

// ── Q13 — The Loaded Die ──────────────────────────────────────────────────────
// "Roll a six to proceed." ROLL tumbles a real 3D die (three.js on the transparent
// overlay canvas), but the rolls are rigged: 4, 2, 5, 3, then 1 forever, and every
// landing is chosen so the 6 is turned away from the camera. The answer register on
// the right only offers 1..5, so declaring what you rolled is always wrong.
// The die can be grabbed and turned like a trackball; release and it settles onto
// the nearest face. The only six in this examination is the one you turn up
// yourself. Answer stays 6, which is the first digit of Q49's combination.

// ── Die model ────────────────────────────────────────────────────────────────
// Faces: +z=1  -z=6  +x=3  -x=4  +y=2  -y=5 (opposites sum to 7).
interface Face { v: number; n: any; u: any; w: any; }

const UP = new THREE.Vector3(0, 1, 0);

const FACES: Face[] = [
  { v: 1, n: new THREE.Vector3( 0,  0,  1), u: new THREE.Vector3(1, 0, 0), w: new THREE.Vector3(0, 1, 0) },
  { v: 6, n: new THREE.Vector3( 0,  0, -1), u: new THREE.Vector3(1, 0, 0), w: new THREE.Vector3(0, 1, 0) },
  { v: 3, n: new THREE.Vector3( 1,  0,  0), u: new THREE.Vector3(0, 0, 1), w: new THREE.Vector3(0, 1, 0) },
  { v: 4, n: new THREE.Vector3(-1,  0,  0), u: new THREE.Vector3(0, 0, 1), w: new THREE.Vector3(0, 1, 0) },
  { v: 2, n: new THREE.Vector3( 0,  1,  0), u: new THREE.Vector3(1, 0, 0), w: new THREE.Vector3(0, 0, 1) },
  { v: 5, n: new THREE.Vector3( 0, -1,  0), u: new THREE.Vector3(1, 0, 0), w: new THREE.Vector3(0, 0, 1) },
];

const PIPS: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
};

// quaternion that puts each value on top
const CANON: Record<number, any> = {};
for (const f of FACES) CANON[f.v] = new THREE.Quaternion().setFromUnitVectors(f.n, UP);
const yawQ = (k: number) => new THREE.Quaternion().setFromAxisAngle(UP, k * Math.PI / 2);

// ── Camera (fixed three-quarter view, exactly as the mock) ───────────────────
const AZ = -33 * Math.PI / 180, EL = 26 * Math.PI / 180, DIST = 6.4;
const CAM_POS = new THREE.Vector3(
  Math.sin(AZ) * Math.cos(EL) * DIST,
  Math.sin(EL) * DIST,
  Math.cos(AZ) * Math.cos(EL) * DIST,
);
const CAM_DIR   = CAM_POS.clone().normalize();
const CAM_RIGHT = new THREE.Vector3()
  .crossVectors(new THREE.Vector3(0, 0, 0).sub(CAM_POS).normalize(), UP)
  .normalize();

const IVORY = 0xF4EDDC;
const OXBLOOD = 0x7A2E2E;
const RIG = [4, 2, 5, 3, 1, 2, 1, 1];   // rigged rolls, then 1 for ever. Never a 6.
const DRAG_K = 0.008;                    // radians per pixel at the mock's 300px die

const HANDLE_LINE = 'Candidate. Please do not handle the examination materials.';
const OPENING     = 'A simple test of fortune. Roll a six to proceed.';
const ROLL5_LINE  = 'Hm. Sixes appear to be out of stock today.';
const ROLL9_LINE  = 'You could roll all day, candidate. Or you could take matters into your own hands.';
const WIN_LINE    = '...That is technically a six. Noted.';
const ANS_LADDER  = [
  'That is what the die shows. The question asked for a six.',
  'Six is not on the register. It never was.',
  'You cannot record a six you have not produced. Produce one.',
];

// ── Module state (reset on fresh entry) ──────────────────────────────────────
let quat = CANON[2].clone();     // the die's orientation: the source of truth
let topValue = 2;
let rolls: number[] = [];
let rollCount = 0;
let fails13 = 0;
let solved13 = false;
let handled13 = false;
let dragging = false;
let prevDown = false;
let lastX = 0, lastY = 0, moved = 0;
let winAt = 0;
const clock13 = { last: 0, elapsed: 0 };

let anim: { from: any; to: any; t0: number; dur: number; done?: () => void } | null = null;

// ── three.js singletons (created once, never disposed) ───────────────────────
let renderer: any = null;
let scene: any = null;
let camera: any = null;
let dieObj: any = null;
let glFailed = false;
let lastCanvasW = 0, lastCanvasH = 0;

// Rounded box without the module-only addon: clamp a subdivided cube onto the
// rounded-box surface. The offset direction from the clamped inner box IS the
// exact surface normal, so shading is smooth with no edge seams.
const roundedBoxGeometry = (size: number, seg: number, radius: number) => {
  const g = new THREE.BoxGeometry(size, size, size, seg, seg, seg);
  const pos = g.attributes.position;
  const half = size / 2, inner = half - radius;
  const norms = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    c.set(
      Math.max(-inner, Math.min(inner, v.x)),
      Math.max(-inner, Math.min(inner, v.y)),
      Math.max(-inner, Math.min(inner, v.z)));
    const d = v.clone().sub(c);
    const l = d.length() || 1;
    d.divideScalar(l);
    v.copy(c).add(d.clone().multiplyScalar(radius));
    pos.setXYZ(i, v.x, v.y, v.z);
    norms[i * 3] = d.x; norms[i * 3 + 1] = d.y; norms[i * 3 + 2] = d.z;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(norms, 3));
  return g;
};

// Build the renderer + scene once. Returns false when WebGL is unavailable, in
// which case the level falls back to a flat 2D die and stays solvable.
const ensureScene = (gc: GameContext): boolean => {
  if (renderer) return true;
  if (glFailed) return false;
  const cv = gc.dieCanvas;
  if (!cv || typeof THREE.WebGLRenderer !== 'function') { glFailed = true; return false; }
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.copy(CAM_POS);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xfff7e8, 0x9c8a68, 1.0));
    const key = new THREE.DirectionalLight(0xfff1d8, 2.1);
    key.position.set(2.6, 5.2, 3.2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe8dcc2, 0.55);
    fill.position.set(-3.5, 1.2, -2.0);
    scene.add(fill);

    dieObj = new THREE.Group();
    scene.add(dieObj);
    dieObj.add(new THREE.Mesh(
      roundedBoxGeometry(1.6, 7, 0.18),
      new THREE.MeshStandardMaterial({ color: IVORY, roughness: 0.36, metalness: 0.0 }),
    ));
    const pipMat = new THREE.MeshStandardMaterial({ color: OXBLOOD, roughness: 0.3, metalness: 0.0 });
    const pipGeo = new THREE.SphereGeometry(0.155, 24, 24);
    for (const f of FACES) {
      for (const ab of PIPS[f.v]) {
        const pip = new THREE.Mesh(pipGeo, pipMat);
        pip.position.copy(f.n.clone().multiplyScalar(0.71)
          .add(f.u.clone().multiplyScalar(ab[0] * 0.42))
          .add(f.w.clone().multiplyScalar(ab[1] * 0.42)));
        dieObj.add(pip);
      }
    }
    lastCanvasW = 0; lastCanvasH = 0;
    return true;
  } catch (e) {
    glFailed = true;
    renderer = null; scene = null; camera = null; dieObj = null;
    return false;
  }
};

const hideDie = (gc: GameContext) => { if (gc.dieCanvas) gc.dieCanvas.style.display = 'none'; };

// Render the die into a square viewport inside the play area. WebGL's viewport
// origin is the BOTTOM-left of the canvas, so the y is flipped here.
const renderDie = (gc: GameContext, x: number, y: number, sq: number): boolean => {
  if (!ensureScene(gc)) return false;
  const cv = gc.dieCanvas;
  if (!cv) return false;
  try {
    if (cv.width !== lastCanvasW || cv.height !== lastCanvasH) {
      lastCanvasW = cv.width; lastCanvasH = cv.height;
      renderer.setSize(cv.width, cv.height, false);
      renderer.setScissorTest(false);
      renderer.clear();
    }
    cv.style.display = 'block';
    const yFromBottom = cv.height - (y + sq);
    renderer.setViewport(x, yFromBottom, sq, sq);
    renderer.setScissor(x, yFromBottom, sq, sq);
    renderer.setScissorTest(true);
    dieObj.quaternion.copy(quat);
    renderer.render(scene, camera);
    return true;
  } catch (e) {
    glFailed = true;
    hideDie(gc);
    return false;
  }
};

// ── Orientation helpers ──────────────────────────────────────────────────────
const faceDot = (q: any, f: Face, dir: any) => f.n.clone().applyQuaternion(q).dot(dir);

const faceUpOf = (q: any): number => {
  let best = 1, bd = -2;
  for (const f of FACES) { const d = faceDot(q, f, UP); if (d > bd) { bd = d; best = f.v; } }
  return best;
};

// A landing with v on top, the 6 turned away from the camera, low pips in view.
const chooseLanding = (v: number) => {
  let best: any = null, bs = -1e9;
  for (let k = 0; k < 4; k++) {
    const cand = yawQ(k).multiply(CANON[v].clone());
    let sixVis = false, visSum = 0;
    for (const f of FACES) {
      const d = faceDot(cand, f, CAM_DIR);
      if (d > 0.05) { visSum += f.v * d; if (f.v === 6) sixVis = true; }
    }
    const score = sixVis ? -1000 : -visSum;
    if (score > bs) { bs = score; best = cand; }
  }
  return best;
};

// The v-on-top orientation closest to where the die is right now.
const snapTarget = (v: number) => {
  let best: any = null, bd = -2;
  for (let k = 0; k < 4; k++) {
    const cand = yawQ(k).multiply(CANON[v].clone());
    const d = Math.abs(cand.dot(quat));
    if (d > bd) { bd = d; best = cand; }
  }
  return best;
};

const startAnim = (to: any, dur: number, done?: () => void) => {
  anim = { from: quat.clone(), to, t0: clock13.elapsed, dur, done };
};

const registerFace = (v: number) => { topValue = v; };

// ── Small canvas helpers ─────────────────────────────────────────────────────
const withTracking = (ctx: CanvasRenderingContext2D, px: number, fn: () => void) => {
  const c = ctx as unknown as { letterSpacing?: string };
  const prev = c.letterSpacing;
  try { c.letterSpacing = `${px}px`; } catch (e) { /* unsupported */ }
  try { fn(); } finally { try { c.letterSpacing = prev ?? '0px'; } catch (e) { /* ignore */ } }
};

const drawContactShadow = (gc: GameContext, cx: number, cy: number, rx: number, ry: number) => {
  const { ctx, state } = gc;
  const base = state.darkMode ? '0,0,0' : '60,45,20';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0,   `rgba(${base},${state.darkMode ? 0.45 : 0.30})`);
  g.addColorStop(0.7, `rgba(${base},0)`);
  g.addColorStop(1,   `rgba(${base},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// Flat stand-in used only when the browser has no WebGL context: the level stays
// playable because every drag/settle decision runs on the quaternion, not the pixels.
const drawFlatDie = (gc: GameContext, cx: number, cy: number, sq: number) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const t = getTheme(state);
  const side = sq * 0.6;
  ctx.save();
  ctx.shadowColor = state.darkMode ? 'rgba(0,0,0,0.45)' : 'rgba(60,45,20,0.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, cx - side / 2, cy - side / 2, side, side, side * 0.14);
  ctx.fillStyle = '#F4EDDC';
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, cx - side / 2, cy - side / 2, side, side, side * 0.14);
  ctx.stroke();
  ctx.fillStyle = '#7A2E2E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(side * 0.44)}px ${displayFont}`;
  ctx.fillText(String(topValue), cx, cy + side * 0.02);
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(side * 0.075)}px ${monoFont}`;
  ctx.fillText('NO 3D CONTEXT', cx, cy + side * 0.38);
};

// ── The level ────────────────────────────────────────────────────────────────
export const drawLevel13 = (gc: GameContext) => {
  const { ctx, state, displayFont, monoFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const s  = uiScale(ctx);
  const cx = w / 2;

  if (state.levelSubPhase === 'win') {
    hideDie(gc);
    drawWinScreen(gc, 'SIX.', 'No roll was ever going to land it. You had to turn it yourself.', 14);
    return;
  }

  if (freshEntry(gc)) {
    quat = CANON[2].clone();
    topValue = 2;
    rolls = [];
    rollCount = 0;
    fails13 = 0;
    solved13 = false;
    handled13 = false;
    dragging = false;
    prevDown = false;
    moved = 0;
    winAt = 0;
    anim = null;
    clock13.last = 0; clock13.elapsed = 0;
    lastCanvasW = 0; lastCanvasH = 0;
    say(gc, OPENING);
  }

  const frozen = state.paused || state.controlsOpen || state.gameOver || state.cheatsPopupOpen;
  const { elapsed } = levelClock(gc, clock13);

  // ── geometry (fractions of the play area, exactly as the mock) ─────────────
  const sq    = Math.min(topBoxWidth, topBoxHeight) * 0.78;   // the die's square
  const dieCX = cx;
  const dieCY = topBoxY + topBoxHeight * 0.38;
  const dieX  = dieCX - sq / 2;
  const dieY  = dieCY - sq / 2;
  const k     = sq / 300;                                     // mock-pixel scale

  // ── advance the tumble / settle animation (pause aware) ───────────────────
  if (anim && !frozen) {
    const p = anim.dur > 0 ? Math.min(1, (elapsed - anim.t0) / anim.dur) : 1;
    const e = 1 - Math.pow(1 - p, 3);
    quat.slerpQuaternions(anim.from, anim.to, e);
    if (p >= 1) {
      quat.copy(anim.to);
      const done = anim.done;
      anim = null;
      if (done) done();
    }
  }

  // ── the delayed hand-off to the win screen ────────────────────────────────
  if (solved13 && winAt && !frozen && elapsed - winAt >= 0.9) {
    state.levelSubPhase = 'win';
    hideDie(gc);
    drawWinScreen(gc, 'SIX.', 'No roll was ever going to land it. You had to turn it yourself.', 14);
    return;
  }

  // ── prompt ────────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.ink;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `bold ${Math.round(26 * s)}px ${displayFont}`;
  ctx.fillText('Roll a six to proceed.', cx, topBoxY + topBoxHeight * 0.08, topBoxWidth * 0.7);

  // ── scratchwork column (left) ─────────────────────────────────────────────
  const colW  = 150 * s;
  const scrX  = topBoxX + topBoxWidth * 0.04;
  const scrY  = topBoxY + topBoxHeight * 0.24;
  ctx.textAlign = 'left';
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(10 * s)}px ${monoFont}`;
  withTracking(ctx, 1 * s, () => ctx.fillText('SCRATCHWORK', scrX, scrY));
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(scrX, Math.round(scrY + 15 * s) + 0.5);
  ctx.lineTo(scrX + colW, Math.round(scrY + 15 * s) + 0.5);
  ctx.stroke();
  ctx.font = `${Math.round(12 * s)}px ${monoFont}`;
  {
    const lineH = 22 * s;
    let lx = scrX, ly = scrY + 15 * s + 18 * s;
    for (const v of rolls) {
      const txt = String(v);
      const tw = ctx.measureText(txt).width;
      if (lx > scrX && lx + tw > scrX + colW) { lx = scrX; ly += lineH; }
      ctx.fillText(txt, lx, ly);
      lx += tw + 9 * s;
    }
  }

  // ── the die ───────────────────────────────────────────────────────────────
  drawContactShadow(gc, dieCX, dieCY + 78 * k, 70 * k, 14 * k);

  // The WebGL overlay sits above everything, so it is hidden whenever an overlay
  // owns the screen. Frozen or WebGL-less, the flat stand-in takes its place.
  let rendered = false;
  if (frozen) hideDie(gc);
  else rendered = renderDie(gc, dieX, dieY, sq);
  if (!rendered && !frozen) drawFlatDie(gc, dieCX, dieCY, sq);

  // ── FACE UP register ──────────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.font         = `${Math.round(11 * s)}px ${monoFont}`;
  withTracking(ctx, 1.3 * s, () => ctx.fillText(`FACE UP: ${topValue}`, dieCX, dieCY + 118 * k));

  // ── ROLL ──────────────────────────────────────────────────────────────────
  const rollW = 150 * s, rollH = 54 * s;
  const rollY = topBoxY + topBoxHeight * 0.93 - rollH;
  ctx.save();
  if (solved13) ctx.globalAlpha = 0.55;
  drawButton(gc, 'ROLL', cx - rollW / 2, rollY, rollW, rollH, () => {
    if (!inputOpen(gc) || solved13 || anim || dragging) return;
    const v = rollCount < RIG.length ? RIG[rollCount] : 1;
    rollCount++;
    const axis = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    const mid = new THREE.Quaternion()
      .setFromAxisAngle(axis, (130 + Math.random() * 90) * Math.PI / 180)
      .multiply(quat.clone());
    startAnim(mid, 0.30, () => startAnim(chooseLanding(v), 0.42, () => {
      registerFace(v);
      rolls.push(v);
      gc.sounds.ui('thud');
      if (rollCount === 5) say(gc, ROLL5_LINE);
      if (rollCount === 9) say(gc, ROLL9_LINE);
    }));
  }, 24);
  ctx.restore();

  // ── answer register (right): 1..5, and never a 6 ──────────────────────────
  const ansW = 110 * s, ansH = 40 * s, ansGap = 9 * s;
  const ansX = topBoxX + topBoxWidth * 0.96 - ansW;
  const ansTop = topBoxY + topBoxHeight * 0.30;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = t.fgDim;
  ctx.font = `${Math.round(10 * s)}px ${monoFont}`;
  withTracking(ctx, 1 * s, () => ctx.fillText('RECORD THE ROLL', ansX, topBoxY + topBoxHeight * 0.24));
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ansX, Math.round(topBoxY + topBoxHeight * 0.24 + 15 * s) + 0.5);
  ctx.lineTo(ansX + ansW, Math.round(topBoxY + topBoxHeight * 0.24 + 15 * s) + 0.5);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const label = String(i + 1);
    drawChoice(gc, label, ansX, ansTop + i * (ansH + ansGap), ansW, ansH, () => {
      if (!inputOpen(gc) || solved13) return;
      wrong(gc);
      say(gc, ANS_LADDER[Math.min(fails13, ANS_LADDER.length - 1)]);
      fails13++;
    }, { fontSize: 22 });
  }

  // ── trackball drag on the die (polled; the die canvas takes no events) ─────
  const sqRect = { x: dieX, y: dieY, w: sq, h: sq };
  if (!inputOpen(gc)) {
    dragging = false;
    prevDown = gc.mouseDown;
  } else {
    if (!dragging && gc.mouseDown && !prevDown && !anim && !solved13 && inRect(gc.mouseX, gc.mouseY, sqRect)) {
      dragging = true;
      lastX = gc.mouseX; lastY = gc.mouseY; moved = 0;
    }
    if (dragging) {
      if (gc.mouseDown) {
        const dx = gc.mouseX - lastX, dy = gc.mouseY - lastY;
        lastX = gc.mouseX; lastY = gc.mouseY;
        if (dx !== 0 || dy !== 0) {
          moved += Math.abs(dx) + Math.abs(dy);
          if (moved > 8 && !handled13 && !solved13) { handled13 = true; say(gc, HANDLE_LINE); }
          const kk = DRAG_K * (300 / sq);
          quat.premultiply(new THREE.Quaternion().setFromAxisAngle(UP, dx * kk));
          quat.premultiply(new THREE.Quaternion().setFromAxisAngle(CAM_RIGHT, dy * kk));
        }
      } else {
        dragging = false;
        settle(gc);
      }
    }
    prevDown = gc.mouseDown;
  }

  // ── test hook (read-only state plus the orientation shortcut) ─────────────
  const dev = window as unknown as { __gc?: { lv?: Record<string, unknown> } };
  if (dev.__gc) dev.__gc.lv = {
    faceUp: topValue,
    rolls: rolls.slice(),
    rollCount,
    dragging,
    webgl: !!renderer && !glFailed,
    solved: solved13,
    turnTo: (v: number) => {
      if (solved13 || !CANON[v]) return;
      anim = null;
      startAnim(snapTarget(v), 0.24, () => { registerFace(v); if (v === 6) winNow(gc); });
    },
  };
};

// Release the die: it drops onto whichever face is currently nearest to up.
function settle(gc: GameContext) {
  if (solved13 || anim) return;
  const v = faceUpOf(quat);
  startAnim(snapTarget(v), 0.24, () => {
    registerFace(v);
    gc.sounds.ui('tick');
    if (v === 6) winNow(gc);
  });
}

function winNow(gc: GameContext) {
  if (solved13) return;
  solved13 = true;
  winAt = clock13.elapsed;
  say(gc, WIN_LINE);
}
