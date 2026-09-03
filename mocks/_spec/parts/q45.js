module.exports = {
  q: 45,
  title: 'OtB · Q.45 Runaway Submit Mock (current theme)',
  h1: 'Q.45 · Runaway Submit · REWORK',
  sub: `Fully playable. Reworked per your verdict. The SUBMIT button flees with the source's numbers (150 px radius, speed 9), and it screams: the original Q5 clip (clickDontClickSoundEffect.mp3) plays every time your cursor comes at it and every time it bolts. It cannot be cornered straight away: a STAMINA meter in the corner of the paper drains only while you are actually pushing it around, and until you have chased it about 2,600 px of flight, any time you pin it against an edge it bolts to a fresh spot along the wall. Once winded, it is the old level: herd it into a corner, it gives up ("OK OK FINE"), click it. The examiner sprite follows it around, the remarks count escapes, and after twenty seconds he offers "Stop chasing it. Think like a sheepdog."`,
  css: `
  .q45prompt{position:absolute; left:0; right:0; top:12%; text-align:center; font-family:var(--display); font-weight:bold; font-size:26px; color:var(--ink);}
  .q45sub{position:absolute; left:0; right:0; top:21%; text-align:center; font-family:var(--body); font-size:14px; color:var(--fgDim);}
  .runaway{position:absolute; width:150px; height:52px; font-size:22px; padding:0; transition:none;}
  .runaway.bolt{transition:left .22s cubic-bezier(.2,.8,.3,1), top .22s cubic-bezier(.2,.8,.3,1);}
  .runaway.cornered{font-size:16px; letter-spacing:.04em;}
  .stamina{position:absolute; right:22px; top:14px; width:150px; font-family:var(--mono); font-size:9px; letter-spacing:.16em; color:var(--fgDim);}
  .stamina .bar{height:7px; border:1.5px solid var(--stroke); margin-top:4px; position:relative; background:var(--bg);}
  .stamina .bar i{position:absolute; left:0; top:0; bottom:0; width:100%; background:var(--pass);}
  .stamina.winded{color:var(--danger);}
  .stamina.winded .bar i{background:var(--danger);}
`,
  html: `
      <div class="q45prompt">Press SUBMIT to continue.</div>
      <div class="q45sub">…if you can. Some things run when you reach for them.</div>
      <div class="stamina" id="stamina">BUTTON STAMINA<div class="bar"><i id="stfill"></i></div></div>
      <button class="btn runaway" id="submitBtn">SUBMIT</button>
`,
  js: `
M.q = 45; M.next = 46; M.nextName = 'Recall';
const FLEE_RADIUS = 150, FLEE_SPEED = 9, BW = 150, BH = 52, STAMINA = 2600;
const PW = 1044, PH = 381;
const minX = PW * 0.04, maxX = PW * 0.96 - BW, minY = PW * 0 + PH * 0.30, maxY = PH * 0.90 - BH;
const SCREAM = '../public/assets/sounds/clickDontClickSoundEffect.mp3';
M.level = { x: PW / 2 - BW / 2, y: PH * 0.45, mouse: { x: -999, y: -999 }, escapes: 0, bolts: 0, chased: 0, winded: false, cornered: false, elapsed: 0, inRange: false, boltUntil: 0 };
const btn = $('submitBtn'), play = $('play'), img = $('examinerImg');
const place = () => { btn.style.left = M.level.x + 'px'; btn.style.top = M.level.y + 'px'; };
place();
play.addEventListener('pointermove', (e) => { const r = play.getBoundingClientRect(); M.level.mouse = { x: (e.clientX - r.left) * PW / r.width, y: (e.clientY - r.top) * PH / r.height }; });
play.addEventListener('pointerleave', () => { M.level.mouse = { x: -999, y: -999 }; });
btn.onclick = () => { if (M.solved || M.ended || M.paused) return; M.events.push('caught'); M.win('CAUGHT.', 'You stopped chasing and started cornering. That is the whole trick.'); };
let lastScream = -9999;
const scream = () => { const t = performance.now(); if (t - lastScream < 900) return; lastScream = t; M.play(SCREAM, { volume: 0.6 }); M.events.push('scream'); };
function bolt() {
  const L = M.level; const m = L.mouse;
  // pick a spot along the edges at least 380 px from the cursor
  let best = null;
  for (let i = 0; i < 40; i++) {
    const side = Math.floor(Math.random() * 4);
    const cand = side === 0 ? { x: minX + Math.random() * (maxX - minX), y: minY } : side === 1 ? { x: minX + Math.random() * (maxX - minX), y: maxY } : side === 2 ? { x: minX, y: minY + Math.random() * (maxY - minY) } : { x: maxX, y: minY + Math.random() * (maxY - minY) };
    const d = Math.hypot(cand.x + BW / 2 - m.x, cand.y + BH / 2 - m.y);
    if (!best || d > best.d) best = { ...cand, d };
    if (d > 380) break;
  }
  L.x = best.x; L.y = best.y; L.bolts++; L.boltUntil = performance.now() + 260; M.events.push('bolt:' + L.bolts);
  btn.classList.add('bolt'); place(); setTimeout(() => btn.classList.remove('bolt'), 260);
  scream();
  if (L.bolts === 1) M.retype('It has a lot left in it. Tire it out first.');
}
function tick() {
  if (!M.paused && !M.solved && !M.ended) {
    const L = M.level;
    if (performance.now() >= L.boltUntil) {
      const bcx = L.x + BW / 2, bcy = L.y + BH / 2;
      const dx = bcx - L.mouse.x, dy = bcy - L.mouse.y, dist = Math.hypot(dx, dy);
      if (dist < FLEE_RADIUS && dist > 0.001) {
        const force = (FLEE_RADIUS - dist) / FLEE_RADIUS;
        const wantX = L.x + (dx / dist) * FLEE_SPEED * force, wantY = L.y + (dy / dist) * FLEE_SPEED * force;
        const nx = Math.max(minX, Math.min(maxX, wantX)), ny = Math.max(minY, Math.min(maxY, wantY));
        const moved = Math.abs(nx - L.x) + Math.abs(ny - L.y);
        const blocked = Math.abs(wantX - nx) + Math.abs(wantY - ny) > 0.5;
        L.x = nx; L.y = ny; place();
        if (!L.inRange) { L.inRange = true; L.escapes++; M.events.push('escape:' + L.escapes); scream(); if (L.escapes > 1 && L.escapes % 3 === 0) M.retype('Escapes: ' + L.escapes + '.'); }
        if (!L.winded) {
          L.chased += moved; $('stfill').style.width = Math.max(0, 100 - L.chased / STAMINA * 100) + '%';
          if (L.chased >= STAMINA) { L.winded = true; $('stamina').classList.add('winded'); $('stamina').firstChild.textContent = 'BUTTON WINDED'; M.events.push('winded'); M.retype('It is winded. Now it can be cornered.'); }
          else if (blocked && dist < FLEE_RADIUS * 0.7) bolt();
        } else {
          const cornered = moved < 0.4 && dist < FLEE_RADIUS * 0.6;
          if (cornered !== L.cornered) { L.cornered = cornered; btn.classList.toggle('cornered', cornered); btn.textContent = cornered ? 'OK OK FINE' : 'SUBMIT'; if (cornered) M.events.push('cornered'); }
        }
        img.src = '../public/assets/Player/Player_' + (bcx < PW * 0.4 ? 'Left' : bcx > PW * 0.6 ? 'Right' : 'Down') + '.png';
      } else if (L.inRange) { L.inRange = false; }
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
M.retype('Just press submit and we can move on. ...it seems the button has other ideas. Tire it out, then back it into a corner.');
setInterval(() => { if (M.paused || M.solved || M.ended) return; M.level.elapsed += 0.5; if (M.level.elapsed >= 20 && !M.level.sheep) { M.level.sheep = true; M.retype('Stop chasing it. Think like a sheepdog.'); } }, 500);
`,
};
