module.exports = {
  q: 23,
  title: 'OtB · Q.23 Truth Table Mock (current theme)',
  h1: 'Q.23 · Truth Table · FAITHFUL PORT',
  sub: `Fully playable. Faithful to Level23.ts: CASE FILE #7, the vault security protocol (P → Q) ∧ (Q → P), a five-column truth table whose twelve open cells cycle blank, T, F on click, and four conclusion buttons. "Satisfied when both conditions match" is the right conclusion, but as in the real build it only passes when the table is also fully correct (T T T / F T F / T F F / T T T); the mock adds a soft nudge instead of silence when the table disagrees: "Your table disagrees with you. Fix one of you." Wrong conclusions slam INCORRECT and cost a heart. Kept as a calm Corporate joke level. Quirks: the paper's caption reads CONFIDENTIAL, a gold CORPORATE APPROVED seal sits on the case file, the win stamp reads CASE CLOSED, and after 45 idle seconds the examiner notes that Corporate bills by the hour.`,
  css: `
  .q23head{position:absolute; left:0; right:0; top:3%; text-align:center; font-family:var(--display); font-weight:bold; font-size:15px; color:var(--ink);}
  .q23def{position:absolute; left:0; right:0; top:10%; text-align:center; font-family:var(--body); font-size:12px; color:var(--fgMid);}
  .q23rule{position:absolute; left:0; right:0; top:16%; text-align:center; font-family:var(--body); font-weight:bold; font-size:12px; color:var(--fgDim);}
  .tt{position:absolute; left:12%; width:76%; top:22%; border-collapse:collapse; table-layout:fixed; font-family:var(--body);}
  .tt th, .tt td{height:37px; text-align:center; border:1px solid var(--hairline); font-size:13px;}
  .tt th{font-weight:bold; color:var(--fgMid); background:var(--bg);}
  .tt th.fixed{color:var(--fgDim);}
  .tt td.fixed{font-weight:bold; font-size:15px; color:var(--fgDim);}
  .tt td.cell{cursor:pointer; font-family:var(--display); font-weight:bold; font-size:17px; color:var(--fgDim);}
  .tt td.cell:hover{background:rgba(0,0,0,.05);}
  .frame.dark .tt td.cell:hover{background:rgba(255,255,255,.07);}
  .tt td.cell.T{color:var(--pass);} .tt td.cell.F{color:var(--danger);}
  .tt{border:2px solid var(--stroke);}
  .tt .sep{border-left:1.5px solid var(--stroke);}
  .q23note{position:absolute; left:0; right:0; top:73%; text-align:center; font-family:var(--body); font-size:10px; color:var(--fgDim);}
  .q23opts{position:absolute; left:50%; top:79%; transform:translateX(-50%); display:grid; grid-template-columns:repeat(2, 460px); gap:7px 31px;}
  .q23opts .btn{height:34px; font-family:var(--body); font-size:13px; font-weight:bold; padding:0;}
  .approved{position:absolute; right:26px; top:14px; width:80px; height:80px; transform:rotate(9deg); opacity:.9;}
`,
  html: `
      <div class="q23head">CASE FILE #7. VAULT SECURITY PROTOCOL</div>
      <svg class="approved" viewBox="0 0 80 80"><circle cx="40" cy="40" r="37" fill="none" stroke="#B0892F" stroke-width="2.2" stroke-dasharray="3.5 2"/><circle cx="40" cy="40" r="30" fill="rgba(176,137,47,.10)" stroke="#B0892F" stroke-width="1"/><text x="40" y="37" text-anchor="middle" font-family="Courier New,monospace" font-size="8" font-weight="bold" fill="#B0892F" letter-spacing="1">CORPORATE</text><text x="40" y="49" text-anchor="middle" font-family="Courier New,monospace" font-size="8" font-weight="bold" fill="#B0892F" letter-spacing="1">APPROVED</text></svg>
      <div class="q23def">The vault has two conditions: &nbsp; P: the vault is sealed. &nbsp; Q: the guard is on duty.</div>
      <div class="q23rule">Security passes when: &nbsp; (P → Q) &nbsp;∧&nbsp; (Q → P)</div>
      <table class="tt" id="tt"></table>
      <div class="q23note">Click cells to cycle T / F / blank</div>
      <div class="q23opts" id="opts"></div>
`,
  js: `
M.q = 23; M.next = 24; M.nextName = 'Easy One';
const P = ['T', 'T', 'F', 'F'], Q = ['T', 'F', 'T', 'F'];
const ANSWER = [['T', 'T', 'T'], ['F', 'T', 'F'], ['T', 'F', 'F'], ['T', 'T', 'T']];
M.level = { cells: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']], idle: 0 };
$('caption').innerHTML = '·&nbsp;&nbsp;CONFIDENTIAL&nbsp;&nbsp;·';
const tt = $('tt');
tt.innerHTML = '<tr><th class="fixed">P</th><th class="fixed">Q</th><th class="sep">P → Q</th><th>Q → P</th><th>Result</th></tr>' +
  [0, 1, 2, 3].map(r => '<tr><td class="fixed">' + P[r] + '</td><td class="fixed">' + Q[r] + '</td>' + [0, 1, 2].map(i => '<td class="cell' + (i === 0 ? ' sep' : '') + '" id="c' + r + i + '" data-r="' + r + '" data-i="' + i + '">—</td>').join('') + '</tr>').join('');
tt.addEventListener('click', (e) => {
  const td = e.target.closest('td.cell'); if (!td || M.solved || M.ended || M.paused) return;
  const r = +td.dataset.r, i = +td.dataset.i; const cur = M.level.cells[r][i];
  const nxt = cur === '' ? 'T' : cur === 'T' ? 'F' : '';
  M.level.cells[r][i] = nxt; td.textContent = nxt || '—'; td.className = 'cell' + (i === 0 ? ' sep' : '') + (nxt ? ' ' + nxt : '');
  M.level.idle = 0;
});
const tableOK = () => M.level.cells.every((row, r) => row.every((v, i) => v === ANSWER[r][i]));
const OPTS = [['Protocol is always satisfied', false], ['Satisfied only when the vault is sealed', false], ['Satisfied when both conditions match', true], ['Protocol is never satisfied', false]];
OPTS.forEach(([text, right], k) => {
  const b = document.createElement('button'); b.className = 'btn'; b.textContent = text; b.id = 'opt' + k;
  b.onclick = () => {
    if (M.solved || M.ended || M.paused) return;
    if (!right) return M.wrong('Read the table you filled in. Then read it again.');
    if (!tableOK()) { M.events.push('disagree'); M.retype('Your table disagrees with you. Fix one of you.'); return; }
    M.win('CASE CLOSED.', 'The vault is secure when both conditions match. (P → Q) ∧ (Q → P) is just P ↔ Q.', 'CASE CLOSED');
  };
  $('opts').appendChild(b);
});
M.retype('Corporate wanted a question that tested your logic in math form. I hope you remember how to fill out a truth table...');
setInterval(() => { if (M.paused || M.solved || M.ended) return; M.level.idle += 0.5; if (M.level.idle >= 45 && !M.level.billed) { M.level.billed = true; M.retype('Take your time. Corporate bills by the hour.'); } }, 500);
`,
};
