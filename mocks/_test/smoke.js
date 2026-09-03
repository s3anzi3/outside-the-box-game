const { chromium } = require('C:/Users/panky/portfolio/node_modules/playwright');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('dialog', async d => { console.log('DIALOG:', d.message()); await d.dismiss(); });
  const file = path.resolve('mocks/q17-do-nothing.html');
  await page.goto(pathToFileURL(file).href);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'mocks/_test/smoke-q17-start.png' });
  await page.waitForTimeout(7500);
  const win = await page.$eval('#winscreen', el => el.classList.contains('show'));
  console.log('Q17 win screen shown after 7s wait:', win);
  await page.screenshot({ path: 'mocks/_test/smoke-q17-win.png' });
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
