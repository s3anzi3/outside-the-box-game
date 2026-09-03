# Per-level briefs for the Q21–Q50 mocks

Each brief names the output file, the tag for the page header, what to port faithfully, what is new, and the copy. Always read the real source `outside-the-box/final/levels/LevelNN.ts` before building a FAITHFUL PORT and keep its numbers unless the brief overrides them. All copy: no em dashes.

---
## Q21 · Frodrick Rematch · FAITHFUL PORT · `q21-frodrick-rematch.html` · next Q22 (Did You Catch That)
Source: Level21.ts plus the level-21 intro popup in `screens/Level.ts` (search "level21IntroSeen").
1. On load show the intro popup as a document box inside the paper: examiner sprite at left with "EXAMINER" label, "EXAMINER'S REMARKS" eyebrow, lines "Good job not killing me... I guess." and "Back to your regularly scheduled exam. Try not to mess this up.", a CONTINUE button. Dismissing it reveals the pong court.
2. Pong in the play area: dashed centre line, scores YOU / Frodrick, player paddle at left (W/S or arrows, PLAYER_H 0.18 of court, speed 1.1), Frodrick's paddle at right absurdly long (0.46 of court) with perfect tracking (FRODRICK_SPEED 4.8), ball radius 0.013, SPEED_INIT 0.48, max 0.95, +5% per paddle hit, deflection by hit offset. SPACE serves toward Frodrick. First to 3. If Frodrick reaches 3: INCORRECT stamp, lose a heart, reset scores.
3. THE TRICK (faithful): holding the LEFT MOUSE BUTTON down on Frodrick's paddle freezes it (turns fountain-pen red #C03A2E while frozen). Cursor becomes a pointer over it. While frozen you can score.
4. Remarks: opening "He is back. Frodrick seems to have trained a lot... maybe this time you need to cheat on the exam for once???". First time the paddle is frozen: "...I saw nothing." First point scored: "Frodrick is filing a complaint. It will be ignored."
5. Win: "YOU CHEATED!" / "Frodrick never saw it coming. 3 to N." Pause freezes physics. Prevent SPACE/arrow page scroll.

## Q22 · Did You Catch That · FAITHFUL PORT · `q22-did-you-catch-that.html` · next Q23 (Truth Table)
Source: Level22.ts.
1. Waiting phase: the paper shows only "Stay alert." in dim text. Wait is random 3 to 8 s (expose `M.level.waitMs`; accept `?wait=1000` in the URL for tests).
2. Flash phase: a 10-digit number in 80px serif across the play area with a gold "MEMORISE NOW" label and a soft pulsing tint, for 0.75 s only.
3. Input phase: "Enter the sequence you saw:" with 10 slots, typed via the keyboard (digits, Backspace, Enter) and a SUBMIT button when full. Wrong → INCORRECT, heart, a NEW number, back to waiting.
4. THE TRICK (faithful): the pause button freezes the flash timer. While paused, the digits MUST stay readable: render the digit row on a layer above the pause overlay with a small mono tag "SUSPENDED MID-FLASH". Resume continues the 0.75 s.
5. Remarks: opening "did you catch that??". After the first miss: "Fast, wasn't it. If only there were a way to stop time." After the second: "The pause button is right there, candidate. I am not supposed to say that."
6. Win: "CORRECT!" / "Sharp eyes. Or a quick thumb on the pause button. I do not judge."

## Q23 · Truth Table · FAITHFUL PORT (calm) · `q23-truth-table.html` · next Q24 (Easy One)
Source: Level23.ts. Case file header "CASE FILE #7. VAULT SECURITY PROTOCOL", the P/Q definitions, the rule (P → Q) ∧ (Q → P), the 5-column table with the 12 fillable cells cycling T / F / blank on click (T in pass green, F in danger red), instruction "Click cells to cycle T / F / blank", and the four conclusion buttons. Correct answer "Satisfied when both conditions match" wins ONLY when the table is fully correct (T,T,T / F,T,F / T,F,F / T,T,T); if the table is wrong when that option is clicked, no heart: the examiner says "Your table disagrees with you. Fix one of you." Wrong conclusions cost a heart.
Quirk: a small gold "CORPORATE APPROVED" seal on the case file. Remarks: opening "Corporate wanted a question that tested your logic in math form. I hope you remember how to fill out a truth table..." After 45 s without a win: "Take your time. Corporate bills by the hour." Win: "CASE CLOSED." / "The vault is secure when both conditions match. (P → Q) ∧ (Q → P) is just P ↔ Q."

## Q24 · Easy One · FAITHFUL PORT · `q24-easy-one.html` · next Q25 (Lights Maze)
Source: Level24.ts. "15 + 15 = ?" in 68px serif at 30% height, the ten decoy buttons at the exact fractional positions from DECOYS (HINT, CALCULATE, EASY MODE ON, SHOW STEPS, SKIP →, CONFIRM, CHECK ANSWER, USE CALCULATOR, SUBMIT ALL, SOLVE) all costing a heart, and the four answers 25 / 30 / 35 / 1515 (30 wins). Remarks: opening "This should be an easy one..."; after any decoy: "It IS an easy one. You are the one making it hard." Win: "CORRECT." / "15 + 15 = 30. Well done. Every other button on that page was a lie."

## Q25 · Lights Maze · FAITHFUL PORT · `q25-lights-maze.html` · next Q26 (The Cookie)
Source: Level25.ts. Port the maze generator EXACTLY (xorshift32 seed 0xC0FFEE42, 11×8 rooms → 23×17 grid, iterative DFS with neighbour order up/down/left/right, start bottom-centre room, exit opening at the top centre, bottom sealed, three gates at 25/50/75% of the BFS solution path with types [2,3,2]). Type 1 walls always solid; type 2 solid and visible only in DARK mode; type 3 only in LIGHT mode. The mock starts in light mode (the real game uses whatever mode the player is in).
Movement: WASD/arrows, 7.5 cells per second, diagonal normalised; a wall hit plays "oof" (visual shake) and sets the dot back 90 frames along its position history. 80 s timer bar at the bottom of the play area; timeout costs a heart and resets the timer. The pause overlay freezes the timer and movement.
THE TRICK (faithful): toggle DARK MODE / LIGHT MODE in the pause overlay to change which gates are solid. After the first toggle, a small "◐ TOGGLE" button appears at the top-right of the maze so later toggles are quick. Theme restyle like `mocks/q10-the-maze.html`: ink walls, oxblood dot, pass-green pulsing exit, dim entry arrow.
Remarks: opening "Some walls are only visible under the right conditions. Toggle your perspective to navigate." First wall hit on a gate: "That wall is only there in this light." Win: "THROUGH." / "Three of those walls only ever existed in one of the two rooms."
Test: expose `M.level.grid`, `M.level.pos`, `M.level.solutionPath` (BFS through the type-0 cells) and gate positions; the test drives the dot with key presses along the path and toggles mode at each gate via the pause overlay's button, proving the maze is solvable.

## Q26 · The Cookie · FAITHFUL PORT + quirks · `q26-the-cookie.html` · next Q27 (Keys But No Locks)
Source: Level26.ts. "Click the cookie 100 times." A drawn cookie (body #c98a44, edge #5e3a13, eight chips #3d220b), squish on click, counter "N / 100", progress bar. NO trick: every click counts and 100 wins.
Quirks: every ten clicks a bite disappears from the cookie's edge (crescents) and crumbs accumulate on the paper below it; the remarks change at 1 "One.", 25 "Twenty-five. Corporate calls this 'engagement'.", 50 "Halfway. Your wrist is under observation.", 75 "Seventy-five. There is no trick. I checked.", 99 "Ninety-nine. ...Go on." Win: "ONE HUNDRED." / "There was no trick. Sometimes the exam is just a cookie."

## Q27 · Keys But No Locks · FAITHFUL PORT · `q27-keys-no-locks.html` · next Q28 (FRODRICK.EXE)
Source: Level27.ts. Italic riddle lines ("I have keys but no locks." / "I have space but no rooms." / "You can enter but cannot go inside." / "What am I?"), four decoy buttons HOUSE / MAP / PIANO / KEYBOARD that all cost a heart. THE TRICK (faithful): type K-E-Y-B-O-A-R-D on the physical keyboard (rolling buffer of the last 8 letters); typed letters appear faintly at the bottom of the paper.
Remarks: opening "A riddle to test your wits. The answer is the means by which you give it." Clicking the KEYBOARD button: "Yes. That is the word. That is not how you say it." After a second failure: "The answer is not on the paper, candidate. It is under your hands." Win: "KEYBOARD." / "You did not click it. You typed it. That was the whole question."

## Q28 · FRODRICK.EXE · FAITHFUL PORT · `q28-frodrick-exe.html` · next Q29
Source: Level28.ts. Port the shooter with the same tunables (player 40×26 at speed 380, bullets 720 with 0.22 s cooldown and 5 damage, i-frames 0.42 s; boss 150×90, HP 110, phases at HP > 75 / > 40 / else with bullet speeds 275/360/440, fire intervals 1.0/0.75/0.55, sweep 0.45/0.72/1.10 Hz; phase 0 single shot, 1 triple, 2 five-way fan; brief white flash on phase change). A/D or arrows move, SPACE fires (hold to autofire). Boss bullet hits cost a heart. The paper becomes the arena: tint the play area like the source (#f0e8f0 light / #0a0010 dark) and glitch the paper header (scanlines, the Q number jitters). Boss drawn as the glitchy monitor with green eyes and jagged mouth, name tag FRODRICK.EXE, HP bar at the top.
Remarks: opening "WARNING: exam guide integrity check failed. FRODRICK.EXE has gone hostile. Defend yourself." Phase 2: "He is not calming down." Win: "TERMINATED." / "FRODRICK.EXE has been removed from the examination. Again." Pause freezes the loop. Test hooks: `M.test.setBossHP(n)` is allowed to shorten the fight, but the test must also prove real hits reduce HP and that a boss bullet costs a heart.

## Q30 · Checkpoint · FAITHFUL PORT (calm) · `q30-checkpoint.html` · next Q31
Source: Level30.ts. A gold "HALFWAY" seal on the paper. Question: "Back at Question 16, I told you which one to pick. Which was it?" Four colour buttons filled with the ink palette (RED #C03A2E, BLUE #2E6BA8, GREEN #3F8F55, YELLOW #D8A81F). BLUE wins. Remarks: opening "Checkpoint. Past the halfway mark of your certification. Quick: were you actually listening to me earlier?" After a wrong pick: "I told you. Between us. The system was glitching." Win: "YOU REMEMBERED." / "Halfway there. Twenty-five questions left, and they get stranger."

## Q32 · Dial to Eleven · FAITHFUL PORT · `q32-dial-to-eleven.html` · next Q33
Source: Level32.ts (read it for the exact geometry and rule). A dial/knob on a track labelled 0 to 10 with "MAX 10" printed on it; the track secretly runs one notch further. Drag the knob; stopping at 10 and releasing costs a heart ("All the way up, candidate."), dragging past the printed end to 11 wins. Quirk: at 11 the knob glows gold and a tiny caption "these go to eleven" fades in. Remarks: opening "Turn the dial all the way up. ...and remember, 'all the way' is rarely where the label stops." Win: "ELEVEN." / "The label said 10. 'All the way up' was always one notch further."

## Q36 · Recommended · FAITHFUL PORT · `q36-recommended.html` · next Q37
Source: Level36.ts. "7 × 8 = ?" with four options; 54 is pre-selected with a gold "RECOMMENDED BY CORPORATE" tag; a CONFIRM SELECTION button. Confirming 54 costs a heart. Select 56 (options: 54, 56, 48, 63) then confirm to win. Remarks: opening "The exam has pre-selected an answer for you. Do not trust it. It's lying, candidate. Pick what you KNOW is right." After a failure: "Corporate has never once multiplied anything." Win: "OVERRIDDEN." / "The exam recommended 54. You knew better: 7 × 8 = 56."

## Q40 · Hold to Reboot · FAITHFUL PORT · `q40-hold-to-reboot.html` · next Q41
Source: Level40.ts (read for the hold duration). The paper shows a crash in mono: "█▒ THE EXAM HAS CRASHED ▒█" and a short fake panic log with jokes ("FRODRICK.EXE: not found (good)", "candidate.patience: unverified", "corporate.approval: pending since 1987"). A button HOLD TO REBOOT with a progress bar: a tap does nothing except a log line "tap registered. insufficient."; press and HOLD for the source's duration (about 2 s) to fill the bar; releasing early drains it. Remarks: opening "█▒ The exam has crashed. ▒█ A tap won't fix this. Commit. Hold it down and don't let go." Win: "REBOOTED." / "A tap does nothing. You had to commit and hold."

## Q45 · Runaway Submit · FAITHFUL PORT + quirk · `q45-runaway-submit.html` · next Q46
Source: Level45.ts (read for flee radius and speed). A SUBMIT button flees the cursor inside the paper. The trick: herd it into a corner where it cannot escape, then click. Quirk: once cornered (no escape direction) its label changes to "OK OK FINE". Remarks: opening "Just press submit and we can move on. ...it seems the button has other ideas. Back it into a corner." After 20 s: "Stop chasing it. Think like a sheepdog." Win: "CAUGHT." / "You stopped chasing and started cornering. That is the whole trick."

## Q46 · Recall · FAITHFUL PORT (calm) · `q46-recall.html` · next Q47
Source: Level46.ts. "Cast your mind back to Question 11. The loading bar that refused to finish. How did you beat it?" Options: WAITED IT OUT / PRESSED RETRY / DRAGGED IT / REFRESHED THE PAGE. DRAGGED IT wins. Quirk: a small frozen "99%" loading bar drawn in the corner of the paper as a memento. Remarks: opening as in levelData Q46. Win: "YOU DRAGGED IT." / "The loading bar was never going to finish on its own. You did."

## Q48 · The Cheat · FAITHFUL PORT · `q48-the-cheat.html` · next Q49
Source: Level48.ts (read for the exact question text). An impossible question with YES / NO / MAYBE / 42, all costing a heart. A dark red flickering "⛔ CHEAT" button in the bottom-right corner of the paper (same treatment as Q20's OVERRIDE in `mocks/q20-system-breach.html`) wins; it must stay clickable during its off frames. Remarks: opening "There is no fair answer to this one. None. You know what to do. Do the thing they told you never to do." Win: "YOU CHEATED." / "There was never a fair answer. The exam taught you to stop playing fair."

## Q49 · The Lock · FAITHFUL PORT · `q49-the-lock.html` · next Q50
Source: Level49.ts. Three tumbler dials 0 to 9 with up/down arrows (also mouse wheel over a dial), labels under them naming the source questions (read the source for the exact labels), and SUBMIT. Code 6 · 1 · 2. Wrong code costs a heart with a "clunk". Remarks: opening "One lock before the end. Every digit is an answer you already gave. You have everything you need. Set the code." Win: "UNLOCKED." / "6 · 1 · 2. Every digit something you already knew. One question left." Header note for the owner: Q42's replacement keeps the middle digit at 1 for a first-try player.

## Q50 · Your Name · FAITHFUL PORT · `q50-your-name.html` · finale
Source: Level50.ts. Three screens. (1) In the paper: "FINAL ITEM · 50 OF 50", "One last question, candidate.", "What is your name?", a text input and SUBMIT. The registered name for the mock is "Box" (`M.level.registeredName`), stated in the page header (in the real game it is whatever was typed at Q1). Wrong → heart, input cleared. (2) Full-frame CORRECT screen (no paper, no HUD): "CORRECT." / "That is right. You are Box." / "Examination complete. Your certificate awaits." / VIEW CERTIFICATE →. (3) The certificate, full frame with a dim backdrop: paper card, tier-coloured double border with corner diamonds, faint seal watermark, date and serial "No. OTB-50-NNNN", eyebrow INSTITUTE OF LATERAL COGNITION, a spinning gold medallion (CSS 3D coin), "✦ GOLD TIER ✦", title, "This is to certify that", the name, body lines, divider, "ELITE COMPLETION · 17:42", footnote, two signature scribbles with CHIEF EXAMINER / REGISTRAR, MAIN MENU button. Port the three tiers' text from the source; add mock-only tier preview buttons ABOVE the frame (outside it) so the owner can view GOLD / SILVER / BRONZE.

---
# Quirk addendum for the kept levels (cheap, do not change mechanics)
- Q21: while Frodrick's paddle is held frozen, the examiner sprite turns RIGHT (Player_Right.png) and the hearts label reads "CANDIDATE STANDING · UNSUPERVISED"; both revert on release.
- Q22: if the player pauses while the number is flashing, the pause box cartouche reads "EXAMINATION SUSPENDED (CONVENIENT)" and, on resume, the remark becomes "did you catch that?? You paused. I saw."
- Q23: the paper's caption cartouche reads "· CONFIDENTIAL ·" on this level; the win stamp text is "CASE CLOSED" in green (use M.slam('CASE CLOSED', true) then the win screen).
- Q24: each decoy, once clicked, gets a small pencil tick and the word TRIED in its corner and stays that way; after the third decoy: "Corporate added those buttons. I add nothing."
- Q25: every mode toggle turns the sprite UP for 400 ms (reaching for the switch) then back DOWN; in dark mode the caption under the sprite reads "EXAMINER (UNLIT)".
- Q26: at click 99 the hearts label briefly reads "CANDIDATE CHEWING"; the win stamp reads "CONSUMED" in green.
- Q27: when the first keyboard letter is typed the sprite turns UP (his back to you) and the caret blinks twice as fast; on win the remark is "I heard the keys. Everyone hears the keys."
- Q28: at one heart the hearts label reads "CANDIDATE STANDING (BARELY)"; boss phase colours use the ink palette (green #3F8F55, yellow #D8A81F, red #C03A2E).
- Q30: the typewriter starts "The answer is BLU", visibly backspaces three characters, then continues "Were you listening? Corporate says I am not allowed to say it twice."
- Q32: at 11 the printed "MAX 10" re-letters to "MAX 11 (revised)" with the 10 struck through; remark "I will update the label."
- Q36: when 56 is selected the RECOMMENDED tag slides from 54 to 56 and gains "(revised)"; remark "It was always 56. The tag is decorative."
- Q40: during the hold the whole chrome reboots with the exam: the logo dims, the hearts go hollow, the cartouche reads "· REBOOTING ·", the sprite flickers between facings; all restore on completion.
- Q45: the sprite turns LEFT/RIGHT to follow the fleeing button and the remark keeps a running count "Escapes: 7."
- Q46: hovering DRAGGED IT shows the grab cursor; the win screen shows a tiny loading bar at 100% captioned "Still 100%. You're welcome."
- Q48: the win stamp reads "CHEATED" in green.
- Q49: as each dial reaches its correct digit the sprite faces that dial (LEFT, DOWN, RIGHT) for a beat; when all three read 6 · 1 · 2 the cartouche changes to "· COMBINATION ·" before SUBMIT.
- Q50: the certificate carries a line "STANDING AT COMPLETION" with the remaining hearts as small ink hearts; the examiner's last remark: "Certified. Corporate would like to remind you this is not a real certificate."

---
# NEW CONCEPT and TWIST briefs (replacements for riddle-book slots)

## Q29 · Self-Assessment · NEW CONCEPT · `q29-self-assessment.html` · next Q30 (Checkpoint)
Replaces 2 + 2 × 2. The player grades themself with the game's own rubber stamps.
1. Paper: directive "SELF-ASSESSMENT"; a bordered statement box: "The candidate has answered Question 29 correctly."; below it "Grade this statement."; a small embossed button SUBMIT FOR GRADING (first press: no heart, remark "The examiner is on break. Grade it yourself."; later presses cost a heart).
2. Two physical rubber stamps sit on the desk in the frame's right margin beside the paper (x about 1185 to 1265; one at y ≈ 210, one at y ≈ 340): wooden handle, rubber base, side labels INCORRECT (danger red) and CORRECT (pass green). Pointer-drag a stamp anywhere; drop it on the statement box to stamp: the impression appears at the drop point using the .stamp look at a random 3 to 8 degree angle and stays. Drop elsewhere: the stamp slides back to the desk.
3. INCORRECT stamped on the statement: heart lost, remark "Honesty noted. Standing reduced." CORRECT stamped: the statement becomes true; win.
4. Ladder: start "Grade the statement. The stamps are on the desk." / after 1 failure "You marked yourself wrong. I have recorded that you agree with me." / 2 "There is a second stamp. It is green. Nobody uses it." / 3 "Stamp the statement CORRECT. It becomes true when you do. That is how grading works."
5. Win: "SELF-CERTIFIED." / "The statement was false until you stamped it. Corporate calls this empowerment."

## Q31 · Lights Out · NEW CONCEPT · `q31-lights-out.html` · next Q32 (Dial to Eleven)
Replaces the dark-mode reveal (Q25 already uses the theme toggle). The room light is off; the switch is the lightbulb in the logo.
1. The play area is unlit: deep blue-black (#101018, and darker in the frame's dark mode) with a faint cone of light falling from the top centre (where the bulb is). The instruction "Q.31: PRESS THE THIRD BUTTON" is printed but invisible in the dark. Four dim embossed buttons A B C D are visible but inert while dark: clicking one → no heart, remark "You cannot see what you are pressing. Neither can I."
2. Overlay a dark translucent disc on the logo's lightbulb (frame x 660 to 720, y 18 to 62) so the bulb reads as OFF; after 15 s idle it blinks once slowly. Toggling DARK/LIGHT in the pause overlay changes the hall as usual but NOT the paper; remark "That changed the hall. It did not change the paper."
3. Click the bulb (no cursor change): a soft flash, the disc lifts, the play area lights up to ivory, the instruction fades in, the buttons become live. C wins; A, B, D cost a heart.
4. Ladder: start "The exam is hiding the instruction from you now. Change how you're looking at the screen, candidate." / after the first inert press "It is dark in here. The hall is fine. The paper is not." / 20 s "Somebody turned the light off. It is above you." / 40 s "The bulb. In the logo. Yes, that one."
5. Win: "ILLUMINATED." / "The instruction was always there. Someone had turned the light off. Someone is always Corporate."

## Q33 · Misplaced · TWIST · `q33-misplaced.html` · next Q34 (The Fourth Heart)
Keeps "one word is wrong" but the wrong word is the examiner's, lost in your paragraph.
1. Paragraph of about 60 words of flawless Institute boilerplate (every word spelled correctly) with the stray word "because" inserted where it makes no sense, e.g. "The Institute because issues certificates annually." Each word is a span. Pointerdown on a word starts a drag (a clone follows the pointer, the original greys). Release without moving (a click) = accusing that word: INCORRECT + heart, except clicking "because": remark "That is the word. It is not wrong. It is lost." and no heart.
2. Remarks read: "Quality control. One word on this page is wrong. Read it like it matters, ______ it does." The gap is an underlined drop target (about 90 px) that highlights when a dragged word hovers it. Drop a wrong word there: INCORRECT + heart, "That is not my word." Drop "because": the gap fills, the remark completes, the paragraph closes up, win.
3. Ladder after failures: 1 "Wrong is not the same as misspelled. Some words are simply not where they belong." / 2 "I seem to be missing one. Look at my remarks. Look at the gap." / 3 "The word because is in your paragraph. It is mine. Drag it down here."
4. Win: "RETURNED." / "The word was fine. It was in the wrong paragraph. Corporate calls that a typo."

## Q34 · The Fourth Heart · NEW CONCEPT · `q34-the-fourth-heart.html` · next Q35 (Institutional Simon)
Replaces the O/0 grid. The odd one out is in the HUD.
1. Paper: "One of these does not belong with the others." over a 6×4 grid of identical gold Institute seals (SVG, hairline detail). No buttons. Clicking seals never costs a heart: first "The grid is uniform. I checked.", then "Look at what is not on the paper."
2. HUD: FOUR hearts (row gap 6 px so they fit). The fourth is subtly off: fill a shade bluer (#6E3050), no drop shadow, about 4 % larger, and it idles with a faint pulse every 3 s. Clicking a real heart: remark "That one is yours. Leave it." (no loss). Clicking the fourth: it deflates (scale out, tiny "pfft" label), the row returns to three, win.
3. Ladder: start "One of these does not belong with the others. I did not say which these." / after 20 s or two seal clicks "The grid is uniform. I checked. Look at what is not on the paper." / next "How many hearts do you have? How many should you have?" / next "The fourth heart is not yours. Click it. It will not mind."
4. Win: "AUDITED." / "You had three hearts. You have always had three hearts. Corporate would like the fourth back."

## Q35 · Institutional Simon · TWIST · `q35-institutional-simon.html` · next Q36 (Recommended)
Keeps Simon, but the instrument is the chrome.
1. Paper: "Watch. Then repeat." with a round counter "ROUND 1 OF 3" and a state label WATCH / YOUR TURN. The sequence plays on five pieces of furniture, each glowing in turn (soft gold halo + gentle scale, 600 ms on, 250 ms gap): the logo, the "Q.35" label, the pause button, the examiner sprite, the hearts row. Rounds of 3, 4, 5 elements (random with no immediate repeats; expose `M.level.sequence`).
2. YOUR TURN: click those actual elements in order (they get pointer cursors only while YOUR TURN). Correct clicks echo the glow. A wrong element: INCORRECT + heart, replay the same round. Completing round 3 wins.
3. The pause button is part of the instrument for the whole level and does not pause; the first time it is pressed outside a round: remark "The suspension control is part of the instrument today. I disabled it. Do not tell corporate."
4. Ladder: start "A simple test of focus. Corporate insists on measuring 'attention to detail.' Watch what lights up. Then touch it, in order." / after 1 failure "The paper is not the instrument. Look at everything that glowed." / 2 "The logo. The item number. The pause control. Me. Your hearts. All of them accept a click today."
5. Win: "ATTENTIVE." / "You played the examination like an instrument. Corporate is measuring that too."

## Q37 · Trim Marks · NEW CONCEPT · `q37-trim-marks.html` · next Q38 (The Other Button)
Replaces count-the-squares. The corner ticks are crop marks; the answer was trimmed off.
1. Paper: "The answer to this item is 14. Submit it." Footer in mono: "Corporate printed the wrong buttons. Corporate has been informed." A row of buttons 9, 12, 16, 20 and a fifth button whose left quarter peeks in at the paper's right edge, clipped (the paper has overflow hidden). 9/12/16/20 cost a heart.
2. The top-right and bottom-right corner ticks are draggable (pointer capture). Dragging one to the right widens the paper (border, caption, ticks and header band move with the new edge) up to +105 px, into the frame margin, revealing the fifth button: 14. Click it to win. Left ticks do nothing.
3. Ladder: start "The answer is 14. Submit it. Something on this row looks cut off." / after 1 "Corporate trimmed the page. The fifth button did not survive." / 2 "The little marks in the corners are crop marks. They set the trim." / 3 "Drag a right-hand corner tick outward. The page grows. The 14 is there."
4. Win: "UNTRIMMED." / "The fifth button was printed. It was just outside the trim. Corporate saves on paper."

## Q38 · The Other Button · NEW CONCEPT · `q38-the-other-button.html` · next Q39 (Issued to the Invigilator)
Replaces the arrow rotation pattern. "Not that one. The other one."
1. Paper: "Press the button." One large embossed button (320×96) labelled THE BUTTON, drawn with a faint two-tone split (left half slightly worn, right half pristine).
2. Left click: the first costs a heart with "Not that one. The other one."; later left clicks cost nothing and escalate: "Still that one." / "Your mouse has two buttons." / "The other one. On the mouse. Two-finger tap on a trackpad, or hold Ctrl and click."
3. Right click on the button (the contextmenu event; suppress the browser menu on the whole frame): the button depresses on its right half, win. Right-clicking elsewhere does nothing.
4. Win: "THE OTHER ONE." / "Not that button. The other button. It has been under your finger the whole time."

## Q39 · Issued to the Invigilator · NEW CONCEPT · `q39-issued-to-the-invigilator.html` · next Q40 (Hold to Reboot)
Replaces lights-out. The instruction is in the pause menu's cheat box.
1. Paper: "The instruction for this question has been issued to the invigilator." Four blank buttons A B C D. Wrong ones cost a heart. D wins.
2. The pause overlay's INVIGILATOR OVERRIDE field placeholder reads "Q.39: PRESS D" instead of "Override Key" and pulses once the first time the overlay opens. Pausing never costs anything.
3. Ladder: start "Issued to the invigilator. The invigilator has a box." / after 1 "Not on the paper. The invigilator's box is in the suspension screen." / 2 "Pause. Bottom left. The override field has something written in it." / 3 "It says PRESS D. Press D."
4. Win: "OVERRIDDEN." / "The invigilator's box was the instruction all along. It has been used exactly once."

## Q41 · Reply · NEW CONCEPT · `q41-reply.html` · next Q42 (Entry Fee)
Replaces the anagram. The examiner's blinking caret has always been a cursor.
1. Paper: only "Reply to the examiner." in serif, centred. No buttons, no fields. Remarks: "State your answer. I am listening." with the caret.
2. Clicking the remarks (or the caret) focuses a hidden input; typed characters appear inline after the remark in the examiner's typeface, as dictation. Any key press while the level is active also routes into it (be generous). Enter with text → the remark appends "Received. I have written it down as my own." then win. Enter with nothing typed → "Say something. Anything. It is not graded." No heart loss anywhere in this level; it is the Act V breather.
3. Clicking the paper: after 3 clicks "There is nothing on the paper to press. Look at where the cursor is." / then "My remarks have a blinking line at the end. It is a cursor. It has always been a cursor." / then "Click my remarks. Type anything. Press Enter."
4. Win: "DICTATED." / "Your answer is now part of the examiner's remarks. He will claim it was his."

## Q42 · Entry Fee · NEW CONCEPT · `q42-entry-fee.html` · next Q43 (Ghost Continue)
Replaces "subtract 5 from 25". Answer stays 1 for Q49.
1. On load the paper reads "This item costs one heart to open." and the third HUD heart lifts out of CANDIDATE STANDING and flies (animated along a curve, 900 ms) to a printed box on the paper labelled FEE (top right of the play area) where it sits. The empty HUD slot gets a tiny mono note under the row: "ONE ON THE PAPER".
2. Then the question: "How many hearts has this item cost you?" Buttons 0, 1, 2, 3. Wrong answers slam INCORRECT and cost a real heart. 1 wins: the fee heart flies home first, then the win screen.
3. Ladder: start "A little arithmetic. Read it very literally. One heart deducted. How many has this item cost you?" / after 1 "Do not overthink it. The fee is in the box on the paper. Count it." / 2 "One heart is on the paper. One." / 3 "Press 1. You will get it back."
4. Win: "ONE." / "The fee is refunded. Corporate is trialling admission charges for questions." Header note: Q49's middle digit stays 1 ("how many hearts Q.42 charged you").

## Q43 · Ghost Continue · NEW CONCEPT · `q43-ghost-continue.html` · next Q44 (Sign the Confession)
Replaces spot-the-difference. The previous win screen never fully cleared.
1. Paper: "Await instructions." in dim mono at the top; otherwise blank. A small embossed REFRESH button bottom-right costs a heart and makes the ghost fainter (opacity 0.30 → 0.22 → 0.15).
2. The ghost: a CONTINUE → button at exactly the win screen's usual position (centred, about 64 % down the play area), 30 % opacity with a slight blur and no shadow, like screen burn-in. It is fully clickable: clicking it wins. Nothing else on the paper responds.
3. Examiner: silent for 8 s, then "...", then "Nothing new has arrived.", then "Something old has not left.", then "The last screen's CONTINUE button is still there. Faintly. It still works."
4. Win: "CONTINUED." / "Corporate never cleared the last screen. You used it. That was the instruction."

## Q44 · Sign the Confession · TWIST · `q44-sign-the-confession.html` · next Q45 (Runaway Submit)
Keeps the whodunit; the culprit is you, and you sign for it.
1. Paper: "CASE FILE #22 · INCIDENT REPORT". Facts: "During Question 21 someone held down Frodrick's paddle." "During Question 20 someone pressed a control marked OVERRIDE." "During Question 8 someone declined to help a child." Three suspect cards ADA / BEN / CLEO with printed alibis ("in a meeting since Question 1", "abroad, Questions 6 to 30", "has never touched a mouse"); clicking a card costs a heart.
2. At the bottom a form line: "I confess.   SIGNED: ______________   DATE: <today>". Clicking the dotted line writes a signature of the registered name "Box" in oxblood ink (SVG path revealed with stroke-dashoffset over 700 ms, script-like, with a serif fallback), then M.slam('CONFESSED', true) and the win screen.
3. Ladder: start "A workplace mystery. Read the clues, name the culprit. Three suspects have alibis. A fourth does not." / after 1 "That one was in a meeting. Read the cards." / 2 "The paddle was frozen from your seat. The form at the bottom is for the person in your seat." / 3 "Click the signature line. Confess."
4. Win: "CONFESSED." / "Signed in your own name. The Institute has kept it since Question 1."

## Q47 · Change the Facts · TWIST · `q47-change-the-facts.html` · next Q48 (The Cheat)
Keeps Müller-Lyer; the truthful answer is not on the form.
1. Paper: "Which line is longer?" Two horizontal lines of equal length (360 px) with the classic fins (top inward, bottom outward), a live mono readout under each ("142 mm"). Buttons TOP / BOTTOM / SAME; SAME is greyed with a mono note "(unavailable in your region)". SAME costs a heart ("Unavailable. In your region."). TOP or BOTTOM while the lines are equal costs a heart.
2. Each line's endpoints carry small draggable handles (pointer capture). Drag an endpoint to change a line's length; the readouts update. When one line is at least 20 px longer, the matching button wins.
3. Ladder: start "Which line is longer? Don't trust your eyes. SAME is unavailable in your region." / after 1 "They are equal and you cannot say so. That is the situation." / 2 "Nothing on this page is fixed. Not even the question." / 3 "Grab the end of the top line. Make it longer. Then say it is."
4. Win: "AMENDED." / "You changed the facts to fit the buttons. Corporate does this every quarter."
