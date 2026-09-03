# OTB mock build spec (read fully before building a mock)

You are building ONE standalone HTML mock of a level of "Outside-the-Box Thinking Certification" so the owner can play it in his browser from disk (file://) and approve or reject it. The owner judges on rendered pixels and on whether the trick is delightful. Read `CONTEXT.md` in this folder for the game, the owner's taste rules and the level roster.

## Files
- Start from `mocks/_spec/template.html`. COPY it to `mocks/qNN-slug.html` and fill in the level. Do not restyle the shared chrome (frame, logo, paper, header band, examiner panel, hearts, stamp, pause overlay, buttons). Add level-specific CSS below the marker comment and level HTML inside `#play`.
- Assets are referenced relative to `mocks/`: `../public/assets/Logo.png`, `../public/assets/Player/Player_Down.png` (also `_Up`, `_Left`, `_Right`), `../public/assets/beggar.png`, `../public/assets/heart.png`. No other external resources; no CDNs; everything inline. (`mocks/vendor/three-global.js` exists if a level truly needs three.js: `<script src="vendor/three-global.js"></script>` defines global `THREE`.)
- The page header (`<h1>` and `<p class="sub">`) is for the owner: title it `Q.NN · Level Name · <FAITHFUL PORT | TWIST | NEW CONCEPT>` and write ONE honest paragraph: what the player sees, the trap, the lateral solution, what is faithful to the real build vs new, and any known caveats. This paragraph is the pitch; make it good and truthful.

## Runtime contract (the template's `window.__mock`, alias `M`)
- `M.q`, `M.next`, `M.nextName` set the question number and where CONTINUE goes.
- `M.retype(text)` types into EXAMINER'S REMARKS (typewriter, cancels the previous). Call it once on load with the level's opening remark, and use it for the hint ladder / reactions.
- `M.wrong(optionalRemark)` = INCORRECT stamp + lose a heart (+ optional examiner line). Returns false if already solved/ended. Three hearts lost → Proctor Notice game over (handled).
- `M.win(title, body)` = CORRECT stamp, then the win screen with CONTINUE (which toasts the next question). Titles are short and all caps with a period ("STILLNESS.", "YOU CHEATED."). Body is one or two dry sentences.
- `M.slam(text, ok)` for custom stamps if a level needs one.
- `M.pause()/M.resume()`, `M.toggleDark()`; hooks `M.onPause`, `M.onResume`, `M.onDark(isDark)`. `M.paused` / `M.dark` are readable. Any level with a timer or animation loop MUST freeze while `M.paused`.
- `M.toast(text)` for mock-only notes. NEVER use `alert()`/`confirm()`/`prompt()` (the review board embeds mocks in iframes; dialogs there are a failure).
- `M.events` accumulates strings ('stamp:INCORRECT', 'life:2', 'win', 'pause', 'remark:…'); tests read them.
- Expose any extra level state tests need on `M` (e.g. `M.level = { phase, count }`).

## Geometry (frame units, 1280×860; the frame scales with the page but tests use these)
- Paper: x 115–1165, y 122–555. Header band y 122–171 (Q label at left, pause button centred at about (1136,147)). Play area: x 118–1162, y 171–552.
- Bottom panel: x 115–1165, y 587–759. Examiner sprite centred near (188, 665). Remarks text from x≈305. Hearts centred near x≈1090, y≈690.
- Logo: centred, x 575–705, y 13–143 (the PNG is square, rendered 130 px); the lightbulb in the logo is small, roughly x 637–663, y 19–49 (centre 650, 36).

## Design rules
- Deadpan institutional voice. Short sentences. NO em dashes (—) anywhere in copy; use periods, commas, colons.
- Wrong answers must be honest traps: the conventional response costs a heart, and the examiner's remarks should escalate as a hint ladder so a real player can find the solution in a couple of minutes without a walkthrough. Never a solution that requires a walkthrough or luck. Don't cost hearts for merely exploring (hovering, dragging around, right-clicking, pausing).
- Coloured things use the fountain-pen ink palette: red #C03A2E, blue #2E6BA8, green #3F8F55, yellow #D8A81F.
- Buttons use the `.btn` class (locked embossed style). Big prompts use `.prompt` (serif) and `.directive` (mono). Keep the airy full-window proportions; do not cram.
- Dark mode must not break the level: use the CSS variables, and check the level in `--dark` at least once if it draws colours.
- Faithful ports: keep the real level's numbers (timers, HP, speeds, sequences, copy) unless the roster says otherwise; restyle only to the theme. Read the real source in `outside-the-box/final/levels/LevelNN.ts` first.
- Cheats/tests: expose enough on `M` to let a Playwright test play the level to a win without hacks that a player couldn't perform (tests simulate real input: clicks, drags, keys). Deterministic behaviour is preferred; if the level uses randomness, allow `M.seed` or expose the chosen value on `M` so the test can read it. Test-only shortcuts are allowed ONLY under `M.test.*` (e.g. `M.test.setBossHP(5)` to shorten a long fight) and the primary mechanic must still be exercised with real input in the test.
- Keyboard: the mock is embedded in an iframe on the review board; attach key listeners on `document`/`window` (not on a focused element) and call `preventDefault()` for Space/arrows so the page never scrolls. Mouse: use pointer events with `setPointerCapture` for drags so dragging works when the pointer leaves the element.
- Never navigate away or reload except the TRY AGAIN button on game over.

## Verification (mandatory before you report done)
Write `mocks/_test/tests/qNN.test.js` exporting `async (page, h) => {}` that plays the level like a real player: (1) the conventional trap costs a heart and slams INCORRECT, (2) the lateral solution reaches the win screen, (3) pause freezes any timer, (4) no page errors, no failed asset loads, no dialogs. Run:

    node mocks/_test/harness.js mocks/qNN-slug.html mocks/_test/tests/qNN.test.js

It prints JSON with `pass`, `pageErrors`, `consoleErrors`, `failedRequests` and writes screenshots to `mocks/_test/out/qNN-slug-*.png`. LOOK at the screenshots (Read the PNGs) and fix anything that looks wrong: overflow, overlapping chrome, unreadable text, broken layout in dark mode. Iterate until the test passes and the screenshots look right. Helpers on `h`: `click(x,y)`, `rclick`, `dblclick`, `down/move/up`, `drag(x0,y0,x1,y1,steps)`, `key`, `keyDown/keyUp`, `type`, `wait(ms)`, `shot(name)`, `state()`, `events()`, `eval(fn)`, `assert(cond,msg)`, `text(sel)`, `has(sel)`; `--dark` flag starts the mock in dark mode.
