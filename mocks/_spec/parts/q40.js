module.exports = {
  q: 40,
  title: 'OtB · Q.40 Hold to Reboot Mock (current theme)',
  h1: 'Q.40 · Hold to Reboot · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level40.ts: the exam has crashed into a jittering KERNEL PANIC with a fake panic log, and the only control is HOLD TO REBOOT. A tap does nothing except add "tap registered. insufficient." to the log. Press and hold for 1.8 seconds (the source's HOLD_MS) and the green bar fills; let go early and it drains at double speed, exactly as in the real build. Quirk from the brief: the whole chrome reboots with the exam while you hold. The logo dims, the hearts go hollow, the paper's caption reads REBOOTING, and the examiner flickers between facings, all restoring the moment you release or the reboot completes. The log carries a few jokes (FRODRICK.EXE: not found (good)). Pause freezes the hold. Win copy from the real build.`,
  css: `
  .panic{position:absolute; left:0; right:0; top:8%; text-align:center; font-family:var(--display); font-weight:bold; font-size:30px; color:var(--danger); animation:jit .12s steps(2) infinite;}
  @keyframes jit{0%{transform:translateX(0)} 50%{transform:translateX(2px)} 100%{transform:translateX(-2px)}}
  .q40line{position:absolute; left:0; right:0; top:22%; text-align:center; font-family:var(--body); font-size:16px; color:var(--fgMid);}
  .plog{position:absolute; left:6%; top:31%; width:30%; font-family:var(--mono); font-size:10px; line-height:1.55; color:var(--fgDim); white-space:pre;}
  .plog b{color:var(--danger); font-weight:normal;}
  .holdbtn{position:absolute; left:50%; top:44%; transform:translateX(-50%); width:355px; height:76px; background:var(--danger); border:3px solid var(--stroke); color:#fff;
    font-family:var(--display); font-weight:bold; font-size:20px; cursor:pointer; user-select:none; touch-action:none; overflow:hidden;}
  .holdbtn.down{background:#6E1E1A;}
  .holdbtn .fill{position:absolute; left:0; bottom:0; height:8px; width:0; background:var(--pass);}
  .pct{position:absolute; left:0; right:0; top:70%; text-align:center; font-family:var(--body); font-size:13px; color:var(--fgDim);}
  .frame.rebooting .logo img{opacity:.35; filter:grayscale(1);}
  .frame.rebooting .hp path{fill:none; stroke:var(--hairline); stroke-width:2;}
  .logo img{transition:opacity .2s, filter .2s;}
`,
  html: `
      <div class="panic">▓▒ KERNEL PANIC ▒▓</div>
      <div class="q40line">The exam has crashed. Force a reboot, and do not let go.</div>
      <div class="plog" id="plog"></div>
      <div class="holdbtn" id="holdBtn">HOLD TO REBOOT<div class="fill" id="fill"></div></div>
      <div class="pct" id="pct">0%</div>
`,
  js: `
M.q = 40; M.next = 41; M.nextName = 'Reply';
const HOLD_MS = 1800;
M.level = { held: 0, down: false, taps: 0 };
const LOG = ['[ 0.000] institute.exam: unhandled candidate', '[ 0.002] FRODRICK.EXE: not found (good)', '[ 0.113] candidate.patience: unverified', '[ 0.114] corporate.approval: pending since 1987', '[ 0.120] answer_key.dat: <b>corrupt</b>', '[ 0.121] hearts.sys: 3 of 3 (for now)', '[ 0.400] panic: forced reboot required'];
const plog = $('plog'); plog.innerHTML = LOG.join('\\n');
const btn = $('holdBtn');
const caption = $('caption'), img = $('examinerImg');
const FACES = ['Down', 'Left', 'Up', 'Right'];
let last = 0, flick = 0, downAt = 0;
btn.addEventListener('pointerdown', (e) => { if (M.solved || M.ended || M.paused) return; M.level.down = true; downAt = performance.now(); btn.classList.add('down'); btn.setPointerCapture(e.pointerId); e.preventDefault(); });
const up = () => {
  if (!M.level.down) return; M.level.down = false; btn.classList.remove('down');
  if (performance.now() - downAt < 250) { M.level.taps++; M.events.push('tap'); plog.innerHTML += '\\n[ ' + (0.5 + M.level.taps * 0.1).toFixed(3) + '] tap registered. <b>insufficient.</b>'; if (M.level.taps === 2) M.retype('A tap will not fix this. Commit. Hold it down and do not let go.'); }
};
btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up);
function setReboot(on) { $('frame').classList.toggle('rebooting', on); caption.innerHTML = on ? '·&nbsp;&nbsp;REBOOTING&nbsp;&nbsp;·' : '·&nbsp;&nbsp;EXAMINATION PAPER&nbsp;&nbsp;·'; if (!on) img.src = '../public/assets/Player/Player_Down.png'; }
function loop(ts) {
  const dt = last ? Math.min(50, ts - last) : 0; last = ts;
  if (!M.paused && !M.solved && !M.ended) {
    if (M.level.down) M.level.held += dt; else M.level.held = Math.max(0, M.level.held - dt * 2);
    const p = Math.min(1, M.level.held / HOLD_MS);
    $('fill').style.width = (p * 100) + '%'; $('pct').textContent = Math.round(p * 100) + '%';
    const rebooting = M.level.held > 120;
    if (rebooting !== $('frame').classList.contains('rebooting')) setReboot(rebooting);
    if (rebooting && M.level.down) { flick += dt; if (flick > 140) { flick = 0; img.src = '../public/assets/Player/Player_' + FACES[Math.floor(Math.random() * 4)] + '.png'; } }
    if (p >= 1) { setReboot(false); M.events.push('rebooted'); M.win('REBOOTED.', 'A tap does nothing. You had to commit and hold.'); }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
M.retype("█▒ The exam has crashed. ▒█ A tap won't fix this. Commit. Hold it down and don't let go.");
`,
};
