// Assemble a mock from the template + a parts module.
// Usage: node mocks/_spec/inject.js mocks/_spec/parts/q29.js mocks/q29-self-assessment.html
// Parts module exports { title, h1, sub, q, css, html, js }
const fs = require('fs');
const path = require('path');
const [partsFile, outFile] = process.argv.slice(2);
if (!partsFile || !outFile) { console.error('usage: inject.js <parts.js> <out.html>'); process.exit(2); }
const P = require(path.resolve(partsFile));
let t = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const rep = (mark, add) => { if (!t.includes(mark)) throw new Error('marker missing: ' + mark); t = t.replace(mark, mark + '\n' + add); };
t = t.replace('<title>OtB · Q.NN Level Name Mock (current theme)</title>', `<title>${P.title}</title>`);
t = t.replace('<h1>Q.NN · Level Name · mock in the current theme</h1>', `<h1>${P.h1}</h1>`);
t = t.replace(/<p class="sub">[\s\S]*?<\/p>/, `<p class="sub">${P.sub}</p>`);
t = t.replace('<div class="qnum" id="qnum">Q.NN</div>', `<div class="qnum" id="qnum">Q.${P.q}</div>`);
rep('  /* ═══════════════ level-specific styles go below ═══════════════ */', P.css);
rep('      <!-- ═══ level content ═══ -->', P.html);
rep('/* ═══════════════ level ═══════════════ */', P.js);
t = t.replace("M.q = 0; M.next = 0; M.nextName = '';\n// M.retype(\"Examiner's opening remark from levelData.\");\n", '');
fs.writeFileSync(outFile, t);
console.log('wrote', outFile, t.length, 'bytes');
