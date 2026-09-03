// Exercises the shared chrome: remarks typewriter, pause overlay, dark mode, wrong ×3 → game over.
module.exports = async (page, h) => {
  await h.eval(() => window.__mock.retype('Template check. The examiner is typing this line.'));
  await h.wait(1400);
  await h.shot('typed');

  // pause button sits at the right of the paper header: paper right edge ≈1165, header y≈147
  await h.click(1136, 147);
  await h.wait(200);
  let s = await h.state();
  h.assert(s.paused === true, 'pause overlay should show after clicking the pause button');
  await h.shot('paused');

  // DARK MODE button is the third in the right column of the overlay
  await h.eval(() => document.getElementById('darkBtn').click());
  await h.wait(200);
  s = await h.state();
  h.assert(s.dark === true, 'dark mode should toggle');
  await h.shot('paused-dark');

  await h.eval(() => document.getElementById('resumeBtn').click());
  await h.wait(200);
  s = await h.state();
  h.assert(s.paused === false, 'resume should hide the overlay');
  await h.shot('dark');

  await h.eval(() => window.__mock.toggleDark());
  await h.eval(() => window.__mock.wrong('First wrong.'));
  await h.wait(300);
  await h.shot('stamp');
  await h.eval(() => window.__mock.wrong('Second wrong.'));
  await h.eval(() => window.__mock.wrong('Third wrong.'));
  await h.wait(1200);
  s = await h.state();
  h.assert(s.lives === 0 && s.ended === true && s.gameover === true, 'three wrongs should end the exam: ' + JSON.stringify(s));
  await h.shot('gameover');
};
