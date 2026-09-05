import { GameContext } from '../types';
import { getTheme }    from '../theme';
import { getLayout }   from '../layout';
import { drawButton }  from '../renderer';
import { drawWinScreen } from './lateralHelpers';
import Vec2            from '../../../Wolfie2D/DataTypes/Vec2';
import StateMachine    from '../../../Wolfie2D/DataTypes/State/StateMachine';
import State           from '../../../Wolfie2D/DataTypes/State/State';
import GameEvent       from '../../../Wolfie2D/Events/GameEvent';

// ── Constants ─────────────────────────────────────────────────────────────────
// Offset into pongBallBounce.mp3 where the actual hit sound sits.
// Adjust this if the bounce feels early/late (seconds).
const BOUNCE_OFFSET = 0.45;

const PADDLE_H      = 0.22;   // fraction of court height
const PADDLE_W      = 0.018;  // fraction of court width
const BALL_R        = 0.013;  // fraction of court width
const PLAYER_LEFT   = 0.025;  // left edge of player paddle (normalised)
const AI_RIGHT      = 0.975;  // right edge of AI paddle (normalised)
const SPEED_INIT    = 0.48;   // initial ball speed (court-widths / sec)
const SPEED_MAX     = 0.95;
const PLAYER_SPEED  = 1.1;    // court-heights / sec for keyboard movement
const AI_CHASE_SPEED = 0.34;  // max AI movement per sec when chasing (reduced)
const AI_IDLE_SPEED  = 0.18;  // max AI drift speed when idle
const AI_LERP        = 3.5;   // AI smoothing (lerp factor per second, softer)
const WIN_SCORE     = 3;

// ── Shared AI data (passed between states via the PongAI state machine) ───────
interface PongAIData {
  ballPos:       Vec2;
  ballVel:       Vec2;
  aiY:           number;
  aiTargetY:     number;
  reactionTimer: number;   // seconds before AI reacts after ball changes direction
  noiseSeed:     number;   // sticky noise offset, re-rolled per rally
}

// ── Wolfie2D States ───────────────────────────────────────────────────────────

/** Ball is heading away from AI — paddle drifts lazily toward center */
class PongIdleState extends State {
  onEnter(_options: Record<string, any>): void {}
  onExit():  Record<string, any> { return {}; }
  handleInput(_event: GameEvent): void {}

  update(dt: number): void {
    const data = (this.parent as PongAI).data;

    // Lazy drift toward y=0.5
    const diff    = 0.5 - data.aiY;
    const maxStep = AI_IDLE_SPEED * dt;
    data.aiY += Math.sign(diff) * Math.min(Math.abs(diff) * 1.5 * dt, maxStep);
    data.aiY  = Math.max(PADDLE_H / 2, Math.min(1 - PADDLE_H / 2, data.aiY));

    // Ball now heading toward AI → transition to chase (after reaction delay)
    if (data.ballVel.x > 0) {
      // Reaction delay: 200 – 450 ms — makes it look human and miss occasionally
      data.reactionTimer = 0.20 + Math.random() * 0.25;
      // Roll a new sticky noise offset for this rally
      data.noiseSeed = (Math.random() - 0.5) * 0.20;
      this.finished("chase");
    }
  }
}

/** Ball is heading toward AI — paddle tracks ball with imperfect prediction */
class PongChaseState extends State {
  onEnter(_options: Record<string, any>): void {}
  onExit():  Record<string, any> { return {}; }
  handleInput(_event: GameEvent): void {}

  update(dt: number): void {
    const data = (this.parent as PongAI).data;

    if (data.reactionTimer > 0) {
      // Frozen reaction period — keep moving toward old target but don't update it
      data.reactionTimer -= dt;
    } else {
      // Update target with sticky noise (doesn't re-roll every frame so it
      // commits to a slightly wrong position, making it missable)
      data.aiTargetY = data.ballPos.y + data.noiseSeed;
    }

    const diff    = data.aiTargetY - data.aiY;
    const maxStep = AI_CHASE_SPEED * dt;
    data.aiY += Math.sign(diff) * Math.min(Math.abs(diff) * AI_LERP * dt, maxStep);
    data.aiY  = Math.max(PADDLE_H / 2, Math.min(1 - PADDLE_H / 2, data.aiY));

    // Ball heading away again → back to idle
    if (data.ballVel.x <= 0) {
      this.finished("idle");
    }
  }
}

// ── PongAI — StateMachine that owns and drives the AI paddle ─────────────────
class PongAI extends StateMachine {
  data: PongAIData = {
    ballPos:       new Vec2(0.5, 0.5),
    ballVel:       new Vec2(0, 0),
    aiY:           0.5,
    aiTargetY:     0.5,
    reactionTimer: 0,
    noiseSeed:     0,
  };

  constructor() {
    super();
    this.addState("idle",  new PongIdleState(this));
    this.addState("chase", new PongChaseState(this));
    this.initialize("idle", {});
  }

  reset(): void {
    this.data.aiY           = 0.5;
    this.data.aiTargetY     = 0.5;
    this.data.reactionTimer = 0;
    this.data.noiseSeed     = 0;
    // Force back to idle state
    this.initialize("idle", {});
  }
}

// ── Game state ────────────────────────────────────────────────────────────────
let animId6      = 0;
let lastTime     = 0;
let ballPos      = new Vec2(0.5, 0.5);
let ballVel      = new Vec2(0, 0);
let playerY      = 0.5;
let playerScore  = 0;
let aiScore      = 0;
let rallying     = false;
let pongAI       = new PongAI();

function resetPong() {
  ballPos     = new Vec2(0.5, 0.5);
  ballVel     = new Vec2(0, 0);
  playerY     = 0.5;
  playerScore = 0;
  aiScore     = 0;
  rallying    = false;
  lastTime    = 0;
  pongAI      = new PongAI();
}

function serve(towardAI: boolean) {
  ballPos = new Vec2(0.5, 0.5);
  const angle = (Math.random() - 0.5) * 0.6;
  const dir   = towardAI ? 1 : -1;
  ballVel = new Vec2(
    dir * SPEED_INIT * Math.cos(angle),
    SPEED_INIT * Math.sin(angle),
  );
  rallying = true;
}

export const drawLevel6 = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const { w, topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const t  = getTheme(state);
  const cx = w / 2;

  // ── Initialise on fresh entry ─────────────────────────────────────────────
  if (state.levelSubPhase !== "active" && state.levelSubPhase !== "win") {
    resetPong();
    state.winChimeFor = -1;
    state.levelSubPhase = "active";
  }

  const cw = topBoxWidth;
  const ch = topBoxHeight;
  const ox = topBoxX;
  const oy = topBoxY;

  // ── Win screen ─────────────────────────────────────────────────────────────
  if (state.levelSubPhase === "win") {
    cancelAnimationFrame(animId6);
    drawWinScreen(gc, `MATCH POINT.  ${playerScore} – ${aiScore}`,
      "Frodrick plays by patterns. You did not.", 7);
    return;
  }

  // ── Court decorations ─────────────────────────────────────────────────────
  ctx.strokeStyle = t.divider;
  ctx.lineWidth   = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(ox + cw / 2, oy + 6);
  ctx.lineTo(ox + cw / 2, oy + ch - 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Scores
  ctx.fillStyle    = t.fgDim;
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.font         = `bold 40px ${displayFont}`;
  ctx.fillText(`${playerScore}`, ox + cw * 0.26, oy + 10);
  ctx.fillText(`${aiScore}`,     ox + cw * 0.74, oy + 10);
  ctx.font = `11px ${bodyFont}`;
  ctx.fillText("YOU",      ox + cw * 0.26, oy + 58);
  ctx.fillText("Frodrick", ox + cw * 0.74, oy + 58);

  // ── Control hint ──────────────────────────────────────────────────────────
  ctx.fillStyle    = t.fgDim;
  ctx.font         = `11px ${bodyFont}`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("W/S or ↑/↓ to move   |   SPACE to serve", cx, oy + ch - 6);

  // ── Serve prompt ──────────────────────────────────────────────────────────
  if (!rallying) {
    ctx.fillStyle    = t.fg;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.font         = `bold 19px ${displayFont}`;
    ctx.fillText("PRESS SPACE TO SERVE", cx, oy + ch * 0.5);
  }

  // ── Paddles ───────────────────────────────────────────────────────────────
  const pPxH = PADDLE_H * ch;
  const pPxW = PADDLE_W * cw;
  const bPxR = BALL_R   * cw;

  ctx.fillStyle = t.fg;
  ctx.fillRect(ox + PLAYER_LEFT * cw, oy + (playerY - PADDLE_H / 2) * ch, pPxW, pPxH);
  ctx.fillRect(ox + (AI_RIGHT - PADDLE_W) * cw, oy + (pongAI.data.aiY - PADDLE_H / 2) * ch, pPxW, pPxH);

  // ── Ball ──────────────────────────────────────────────────────────────────
  if (rallying) {
    ctx.beginPath();
    ctx.arc(ox + ballPos.x * cw, oy + ballPos.y * ch, bPxR, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Physics loop ──────────────────────────────────────────────────────────
  cancelAnimationFrame(animId6);
  if (state.levelSubPhase !== "active") return;

  animId6 = requestAnimationFrame((ts: number) => {
    if (gc.state.currentLevel !== 6 || gc.state.currentScreen !== "level") return;

    const dt = lastTime ? Math.min((ts - lastTime) / 1000, 0.05) : 0.016;
    lastTime = ts;

    // Spacebar serve
    if (!rallying) {
      if (gc.keysDown.has(' ') || gc.keysDown.has('Spacebar')) {
        serve(true);
      }
      gc.render();
      return;
    }

    // ── Player keyboard movement ─────────────────────────────────────────
    const up   = gc.keysDown.has('w') || gc.keysDown.has('W') || gc.keysDown.has('ArrowUp');
    const down = gc.keysDown.has('s') || gc.keysDown.has('S') || gc.keysDown.has('ArrowDown');
    if (up)   playerY -= PLAYER_SPEED * dt;
    if (down) playerY += PLAYER_SPEED * dt;
    playerY = Math.max(PADDLE_H / 2, Math.min(1 - PADDLE_H / 2, playerY));

    // ── Ball physics (Vec2) ──────────────────────────────────────────────
    ballPos = new Vec2(
      ballPos.x + ballVel.x * dt,
      ballPos.y + ballVel.y * dt,
    );

    // Top / bottom walls
    if (ballPos.y - BALL_R < 0) {
      ballPos = new Vec2(ballPos.x, BALL_R);
      ballVel = new Vec2(ballVel.x, Math.abs(ballVel.y));
      gc.sounds.play("pongBounce", { volume: 0.7, startTime: BOUNCE_OFFSET });
    }
    if (ballPos.y + BALL_R > 1) {
      ballPos = new Vec2(ballPos.x, 1 - BALL_R);
      ballVel = new Vec2(ballVel.x, -Math.abs(ballVel.y));
      gc.sounds.play("pongBounce", { volume: 0.7, startTime: BOUNCE_OFFSET });
    }

    // Player paddle — right face at PLAYER_LEFT + PADDLE_W
    const playerRight = PLAYER_LEFT + PADDLE_W;
    if (ballVel.x < 0 &&
        ballPos.x - BALL_R < playerRight &&
        ballPos.x + BALL_R > PLAYER_LEFT &&
        Math.abs(ballPos.y - playerY) < PADDLE_H / 2 + BALL_R) {
      const newSpeed = Math.min(SPEED_MAX, Math.abs(ballVel.x) * 1.05);
      const deflect  = ((ballPos.y - playerY) / (PADDLE_H / 2)) * 0.65;
      ballPos = new Vec2(playerRight + BALL_R, ballPos.y);
      ballVel = new Vec2(newSpeed, deflect);
      gc.sounds.play("pongBounce", { volume: 0.7, startTime: BOUNCE_OFFSET });
    }

    // AI paddle — left face at AI_RIGHT - PADDLE_W
    const aiLeft = AI_RIGHT - PADDLE_W;
    if (ballVel.x > 0 &&
        ballPos.x + BALL_R > aiLeft &&
        ballPos.x - BALL_R < AI_RIGHT &&
        Math.abs(ballPos.y - pongAI.data.aiY) < PADDLE_H / 2 + BALL_R) {
      const newSpeed = Math.min(SPEED_MAX, Math.abs(ballVel.x) * 1.05);
      const deflect  = ((ballPos.y - pongAI.data.aiY) / (PADDLE_H / 2)) * 0.65;
      ballPos = new Vec2(aiLeft - BALL_R, ballPos.y);
      ballVel = new Vec2(-newSpeed, deflect);
      gc.sounds.play("pongBounce", { volume: 0.7, startTime: BOUNCE_OFFSET });
    }

    // ── Wolfie2D StateMachine AI update ──────────────────────────────────
    pongAI.data.ballPos = ballPos;
    pongAI.data.ballVel = ballVel;
    pongAI.update(dt);

    // Scoring
    if (ballPos.x < 0) {
      aiScore++;
      rallying = false;
      if (aiScore >= WIN_SCORE) {
        gc.state.levelSubPhase = "";
        gc.loseLife();
        return;
      }
    }
    if (ballPos.x > 1) {
      playerScore++;
      rallying = false;
      if (playerScore >= WIN_SCORE) {
        gc.state.levelSubPhase = "win";
      }
    }

    gc.render();
  });
};
