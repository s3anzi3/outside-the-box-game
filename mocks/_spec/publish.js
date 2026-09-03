// Copy the playable mocks + review board into public/mocks/ for Firebase Hosting.
// Rewrites ../public/assets/ → ../assets/ (dist/ has assets at its root). Dev-only folders (_spec, _test) are skipped.
const fs = require('fs');
const path = require('path');
const SRC = path.resolve(__dirname, '..');
const OUT = path.resolve(__dirname, '..', '..', 'public', 'mocks');
const SKIP = new Set(['q13-count-again.html', 'q14-backwards-day.html', 'first-load.html', 'mainmenu.html']);   // rejected or internal

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, '_board'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'vendor'), { recursive: true });

let n = 0;
for (const f of fs.readdirSync(SRC)) {
  const p = path.join(SRC, f);
  if (fs.statSync(p).isDirectory() || SKIP.has(f)) continue;
  if (f.endsWith('.html')) {
    const html = fs.readFileSync(p, 'utf8').split('../public/assets/').join('../assets/');
    fs.writeFileSync(path.join(OUT, f), html); n++;
  } else if (f.endsWith('.js')) { fs.copyFileSync(p, path.join(OUT, f)); n++; }
}
fs.copyFileSync(path.join(SRC, '_board', 'manifest.js'), path.join(OUT, '_board', 'manifest.js'));
fs.copyFileSync(path.join(SRC, 'vendor', 'three-global.js'), path.join(OUT, 'vendor', 'three-global.js'));
console.log('published', n, 'files to', OUT);
