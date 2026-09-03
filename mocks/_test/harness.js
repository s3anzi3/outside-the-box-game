// OTB mock test harness.
// Usage: node mocks/_test/harness.js <mock.html> [test.js] [--keep-open-ms=N] [--dark]
// The test file exports: module.exports = async (page, h) => { ... }  (throw to fail)
// h helpers: frame(x,y) → page coords for a frame-relative point (frame is 1280x860),
//            click(x,y,opts), rclick(x,y), dblclick(x,y), down(x,y), move(x,y,steps), up(),
//            drag(x0,y0,x1,y1,steps), key(k), type(text), wait(ms), shot(name), state(), events(),
//            assert(cond,msg), text(selector), has(selector)
const { chromium } = require('C:/Users/panky/portfolio/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v];
}));
const mockFile = args[0];
const testFile = args[1];
if (!mockFile) { console.error('usage: node harness.js <mock.html> [test.js]'); process.exit(2); }

const outDir = path.resolve(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });
const base = path.basename(mockFile, '.html');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('dialog', async d => { consoleErrors.push('DIALOG(alert) used: ' + d.message()); await d.dismiss(); });

  const failedRequests = [];
  page.on('requestfailed', r => failedRequests.push(r.url()));

  await page.goto(pathToFileURL(path.resolve(mockFile)).href);
  await page.waitForTimeout(400);

  const fbox = await page.$eval('.frame', el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const sx = fbox.w / 1280, sy = fbox.h / 860;
  const frame = (x, y) => ({ x: fbox.x + x * sx, y: fbox.y + y * sy });

  let shotN = 0;
  const h = {
    fbox, frame,
    shot: async (name) => { const p = path.join(outDir, `${base}-${String(++shotN).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: p }); return p; },
    click: async (x, y, opts = {}) => { const p = frame(x, y); await page.mouse.click(p.x, p.y, opts); },
    rclick: async (x, y) => { const p = frame(x, y); await page.mouse.click(p.x, p.y, { button: 'right' }); },
    dblclick: async (x, y) => { const p = frame(x, y); await page.mouse.dblclick(p.x, p.y); },
    down: async (x, y, opts = {}) => { const p = frame(x, y); await page.mouse.move(p.x, p.y); await page.mouse.down(opts); },
    move: async (x, y, steps = 12) => { const p = frame(x, y); await page.mouse.move(p.x, p.y, { steps }); },
    up: async (opts = {}) => { await page.mouse.up(opts); },
    drag: async (x0, y0, x1, y1, steps = 20) => {
      const a = frame(x0, y0), b = frame(x1, y1);
      await page.mouse.move(a.x, a.y); await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps }); await page.mouse.up();
    },
    key: async (k) => { await page.keyboard.press(k); },
    keyDown: async (k) => { await page.keyboard.down(k); },
    keyUp: async (k) => { await page.keyboard.up(k); },
    type: async (t) => { await page.keyboard.type(t); },
    wait: async (ms) => { await page.waitForTimeout(ms); },
    state: async () => page.evaluate(() => {
      const M = window.__mock || {};
      return { lives: M.lives, solved: M.solved, ended: M.ended, paused: M.paused, dark: M.dark,
        win: !!document.querySelector('#winscreen.show'), gameover: !!document.querySelector('#gameover.show'),
        remarks: (document.getElementById('remarks') || {}).textContent || '' };
    }),
    events: async () => page.evaluate(() => (window.__mock || {}).events || []),
    text: async (sel) => page.$eval(sel, el => el.textContent),
    has: async (sel) => !!(await page.$(sel)),
    eval: async (fn, arg) => page.evaluate(fn, arg),
    assert: (cond, msg) => { if (!cond) throw new Error('ASSERT: ' + msg); },
    page,
  };

  if (flags.dark) { await page.evaluate(() => window.__mock && window.__mock.toggleDark()); await page.waitForTimeout(100); }

  const result = { mock: mockFile, test: testFile || null, pass: true, error: null, pageErrors, consoleErrors, failedRequests };
  await h.shot('start');
  try {
    if (testFile) {
      const fn = require(path.resolve(testFile));
      await fn(page, h);
    }
  } catch (e) {
    result.pass = false; result.error = e.stack || String(e);
  }
  await h.shot('end');
  if (flags['keep-open-ms']) await page.waitForTimeout(Number(flags['keep-open-ms']));
  await browser.close();

  if (pageErrors.length) result.pass = false;
  // Missing assets are a failure (the mock would show broken images).
  if (failedRequests.length) result.pass = false;
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.pass ? 0 : 1);
})().catch(e => { console.error('HARNESS FAIL', e); process.exit(1); });
