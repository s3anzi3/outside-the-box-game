// Q50 Your Name: a wrong name costs a heart, the registered name reaches CORRECT, then the certificate renders per tier.
module.exports = async (page, h) => {
  await h.wait(400);
  await page.fill('#nameInput', 'Sean'); await page.press('#nameInput', 'Enter'); await h.wait(400);
  let s = await h.state(); h.assert(s.lives === 2, 'wrong name costs a heart');
  h.assert((await page.inputValue('#nameInput')) === '', 'field cleared after a wrong name');
  await h.shot('wrong');
  await page.fill('#nameInput', 'box'); await h.eval(() => document.getElementById('submitBtn').click()); await h.wait(700);
  h.assert(await h.has('#winfull'), 'CORRECT screen shown');
  await h.shot('correct');
  await h.eval(() => document.getElementById('viewCert').click()); await h.wait(500);
  h.assert(await h.has('#certwrap .cert'), 'certificate rendered');
  h.assert((await h.text('#certwrap .tier')).includes('GOLD'), 'gold tier by default');
  await h.shot('certificate-gold');
  await h.eval(() => document.querySelector('.tierbar button[data-t="bronze"]').click()); await h.wait(300);
  h.assert((await h.text('#certwrap .tier')).includes('BRONZE'), 'bronze preview');
  h.assert((await h.text('#certwrap .grade')).includes('33:51'), 'bronze time');
  await h.shot('certificate-bronze');
};
