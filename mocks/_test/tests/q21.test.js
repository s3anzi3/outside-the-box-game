// Q21 Frodrick Rematch: music starts on the first key; a fair serve gets returned; holding his paddle freezes it; three points win.
const lvl = (h) => h.eval(() => { const L = window.__mock.level; return { you: L.you, frod: L.frod, rallying: L.rallying, frozen: L.frozen, aiY: L.aiY, music: L.music }; });
module.exports = async (page, h) => {
  await h.wait(400);
  let s = await h.state(); h.assert(s.remarks.trim().startsWith('he has returned') || s.remarks.length < 20, 'remark is the new short line: ' + s.remarks);
  h.assert(!(await h.has('#intro')), 'no intro popup');
  await h.click(400, 360);
  await h.eval(() => { window.__mock.test.serveAngle = 0.5; });
  await h.key(' '); await h.wait(2500);
  h.assert((await lvl(h)).music, 'music started on the first key');
  let ev = await h.events(); h.assert(ev.includes('frodrick:return'), 'Frodrick returns a fair serve');
  h.assert(ev.some(e => e.startsWith('play:pongBallBounce')), 'bounce sound plays');
  for (let i = 0; i < 80 && (await lvl(h)).rallying; i++) await h.wait(100);
  const fr = await h.eval(() => { const L = window.__mock.level; return { x: 118 + (0.975 - 0.009) * 1044, y: 171 + L.aiY * 381 }; });
  await h.down(fr.x, fr.y); await h.wait(150);
  h.assert((await lvl(h)).frozen, 'holding the paddle freezes it');
  await h.shot('frozen');
  for (let p = 0; p < 3; p++) { await h.key(' '); for (let i = 0; i < 80 && (await lvl(h)).rallying; i++) await h.wait(100); }
  await h.up(); await h.wait(1200);
  s = await h.state(); const L = await lvl(h);
  h.assert(s.win && L.you === 3, 'three points past the frozen paddle win: ' + JSON.stringify({ s, L }));
  await h.shot('win');
};
