// Apply examiner opening lines and cheat-overlay hints into the shared engine files.
// Usage: node mocks/_spec/apply-reports.js mocks/_spec/shared-edits.json
// JSON shape: { "29": { "lines": ["..."], "hints": ["..."] }, ... }
const fs = require('fs');
const path = require('path');
const edits = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8'));
const ROOT = path.resolve(__dirname, '..', '..', 'outside-the-box', 'final');
const ld = path.join(ROOT, 'levelData.ts');
const co = path.join(ROOT, 'overlays', 'CheatsOverlay.ts');
let levelData = fs.readFileSync(ld, 'utf8');
let cheats = fs.readFileSync(co, 'utf8');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
let nl = 0, nh = 0;
for (const [q, e] of Object.entries(edits)) {
  if (e.lines && e.lines.length) {
    const re = new RegExp(`  \\{ title: "Q${q}",[^\\n]*\\n`);
    if (!re.test(levelData)) throw new Error('levelData entry not found for Q' + q);
    levelData = levelData.replace(re, `  { title: "Q${q}", lines: [${e.lines.map(l => `"${esc(l)}"`).join(', ')}]${e.skippable === false ? ', skippable: false' : ''} },\n`);
    nl++;
  }
  if (e.hints && e.hints.length) {
    const re = new RegExp(`  ${q}: \\[[\\s\\S]*?\\n  \\],\\n`);
    const block = `  ${q}: [\n${e.hints.map(h => `    "${esc(h)}",`).join('\n')}\n  ],\n`;
    if (re.test(cheats)) cheats = cheats.replace(re, block);
    else {
      // single-line entry form: `  N: ["..."],`
      const re1 = new RegExp(`  ${q}: \\[[^\\n]*\\],\\n`);
      if (!re1.test(cheats)) throw new Error('cheat entry not found for ' + q);
      cheats = cheats.replace(re1, block);
    }
    nh++;
  }
}
fs.writeFileSync(ld, levelData);
fs.writeFileSync(co, cheats);
console.log('applied', nl, 'levelData entries and', nh, 'cheat blocks');
