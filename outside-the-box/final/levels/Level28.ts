import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';

// ── Tunables ──────────────────────────────────────────────────────────────────
const PLAYER_W           = 40;
const PLAYER_H           = 26;
const PLAYER_SPEED       = 380;     // px/s
const PLAYER_BULLET_W    = 4;
const PLAYER_BULLET_H    = 14;
const PLAYER_BULLET_SPD  = 720;     // px/s
const PLAYER_FIRE_CD     = 0.22;    // seconds between shots
const PLAYER_DMG         = 5;
const PLAYER_IFRAMES     = 0.42;    // seconds of invincibility after a hit

const BOSS_W             = 150;
const BOSS_H             = 90;
const BOSS_HP_MAX        = 110;     // 22 hits to kill
const BOSS_BULLET_R      = 7;

// Per-phase boss tuning: [phase 0 (HP 110→80), phase 1 (75→45), phase 2 (40→0)]
const BOSS_BULLET_SPEEDS = [275, 360, 440];
const BOSS_FIRE_INTERVALS = [1.00, 0.75, 0.55];
const BOSS_OSC_HZ         = [0.45, 0.72, 1.10];   // horizontal sweep speed

interface Bullet { x: number; y: number; vx: number; vy: number; life: number; }

// ── Module-level state ────────────────────────────────────────────────────────
let animId28        = 0;
let lastTime28      = 0;
let initialized28   = false;
let listenersAdded28 = false;

let playerX28       = 0;
let playerHitTimer28 = 0;            // counts down; >0 = invincible after a hit
let bossX28         = 0;
let bossT28         = 0;             // accumulated time for sin oscillation
let bossHP28        = BOSS_HP_MAX;
let bossPhase28     = 0;
let phaseFlash28    = 0;             // brief white flash on phase change
let playerBullets28: Bullet[] = [];
let bossBullets28:   Bullet[] = [];
let playerFireT28   = 0;
let bossFireT28     = 0;

function phaseFor(hp: number): number {
  if (hp > 75) return 0;
  if (hp > 40) return 1;
  return 2;
}

function ensureListeners28(gc: GameContext): void {
  if (listenersAdded28) return;
  listenersAdded28 = true;
  // Stop SPACE from scrolling the page when this level is active.
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (gc.state.currentLevel !== 28 || gc.state.currentScreen !== 'level') return;
    if (e.code === 'Space' || e.key === ' ') e.preventDefault();
  });
}

function resetGame(_state: { lives: number }, ax: number, aw: number, _ay: number, _ah: number) {
  playerX28        = ax + aw / 2 - PLAYER_W / 2;
  playerHitTimer28 = 0;
  bossX28          = ax + (aw - BOSS_W) / 2;
  bossT28          = 0;
  bossHP28         = BOSS_HP_MAX;
  bossPhase28      = 0;
  phaseFlash28     = 0;
  playerBullets28  = [];
  bossBullets28    = [];
  playerFireT28    = 0;
  bossFireT28      = 0;
  initialized28    = true;
}

export const drawLevel28 = (gc: GameContext) => {
  ensureListeners28(gc);

  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  const ax = topBoxX, ay = topBoxY, aw = topBoxWidth, ah = topBoxHeight;
  const bossY = ay + 36;
  const playerY = ay + ah - 64;

  // ── Init / reset on fresh entry ───────────────────────────────────────────
  if (state.levelSubPhase !== 'active' || !initialized28) {
    resetGame(state, ax, aw, ay, ah);
    state.levelSubPhase = 'active';
    lastTime28 = 0;
  }

  // ── Background tint ───────────────────────────────────────────────────────
  ctx.fillStyle = state.darkMode ? '#0a0010' : '#f0e8f0';
  ctx.fillRect(ax, ay, aw, ah);

  // Phase flash overlay (brief white burst on phase transition)
  if (phaseFlash28 > 0) {
    ctx.fillStyle = `rgba(255,255,255,${phaseFlash28 * 0.5})`;
    ctx.fillRect(ax, ay, aw, ah);
  }

  // ── Boss ──────────────────────────────────────────────────────────────────
  const bx = bossX28;
  const by = bossY;

  // monitor body
  ctx.fillStyle = '#1a1a26';
  ctx.fillRect(bx, by, BOSS_W, BOSS_H);
  ctx.strokeStyle = bossPhase28 === 2 ? '#ff3838' : bossPhase28 === 1 ? '#ffaa20' : '#9be15d';
  ctx.lineWidth   = 3;
  ctx.strokeRect(bx, by, BOSS_W, BOSS_H);

  // glitchy face: scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 0; y < BOSS_H; y += 4) ctx.fillRect(bx, by + y, BOSS_W, 1);

  // eyes — flicker when angry
  const flicker = Math.sin(performance.now() / 60) > (0.7 - bossPhase28 * 0.3) ? 0.4 : 1;
  ctx.fillStyle = `rgba(0,255,140,${flicker})`;
  const eyeY = by + BOSS_H * 0.35;
  ctx.fillRect(bx + BOSS_W * 0.22, eyeY, 16, 12);
  ctx.fillRect(bx + BOSS_W * 0.62, eyeY, 16, 12);

  // mouth — gets jaggier with phase
  ctx.strokeStyle = `rgba(0,255,140,${flicker})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const mouthY = by + BOSS_H * 0.72;
  const teeth = 4 + bossPhase28 * 2;
  for (let i = 0; i <= teeth; i++) {
    const tx = bx + BOSS_W * 0.25 + (i / teeth) * BOSS_W * 0.5;
    const ty = mouthY + (i % 2 === 0 ? 0 : 6 + bossPhase28 * 2);
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.stroke();

  // boss name tag
  ctx.fillStyle    = '#9be15d';
  ctx.font         = `bold 11px ${displayFont}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FRODRICK.EXE', bx + BOSS_W / 2, by - 16);

  // ── Boss HP bar (along top of arena) ─────────────────────────────────────
  const hpBarW = aw * 0.6;
  const hpBarX = ax + (aw - hpBarW) / 2;
  const hpBarY = ay + 8;
  const hpBarH = 10;
  ctx.strokeStyle = t.divider;
  ctx.lineWidth   = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
  const phaseColor = bossPhase28 === 2 ? '#ff3838' : bossPhase28 === 1 ? '#ffaa20' : '#9be15d';
  ctx.fillStyle   = phaseColor;
  ctx.fillRect(hpBarX + 1, hpBarY + 1, (hpBarW - 2) * (bossHP28 / BOSS_HP_MAX), hpBarH - 2);

  // ── Player ship ──────────────────────────────────────────────────────────
  const blink = playerHitTimer28 > 0 && Math.floor(playerHitTimer28 * 18) % 2 === 0;
  if (!blink) {
    ctx.fillStyle = '#88ddff';
    ctx.beginPath();
    ctx.moveTo(playerX28 + PLAYER_W / 2, playerY);
    ctx.lineTo(playerX28 + PLAYER_W,     playerY + PLAYER_H);
    ctx.lineTo(playerX28 + PLAYER_W * 0.7, playerY + PLAYER_H - 4);
    ctx.lineTo(playerX28 + PLAYER_W * 0.3, playerY + PLAYER_H - 4);
    ctx.lineTo(playerX28,                 playerY + PLAYER_H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#225577';
    ctx.lineWidth = 2;
    ctx.stroke();
    // engine glow
    ctx.fillStyle = '#ffcc40';
    const glowH = 4 + Math.sin(performance.now() / 60) * 2;
    ctx.fillRect(playerX28 + PLAYER_W * 0.42, playerY + PLAYER_H - 2, PLAYER_W * 0.16, glowH);
  }

  // ── Player bullets ───────────────────────────────────────────────────────
  ctx.fillStyle = '#88ddff';
  for (const b of playerBullets28) {
    ctx.fillRect(b.x - PLAYER_BULLET_W / 2, b.y - PLAYER_BULLET_H, PLAYER_BULLET_W, PLAYER_BULLET_H);
  }

  // ── Boss bullets ─────────────────────────────────────────────────────────
  ctx.fillStyle = phaseColor;
  for (const b of bossBullets28) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, BOSS_BULLET_R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Hint text ────────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font         = `bold 11px ${bodyFont}`;
  ctx.fillText('A / D or ← →  to move    ·    SPACE to fire', cx, ay + ah - 14);

  // ── RAF loop (only when actively playing) ─────────────────────────────────
  cancelAnimationFrame(animId28);
  if (
    state.currentLevel === 28 &&
    state.currentScreen === 'level' &&
    state.levelSubPhase === 'active' &&
    !state.paused &&
    !state.controlsOpen &&
    !state.gameOver
  ) {
    animId28 = requestAnimationFrame((ts: number) => {
      if (gc.state.currentLevel !== 28 || gc.state.currentScreen !== 'level') return;
      const dt = lastTime28 ? Math.min((ts - lastTime28) / 1000, 0.05) : 0.016;
      lastTime28 = ts;

      // ── Player movement ─────────────────────────────────────────────────
      let pvx = 0;
      const k = gc.keysDown;
      if (k.has('a') || k.has('A') || k.has('ArrowLeft'))  pvx -= 1;
      if (k.has('d') || k.has('D') || k.has('ArrowRight')) pvx += 1;
      playerX28 += pvx * PLAYER_SPEED * dt;
      playerX28 = Math.max(ax + 6, Math.min(ax + aw - PLAYER_W - 6, playerX28));

      // ── Player firing (hold SPACE) ──────────────────────────────────────
      playerFireT28 += dt;
      if ((k.has(' ') || k.has('Spacebar')) && playerFireT28 >= PLAYER_FIRE_CD) {
        playerFireT28 = 0;
        playerBullets28.push({
          x: playerX28 + PLAYER_W / 2,
          y: playerY,
          vx: 0,
          vy: -PLAYER_BULLET_SPD,
          life: 0,
        });
        gc.sounds.play("dash", { volume: 0.18, restart: true });
      }

      // ── Boss horizontal oscillation ─────────────────────────────────────
      bossT28 += dt;
      const oscRange = (aw - BOSS_W - 40) / 2;
      bossX28 = ax + (aw - BOSS_W) / 2 + Math.sin(bossT28 * Math.PI * 2 * BOSS_OSC_HZ[bossPhase28]) * oscRange;

      // ── Boss firing ─────────────────────────────────────────────────────
      bossFireT28 += dt;
      if (bossFireT28 >= BOSS_FIRE_INTERVALS[bossPhase28]) {
        bossFireT28 = 0;
        const speed = BOSS_BULLET_SPEEDS[bossPhase28];
        const bcx = bossX28 + BOSS_W / 2;
        const bcy = bossY + BOSS_H;
        if (bossPhase28 === 0) {
          bossBullets28.push({ x: bcx, y: bcy, vx: 0, vy: speed, life: 0 });
        } else if (bossPhase28 === 1) {
          bossBullets28.push({ x: bcx - 30, y: bcy, vx: 0, vy: speed, life: 0 });
          bossBullets28.push({ x: bcx,      y: bcy, vx: 0, vy: speed, life: 0 });
          bossBullets28.push({ x: bcx + 30, y: bcy, vx: 0, vy: speed, life: 0 });
        } else {
          for (let i = -2; i <= 2; i++) {
            const a = i * 0.22;
            bossBullets28.push({
              x: bcx, y: bcy,
              vx: speed * Math.sin(a),
              vy: speed * Math.cos(a),
              life: 0,
            });
          }
        }
        gc.sounds.play("boom", { volume: 0.18, restart: true });
      }

      // ── Update bullet positions ─────────────────────────────────────────
      for (const b of playerBullets28) { b.x += b.vx * dt; b.y += b.vy * dt; }
      for (const b of bossBullets28)   { b.x += b.vx * dt; b.y += b.vy * dt; }

      // ── Player bullet vs boss collision ─────────────────────────────────
      for (let i = playerBullets28.length - 1; i >= 0; i--) {
        const b = playerBullets28[i];
        if (b.x >= bossX28 && b.x <= bossX28 + BOSS_W &&
            b.y >= bossY   && b.y <= bossY   + BOSS_H) {
          playerBullets28.splice(i, 1);
          bossHP28 = Math.max(0, bossHP28 - PLAYER_DMG);
          const newPhase = phaseFor(bossHP28);
          if (newPhase !== bossPhase28) {
            bossPhase28 = newPhase;
            phaseFlash28 = 1;
          }
          gc.sounds.play("correctAnswer", { volume: 0.20, restart: true });
          if (bossHP28 === 0) {
            gc.sounds.play("correctAnswer", { volume: 0.6, restart: true });
            initialized28 = false;
            gc.state.currentLevel  = 29;
            gc.state.levelSubPhase = '';
            cancelAnimationFrame(animId28);
            gc.render();
            return;
          }
        }
      }

      // ── Boss bullet vs player collision (with i-frames) ────────────────
      if (playerHitTimer28 <= 0) {
        for (let i = bossBullets28.length - 1; i >= 0; i--) {
          const b = bossBullets28[i];
          // circle vs rect collision
          const px = playerX28, py = playerY, pw = PLAYER_W, ph = PLAYER_H;
          const nx = Math.max(px, Math.min(b.x, px + pw));
          const ny = Math.max(py, Math.min(b.y, py + ph));
          const dx = b.x - nx, dy = b.y - ny;
          if (dx * dx + dy * dy < BOSS_BULLET_R * BOSS_BULLET_R) {
            bossBullets28.splice(i, 1);
            playerHitTimer28 = PLAYER_IFRAMES;
            gc.loseLife();
            break;
          }
        }
      } else {
        playerHitTimer28 = Math.max(0, playerHitTimer28 - dt);
      }

      // ── Cull off-arena bullets ──────────────────────────────────────────
      playerBullets28 = playerBullets28.filter(b => b.y > ay - 30);
      bossBullets28   = bossBullets28.filter(b =>
        b.y < ay + ah + 30 && b.x > ax - 30 && b.x < ax + aw + 30
      );

      // ── Decay phase flash ───────────────────────────────────────────────
      if (phaseFlash28 > 0) phaseFlash28 = Math.max(0, phaseFlash28 - dt * 4);

      gc.render();
    });
  }
};
