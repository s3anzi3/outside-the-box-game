# Outside-the-Box (OTB) · Level design context for Q21–Q50 mocks

Repo: `C:\Users\panky\Desktop\outside-the-box-1`. Deployed build = `outside-the-box/final/` (TypeScript canvas game). Mocks live in `mocks/` as standalone HTML files opened from disk (file://). Mock chrome template = `mocks/q9-calculus.html` (frame 1280×860, logo, exam paper with header band, bottom examiner panel with remarks + hearts).

## What the game is
"Outside-the-Box Thinking Certification" by the fictional Institute of Lateral Cognition. A 50-question exam. Each question is a trap that punishes the instinctive/conventional response and rewards lateral thinking. Wrong answers slam a red INCORRECT stamp on the paper and cost a heart (3 hearts = "candidate standing"). Correct = green CORRECT stamp + chime + win screen with a CONTINUE button. An examiner robot (pixel sprite, four facing directions: Player_Down/Up/Left/Right.png) sits in the bottom panel and types "EXAMINER'S REMARKS" (the level's prompt/hints, typewriter effect). Look: "Ivory & Oxblood" exam booklet (ivory paper, oxblood accent, antique gold seals, serif display type, mono labels). Dark mode = "after-hours examination hall".

Acts: I 1–10, II 11–20, III 21–30, IV 31–40, V 41–50. Q50 = finale (type the name you entered at Q1, then a certificate with GOLD/SILVER/BRONZE tier by elapsed time).

## The owner's taste (HARD RULES)
- He approves levels that WEAPONIZE THE GAME'S OWN FURNITURE or physical exam-world objects. Approved examples: Q9 (the "Q.9" header label IS the answer button), Q11 (the loading bar freezes at 99%, you drag the handle yourself), Q5 (fleeing button, a tiny real one elsewhere), Q8 (a stranger takes over the whole screen), Q13 (a real 3D die you must turn by hand to the hidden 6), Q14 (you must leave the browser window for 4 s), Q15 (rip the paper's corner so lines can route around the desk), Q22 (use PAUSE to freeze a flashing number), Q25 (toggle dark/light mode in the pause menu to reveal maze walls), Q27 (type the answer on your physical keyboard while all buttons are decoys).
- He REJECTS riddle-book classics: count the F's, mirrored text, half of twelve, 28 days, OTTFFSS, 2+2×2, anagrams, whodunits, count-the-squares, spot the O among 0s, Müller-Lyer "same length" and so on. "A trivia/riddle question with four buttons is the failure mode."
- Pacing nuance: "not every level has to have a crazy twist given that we have 50." Calm levels are welcome BETWEEN the big ones (e.g. Q16 answer hidden in the examiner's remarks; Q17 do nothing for 7 s). Do not force weirdness everywhere; but no riddle-book classics.
- Humour: deadpan institutional voice. The examiner is dry, a little petty, occasionally glitching/honest. Corporate is a running joke ("Corporate wanted a question that…"). Frodrick Rederer is the recurring antagonist (pong opponent Q6, rematch Q21 where you cheat by holding his paddle, FRODRICK.EXE boss Q28).
- Visual: stay inside the established theme. Embossed paper buttons (paper bg, 2px stroke, radius 5–6, soft shadow, hover = oxblood fill + ivory text). Fountain-pen ink palette for coloured things: red #C03A2E, blue #2E6BA8, green #3F8F55, yellow #D8A81F. Keep the airy full-window proportions.
- Copy: NO em dashes (—) in any new copy. Use periods, commas, colons. Short sentences.

## Furniture inventory (things a level may weaponize; ✔ = already used by an approved level, prefer UNUSED ones)
- Q number label in the paper header ✔(Q9)
- Pause button / pause overlay ("Examination Suspended" document box: RESUME, QUIT TO MENU, DARK MODE/LIGHT MODE, SOUND slider, "INVIGILATOR OVERRIDE" text box for a cheat key) ✔(Q22 pause freeze, Q25 theme toggle)
- Hearts HUD "CANDIDATE STANDING" (3 vector hearts; lost = hollow) — UNUSED as a mechanic
- Examiner robot sprite (4 facing directions) — UNUSED as a mechanic (Q3 used the dot on the "i" in his remarks text)
- Examiner's remarks text (typewriter) ✔(Q3 dot, Q16 leak)
- The INCORRECT / CORRECT stamp — UNUSED
- The exam paper as a physical sheet (drag it, tear it, flip it, something under it) ✔(Q15 corner rip) — sliding/lifting still UNUSED
- Caption cartouche "· EXAMINATION PAPER ·" on the paper's top border, corner ticks — UNUSED
- The logo image at the top (sticker OUTSIDE THE BOX with a lightbulb above the S) — UNUSED
- Browser: window focus/blur ✔(Q14); tab title, favicon, right-click context menu, keyboard shortcuts, scroll wheel (Q2 terms scroll ✔), text input emptiness — UNUSED
- Mouse: hold ✔(Q21, Q40), drag ✔(Q11, Q13, Q15, Q32), right button — UNUSED, double click — UNUSED
- Physical keyboard ✔(Q27)
- Time: waiting ✔(Q17), timers ✔(Q10, Q25)
- Game history/callbacks ✔(Q30→Q16 BLUE, Q46→Q11, Q49 lock 6·1·2 from Q13/Q42/Q18)
- Sound (volume slider) — UNUSED, but avoid audio-dependent solutions (players may be muted)
- Win screen CONTINUE button, level select "answer sheet", main menu — UNUSED (be careful: nothing that risks losing game state)

## Existing levels (do not duplicate their tricks)
Q1 name entry · Q2 scroll the full terms to enable ACCEPT · Q3 click the dot on the "i" in the examiner's text · Q4 wait for green, don't click red · Q5 fleeing button, tiny real one · Q6 pong vs Frodrick · Q7 chalkboard: erase the F's with an eraser, then click 0 · Q8 stranger takeover (let the child die / get scammed) · Q9 Q-number label is the answer · Q10 maze · Q11 loading bar 99%, drag it · Q12 Stroop (click the green-inked word) · Q13 3D loaded die, turn the 6 up by hand · Q14 leave the room (blur window) · Q15 connect pairs, rip the corner to draw on the desk · Q16 answer leaked in remarks (BLUE) · Q17 do nothing for 7 s · Q18 1+1=10 (base 2 fine print) · Q19 OTTFFSS→E (flagged as riddle-book, pending) · Q20 SYSTEM BREACH: press the forbidden OVERRIDE button.

## Current Q21–Q50 in `final/levels/` (what exists today)
21 Frodrick pong rematch, his paddle is huge and perfect; hold left mouse on his paddle to freeze it (turns red), SPACE serves, first to 3. Intro popup: "Good job not killing me... I guess." Win: "YOU CHEATED! Frodrick never saw it coming."
22 "Stay alert." random 3–8 s wait, then a 10-digit number flashes 0.75 s with "MEMORISE NOW"; then type it. Pause freezes the flash (the trick). Remark: "did you catch that??"
23 Truth table for (P→Q)∧(Q→P) "CASE FILE #7 VAULT SECURITY PROTOCOL"; click cells to cycle T/F; then pick "Satisfied when both conditions match". Win "CASE CLOSED."
24 "15 + 15 = ?" with 10 decoy buttons (HINT, CALCULATE, EASY MODE ON, SHOW STEPS, SKIP, CONFIRM, CHECK ANSWER, USE CALCULATOR, SUBMIT ALL, SOLVE) all cost a heart; answers 25/30/35/1515.
25 Dark/light maze: seeded 11×8 maze, three gates that are solid only in one mode; toggle mode via pause menu; after first toggle an in-maze ◐ TOGGLE button appears; 80 s timer; WASD.
26 Click the cookie 100 times (no trick, endurance).
27 Riddle "I have keys but no locks…" buttons HOUSE/MAP/PIANO/KEYBOARD all decoys; type KEYBOARD on the physical keyboard.
28 FRODRICK.EXE boss shooter: A/D move, SPACE fire, boss 110 HP, 3 phases (green single shot, yellow triple, red 5-way fan), i-frames.
29 2 + 2 × 2 = 6 (riddle-book) → REPLACE
30 Checkpoint: "were you listening?" answer BLUE (callback Q16). Keep, calm.
31 Instruction invisible in dark mode; switch to light in pause menu → "PICK THE THIRD BUTTON". Reuses Q25's trick → REPLACE (keep the "hidden instruction / change how you look" spirit)
32 Dial labelled MAX 10, drag knob to a secret 11. Keep (tactile).
33 Proofread paragraph, click "recieve" (riddle-book) → TWIST
34 Grid of O's, click the single 0 (riddle-book) → REPLACE
35 Simon: four panels flash a sequence, repeat it. → TWIST (make it OTB-specific)
36 Exam pre-selects 54 "RECOMMENDED" for 7×8; pick 56 then CONFIRM SELECTION. Keep (distrust the default UI).
37 Count the squares in a 3×3 = 14 (riddle-book) → REPLACE
38 Arrow rotation pattern → ↓ ← ? = ↑ (riddle-book) → REPLACE
39 2×2 lights-out (click all four) → REPLACE
40 "The exam has crashed" hold HOLD TO REBOOT for ~2 s. Keep.
41 Anagram DLROW = WORLD (riddle-book) → REPLACE
42 "How many times can you subtract 5 from 25?" = 1 (riddle-book) → REPLACE, but Q49's lock uses this answer as its middle digit (code 6·1·2), so keep the answer 1 or make Q49 adapt.
43 Two colour grids, click the off tile (riddle-book) → REPLACE
44 Whodunit Ada/Ben/Cleo (riddle-book) → REPLACE or TWIST
45 SUBMIT button flees the cursor; herd it into a corner. Keep (Act V escalation of Q5).
46 Recall Q11: how did you beat the bar? DRAGGED IT. Keep, calm callback.
47 Müller-Lyer, click SAME (riddle-book) → TWIST
48 No fair answer (YES/NO/MAYBE/42 all wrong); click the red ⛔ CHEAT button. Keep.
49 Three dials, set 6·1·2, SUBMIT. Keep.
50 "What is your name?" type the Q1 name; CORRECT screen; certificate with medallion, tier by time. Keep.

## Baseline concepts for the replaced / twisted slots (to be critiqued and improved)
29 THE OLD STAMP: "Find the error on this page." Four true statements as buttons (all INCORRECT). A faded, angled INCORRECT stamp from a "previous candidate" is already printed on the paper. Clicking that stamp wins: "The only wrong thing on this page was the verdict."
31 LIGHTS OUT: the paper is dark (room light off), instruction unreadable. Toggling DARK/LIGHT MODE in the pause menu changes the hall but NOT the paper (misdirect for Q25 veterans). Clicking the lightbulb in the logo at the top turns the light on and reveals the instruction.
33 QUALITY CONTROL (twist): the paragraph is flawless; every word clicked = INCORRECT. The one wrong word is in the game's own chrome: the caption cartouche on the paper border reads "· EXAMINATOIN PAPER ·". Click it.
34 THE WANDERING HEART: "One of these does not belong with the others." A grid of ~40 printed flat-ink hearts. The HUD shows only 2 hearts, the third slot empty with a tiny note. One heart in the grid is the REAL one (oxblood fill, shadow, exact HUD style). Click it and it flies back to the HUD. Printed hearts cost a heart.
35 WATCH THE EXAMINER (twist): the examiner robot in the bottom panel turns UP/DOWN/LEFT/RIGHT (its four sprites) in a sequence; you repeat by clicking four arrow panels on the paper. Rounds of 3, 4, 5.
37 UNDER THE PAPER: "Count the squares" figure with buttons 9/12/16/20 (none correct). You can grab the paper by its margin and slide it aside; beneath is the ANSWER KEY sheet with "Q.37 … 14" and a 14 button. Click it.
38 THE OTHER BUTTON: one big button "PRESS THE BUTTON". Left click = INCORRECT ("Not that one. The other one."). Right click on it = CORRECT. Custom contextmenu suppressed.
39 LOOK UP: paper says "The instruction for this question is displayed above." Four blank buttons A–D. The browser TAB TITLE scrolls "◆ THE ANSWER IS B ◆". (Needs its own tab, not an iframe.)
41 HAND IT IN: four answer cards; clicking them = "Clicking is not handing in." Drag a card down onto the examiner in the bottom panel; he takes it: "Received. Content unverified." (Any card works; the delivery is the answer.)
42 HOW MANY TIMES: "How many times have you been asked this question?" buttons 0/1/2/3. First time: 1. Each wrong answer re-asks it, and the right answer becomes 2, then 3. Q49 then uses "the number of times Q42 asked you" (1 for most players).
43 WAKE THE EXAMINER: blank paper "Await instructions." The examiner sprite is asleep (Zzz), remarks empty. Waiting does nothing. Click the sprite itself (never clickable before) to wake him: "Oh. Right. Q.43: press CONTINUE." A CONTINUE button appears.
44 WHODUNIT (twist): the crime is "someone froze Frodrick's paddle during Question 21, overrode a system lock at Question 20, and declined to help a child at Question 8." Suspects ADA / BEN / CLEO / ME. Answer: ME. Win: "CONFESSED."
47 MEASURE IT (twist): Müller-Lyer lines, buttons TOP / BOTTOM / SAME. The classic answer SAME is the trap: the top line really is longer by a few px. A draggable wooden RULER sits on the desk margin; drag it over the lines to measure. Win: "You measured. The illusion was that you already knew the answer."

Levels kept as-is get faithful ports plus small quirks (e.g. Q26 cookie crumbles as you click and the examiner comments at 25/50/75/99; Q45 the cornered button changes its label to "OK OK FINE").
