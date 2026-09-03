// Q41 Reply: paper clicks are free and hint; empty Enter is rejected; typing into the remarks and pressing Enter wins.
module.exports = async (page, h) => {
  await h.wait(1200);
  for (let i = 0; i < 3; i++) { await h.click(640, 300); await h.wait(120); }
  await h.wait(300);
  let s = await h.state(); h.assert(s.lives === 3 && s.remarks.includes('cursor'), 'paper clicks are free and hint: ' + s.remarks);
  await h.key('Enter'); await h.wait(300);
  s = await h.state(); h.assert(!s.win && s.remarks.includes('Say something'), 'empty reply rejected');
  await h.click(640, 690); await h.wait(150);          // click the remarks
  await h.type('forty two'); await h.wait(200);
  s = await h.state(); h.assert(s.remarks.includes('forty two'), 'dictation appears in the remarks');
  await h.shot('dictating');
  await h.key('Enter'); await h.wait(2600);
  s = await h.state(); h.assert(s.win && s.lives === 3, 'Enter wins with no heart lost: ' + JSON.stringify(s));
  await h.shot('win');
};
