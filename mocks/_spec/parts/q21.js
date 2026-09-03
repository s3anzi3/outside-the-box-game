module.exports = {
  q: 21,
  title: 'OtB · Q.21 Frodrick Rematch Mock (current theme)',
  h1: 'Q.21 · Frodrick Rematch · FAITHFUL PORT',
  sub: `Fully playable. Reworked per your verdict: the old intro popup is gone and the examiner's remark reads only "he has returned...". The original sound is in: the hard pong music (pongBGMusicHard.mp3) loops from your first key or click, the ball plays the real bounce clip on every wall and paddle, and the master SOUND slider in the pause menu now actually controls it. Faithful to Level21.ts otherwise: pong against Frodrick with an absurdly long paddle (46% of the court) and perfect tracking, so a fair rally cannot be won. W/S or the arrows move you, SPACE serves, first to three; if Frodrick reaches three you lose a heart and the scores reset. The trick, from the real build: hold the left mouse button down on Frodrick's paddle and it freezes (turns fountain-pen red) for as long as you hold, and the ball sails past. Ball speed, growth per hit, deflection and paddle speeds are the source's numbers. Quirks: while you hold the paddle the examiner turns away and the standing label reads UNSUPERVISED, the first freeze earns "...I saw nothing.", and the first point earns "Frodrick is filing a complaint. It will be ignored." Pause freezes the physics.`,
  css: `
  #court{position:absolute; left:0; top:0; width:100%; height:100%; display:block; touch-action:none;}
  #court.grab{cursor:pointer;}
  .intro{position:absolute; left:4%; top:5%; width:92%; height:90%; background:var(--panel); border:2.5px solid var(--stroke); z-index:5;}
  .intro::before{content:""; position:absolute; inset:5px; border:1px solid var(--hairline); pointer-events:none;}
  .intro img{position:absolute; left:calc(12% - 28px); top:12%; width:56px; image-rendering:pixelated;}
  .intro .who{position:absolute; left:calc(12% - 40px); width:80px; top:calc(12% + 62px); text-align:center; font-family:var(--mono); font-size:9px; color:var(--accent);}
  .intro .ey{position:absolute; left:22%; top:10%; font-family:var(--mono); font-size:11px; color:var(--fgDim);}
  .intro .l{position:absolute; left:22%; width:74%; font-family:var(--body); font-size:16px; color:var(--ink);}
  .intro .btn{position:absolute; left:50%; bottom:18px; transform:translateX(-50%); width:180px; height:44px; font-size:18px; padding:0;}
`,
  html: `
      <canvas id="court" width="1044" height="381"></canvas>
`,
  js: `
M.q = 21; M.next = 22; M.nextName = 'Did You Catch That';
const PLAYER_H = 0.18, FROD_H = 0.46, PAD_W = 0.018, BALL_R = 0.013, PLAYER_LEFT = 0.025, AI_RIGHT = 0.975;
const SPEED_INIT = 0.48, SPEED_MAX = 0.95, PLAYER_SPEED = 1.1, FROD_SPEED = 4.8, WIN_SCORE = 3;
const cv = $('court'), ctx = cv.getContext('2d'), CW = 1044, CH = 381;
M.level = { intro: false, ball: { x: .5, y: .5 }, vel: { x: 0, y: 0 }, playerY: .5, aiY: .5, you: 0, frod: 0, rallying: false, frozen: false, holding: false, over: false, mouse: { x: -1, y: -1 }, keys: new Set(), frozeOnce: false, scoredOnce: false, music: false };
M.test = { serveAngle: null };
const BGM = '../public/assets/sounds/pongBGMusicHard.mp3', BOUNCE = '../public/assets/sounds/pongBallBounce.mp3';
const music = () => { if (M.level.music || M.solved || M.ended) return; M.level.music = true; M.play(BGM, { loop: true, volume: 0.35, restart: false }); };
const bounce = () => M.play(BOUNCE, { volume: 0.7, startTime: 0.45, restart: true });
document.addEventListener('pointerdown', music, { once: false });
document.addEventListener('keydown', (e) => { if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); M.level.keys.add(e.key); music(); if (e.key === ' ' && !M.level.rallying && !M.level.intro && !M.paused && !M.solved && !M.ended) serve(); });
document.addEventListener('keyup', (e) => M.level.keys.delete(e.key));
function serve() { const a = M.test.serveAngle !== null ? M.test.serveAngle : (Math.random() - 0.5) * 0.6; M.level.ball = { x: .5, y: .5 }; M.level.vel = { x: SPEED_INIT * Math.cos(a), y: SPEED_INIT * Math.sin(a) }; M.level.rallying = true; M.events.push('serve'); }
const frodRect = () => ({ x: (AI_RIGHT - PAD_W) * CW, y: (M.level.aiY - FROD_H / 2) * CH, w: PAD_W * CW, h: FROD_H * CH });
const overFrod = () => { const r = frodRect(), m = M.level.mouse; return m.x >= r.x - 6 && m.x <= r.x + r.w + 6 && m.y >= r.y && m.y <= r.y + r.h; };
const cpt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height }; };
cv.addEventListener('pointermove', (e) => { M.level.mouse = cpt(e); cv.classList.toggle('grab', overFrod()); });
cv.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; M.level.mouse = cpt(e); M.level.holding = true; cv.setPointerCapture(e.pointerId); });
const rel = () => { M.level.holding = false; };
cv.addEventListener('pointerup', rel); cv.addEventListener('pointercancel', rel); cv.addEventListener('pointerleave', () => { M.level.mouse = { x: -1, y: -1 }; });
const who = document.querySelector('.standing-lbl');
function setFrozen(f) {
  if (f === M.level.frozen) return; M.level.frozen = f;
  $('examinerImg').src = '../public/assets/Player/Player_' + (f ? 'Right' : 'Down') + '.png';
  who.textContent = f ? 'CANDIDATE STANDING · UNSUPERVISED' : 'CANDIDATE STANDING';
  if (f && !M.level.frozeOnce) { M.level.frozeOnce = true; M.events.push('frozen'); M.retype('...I saw nothing.'); }
}
let last = 0;
function step(ts) {
  const L = M.level; const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016; last = ts;
  if (!M.paused && !M.solved && !M.ended && !L.intro) {
    setFrozen(L.holding && overFrod());
    const up = L.keys.has('w') || L.keys.has('W') || L.keys.has('ArrowUp'), down = L.keys.has('s') || L.keys.has('S') || L.keys.has('ArrowDown');
    if (up) L.playerY -= PLAYER_SPEED * dt; if (down) L.playerY += PLAYER_SPEED * dt;
    L.playerY = Math.max(PLAYER_H / 2, Math.min(1 - PLAYER_H / 2, L.playerY));
    if (L.rallying) {
      L.ball.x += L.vel.x * dt; L.ball.y += L.vel.y * dt;
      if (L.ball.y - BALL_R < 0) { L.ball.y = BALL_R; L.vel.y = Math.abs(L.vel.y); bounce(); }
      if (L.ball.y + BALL_R > 1) { L.ball.y = 1 - BALL_R; L.vel.y = -Math.abs(L.vel.y); bounce(); }
      const pr = PLAYER_LEFT + PAD_W;
      if (L.vel.x < 0 && L.ball.x - BALL_R < pr && L.ball.x + BALL_R > PLAYER_LEFT && Math.abs(L.ball.y - L.playerY) < PLAYER_H / 2 + BALL_R) {
        const sp = Math.min(SPEED_MAX, Math.abs(L.vel.x) * 1.05); L.ball.x = pr + BALL_R; L.vel = { x: sp, y: ((L.ball.y - L.playerY) / (PLAYER_H / 2)) * 0.65 }; M.events.push('you:return'); bounce();
      }
      const al = AI_RIGHT - PAD_W;
      if (L.vel.x > 0 && L.ball.x + BALL_R > al && L.ball.x - BALL_R < AI_RIGHT && Math.abs(L.ball.y - L.aiY) < FROD_H / 2 + BALL_R) {
        const sp = Math.min(SPEED_MAX, Math.abs(L.vel.x) * 1.05); L.ball.x = al - BALL_R; L.vel = { x: -sp, y: ((L.ball.y - L.aiY) / (FROD_H / 2)) * 0.65 }; M.events.push('frodrick:return'); bounce();
      }
      if (!L.frozen) {
        if (L.vel.x > 0) { const d = L.ball.y - L.aiY; L.aiY += Math.sign(d) * Math.min(Math.abs(d), FROD_SPEED * dt); }
        else { const d = 0.5 - L.aiY; L.aiY += Math.sign(d) * Math.min(Math.abs(d) * 6 * dt, FROD_SPEED * dt); }
        L.aiY = Math.max(FROD_H / 2, Math.min(1 - FROD_H / 2, L.aiY));
      }
      if (L.ball.x < 0) { L.frod++; L.rallying = false; M.events.push('point:frodrick'); if (L.frod >= WIN_SCORE) { L.you = 0; L.frod = 0; M.wrong('Three to nothing. He did not even have to move. Well. He could not have.'); } }
      if (L.ball.x > 1) { L.you++; L.rallying = false; M.events.push('point:you'); if (!L.scoredOnce) { L.scoredOnce = true; M.retype('Frodrick is filing a complaint. It will be ignored.'); } if (L.you >= WIN_SCORE) M.win('YOU CHEATED!', 'Frodrick never saw it coming. ' + L.you + ' to ' + L.frod + '.'); }
    }
  }
  draw();
  requestAnimationFrame(step);
}
function draw() {
  const L = M.level, cs = getComputedStyle($('frame'));
  const ink = cs.getPropertyValue('--ink').trim(), dim = cs.getPropertyValue('--fgDim').trim(), hair = cs.getPropertyValue('--hairline').trim();
  ctx.clearRect(0, 0, CW, CH);
  ctx.strokeStyle = hair; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(CW / 2, 6); ctx.lineTo(CW / 2, CH - 6); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = dim; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = 'bold 40px Georgia'; ctx.fillText(L.you, CW * 0.26, 10); ctx.fillText(L.frod, CW * 0.74, 10);
  ctx.font = '11px Helvetica, Arial'; ctx.fillText('YOU', CW * 0.26, 58); ctx.fillText('Frodrick', CW * 0.74, 58);
  ctx.textBaseline = 'bottom'; ctx.fillText('W/S or ↑/↓ to move   |   SPACE to serve', CW / 2, CH - 6);
  if (!L.rallying && !L.intro) { ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.font = 'bold 19px Georgia'; ctx.fillText('PRESS SPACE TO SERVE', CW / 2, CH / 2); }
  ctx.fillStyle = ink; ctx.fillRect(PLAYER_LEFT * CW, (L.playerY - PLAYER_H / 2) * CH, PAD_W * CW, PLAYER_H * CH);
  const fr = frodRect(); ctx.fillStyle = L.frozen ? '#C03A2E' : ink; ctx.fillRect(fr.x, fr.y, fr.w, fr.h);
  if (L.rallying) { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(L.ball.x * CW, L.ball.y * CH, BALL_R * CW, 0, Math.PI * 2); ctx.fill(); }
}
requestAnimationFrame(step);
M.retype('he has returned...');
`,
};
