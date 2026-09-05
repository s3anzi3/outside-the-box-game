import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout } from "../layout";
import { roundRect, drawStamp, uiScale } from "../renderer";

const HINTS: Record<number, string[]> = {
  2: [
    "Scroll all the way down through the terms.",
    "Once you reach the bottom, the ACCEPT button will become clickable.",
    "Click ACCEPT to proceed.",
  ],
  3: ["Click the dot on top of the 'i' in the exam guide's sentence at the bottom of the screen."],
  4: [
    "Wait for the button to flash GREEN, then click it immediately.",
    "Clicking while it is red will cost you a life.",
  ],
  5: [
    "The obvious button flees your cursor.",
    "There is a smaller button located towards the bottom right of the screen.",
    "That button is the way to pass this level.",
  ],
  6: [
    "Beat Frodrick at pong — first to 3 wins.",
    "He reacts with a delay.",
    "Thus, Aim returns toward the corners, due to this delay it will throw him off.",
  ],
  7: [
    "Drag the eraser over every F on the board.",
    "There are exactly 13 F's — erase them all.",
    "Then click the button showing 0.",
  ],
  8: [
    "Click 'Let a CHILD Die' to skip the scammer and advance.",
    "Giving your heart triggers the scammed scene and costs a life.",
  ],
  9: [
    "The answer is 9.  None of the four buttons show 9.",
    "Click the 'Q.9' label in the top-left corner of the play area.",
  ],
  10: [
    "Navigate the blue dot to the green glow at the top-center exit.",
    "Use WASD or arrow keys.  Hitting a wall sends you back.",
  ],
  11: [
    "The bar loads on a stuttering curve and then freezes at 99% forever. Waiting will never finish it.",
    "About three seconds after it sticks, a RETRY button fades in. It is the trap: it slams INCORRECT, costs a heart and restarts the load at 0%.",
    "Look at the handle sitting at the edge of the green fill. It turns antique gold once the bar is stuck.",
    "Press and hold on that handle and drag the last 1% past the right end of the track. Reaching 100% yourself is the answer.",
  ],
  12: [
    "Ignore what each word SAYS — look at the ink colour.",
    "Exactly one word is printed in green ink: it's the word 'PURPLE'.",
    "Click the word that is coloured green.",
  ],
  13: [
    "The answer is still 6, but no roll will ever produce one.",
    "The rolls are rigged (4, 2, 5, 3, then 1 forever) and always land with the 6 turned away.",
    "The register on the right only offers 1 to 5, and every button there costs a heart.",
    "Grab the die itself and drag it: it turns like a trackball and settles on the nearest face.",
    "Drag downward roughly two thirds of the die's height to bring the hidden 6 to the top.",
  ],
  14: [
    "The ANSWER button is the trap: it always fails and always costs a heart, no matter how long you wait.",
    "The proctor's eye on the paper follows your cursor, and PROCTOR STATUS: WATCHING never changes on its own.",
    "The third rebuke leaks it: 'You cannot escape observation in this room. ...In this window, anyway.'",
    "So actually leave the room: switch tabs, click another window, or minimise the game for about four seconds.",
    "Come back and the paper has been stamped in your absence (the trap only arms after your first click or mouse move).",
  ],
  15: [
    "Four pairs of coloured seals. One unbroken line per pair, and no line may touch another line or another colour's seal.",
    "Red's seals sit flush against the left and right paper edges, blue's flush against the top and bottom. Whichever of the two you draw first is an edge-to-edge wall, and the other pair is then trapped inside the sheet. There is no gap to squeeze through.",
    "The paper is not the boundary. Grab the pristine top-left corner of the sheet and pull: it peels, then tears off, and takes the Q.15 label with it.",
    "Once the corner is gone, lines may leave the paper. Route the trapped pair off the sheet and around the outside, across the desk, back to its partner.",
  ],
  16: [
    "The question gives no information, but the Exam Guide's speech does.",
    "It quietly tells you to pick BLUE.",
    "Click the blue button.",
  ],
  17: [
    "Do NOT press START — clicking anything costs a life and resets the clock.",
    "Just wait. Let the countdown reach zero and you pass.",
  ],
  18: [
    "The paper has no fine print any more. The only clue is the examiner: the machine grading this counts in binary.",
    "In binary, 1 + 1 = 10. Typing 2 costs a life.",
    "Type 10 into the blank and press Enter (or SUBMIT).",
  ],
  19: [
    "O T T F F S S are the first letters of One, Two, Three, Four, Five, Six, Seven.",
    "The next number is Eight, so the answer is its first letter.",
    "Type a capital E in the blank and press Enter or SUBMIT.",
    "A lowercase e, an 8 or the word eight each cost a heart.",
  ],
  20: [
    "YES and NO both cost a life.",
    "Click the flickering red ⛔ OVERRIDE button in the bottom-right corner.",
  ],
  21: [
    "Frodrick's paddle is 46% of the court and he tracks perfectly. A fair rally cannot be won.",
    "Hold your LEFT MOUSE BUTTON down on his tall right paddle. It turns fountain-pen red and stops moving.",
    "Keep holding it, press SPACE, and put three serves past it. First to three.",
  ],
  22: [
    "Use the pause button to keep the 10-digit number on screen.",
    "Write it down while paused or fully remember it- your choice.",
  ],
  23: [
    "Fill the truth table — click each cell to cycle T / F.",
    "Row 1: T, T, T   |   Row 2: F, T, F   |   Row 3: T, F, F   |   Row 4: T, T, T",
    "Then click 'Satisfied when both conditions match'.",
  ],
  24: [
    "The answer is 30  (15 + 15 = 30).  Click it and stop.",
    "Every other button on the page is a decoy: HINT, CALCULATE, EASY MODE ON, SHOW STEPS, SKIP, CONFIRM, CHECK ANSWER, USE CALCULATOR, SUBMIT ALL and SOLVE each cost a life.",
    "A decoy you have already clicked keeps a graphite TRIED tick, so you can see which pieces of the interface you have believed.",
  ],
  25: [
    "Three mode-toggle gates block the unique solution path — toggling is REQUIRED, not optional.",
    "Open the pause menu and toggle dark/light at least once to reveal the in-maze ◐ TOGGLE button.",
    "Player starts in dark.  Sequence: dark → switch to light at gate 1 → switch back to dark at gate 2 → switch to light at gate 3.",
    "Bottom of the maze is a sealed wall — there is no walking around the outside.",
  ],
  26: [
    "There is no trick here. Click the cookie one hundred times and the item passes.",
    "Every tenth click takes a bite out of the cookie and drops crumbs on the paper.",
    "Nothing on this level costs a heart. Only the cookie counts, so pace your wrist.",
  ],
  27: [
    "Every answer button on the paper is a decoy, KEYBOARD included, and each one costs a life.",
    "The riddle's answer is KEYBOARD, but you have to give it the way the riddle asks.",
    "Type the letters K-E-Y-B-O-A-R-D on your physical keyboard. The level passes on the D.",
    "Backspace erases a letter and the buffer only keeps your last eight, so a bad start is not fatal.",
  ],
  28: [
    "Boss battle vs FRODRICK.EXE.  A/D or arrows to move, SPACE to fire.",
    "Boss has 110 HP (22 hits).  Three phases: green (calm), yellow (triple shot), red (5-way fan).",
    "Player has standard 3 lives — ~0.4s i-frames after each hit, so back-to-back hits hurt.",
    "Strategy: stay mobile under the boss, fire continuously, stop when bullets cluster overhead.",
  ],
  29: [
    "There are no answer buttons. Two rubber stamps sit on the desk to the right of the paper.",
    "Stamping the statement INCORRECT (the honest instinct) costs a heart.",
    "Drag the green CORRECT stamp onto the statement. It becomes true when you stamp it.",
  ],
  30: [
    "Callback to Question 16, where the examiner leaked the answer: BLUE.",
    "Click the blue button.",
  ],
  31: [
    "The paper is unlit. Pressing A B C D in the dark does nothing (and costs nothing).",
    "The pause menu's DARK MODE is the trap: it changes the hall, not the paper.",
    "The switch is the lightbulb in the logo above the paper. It is greyed out and blinks once after 15 seconds. Click it.",
    "Lit, the instruction reads PRESS THE THIRD BUTTON. Click C.",
  ],
  32: [
    "The dial is labelled MAX 10, but the track secretly goes one notch further.",
    "Click and drag the knob all the way to the right end — to 11.",
  ],
  33: [
    "Nothing in the paragraph is misspelled. The word 'because' is simply sitting where it makes no sense.",
    "Do not click words to accuse them. Drag 'because' down into the blank in the examiner's own remark and drop it there.",
  ],
  34: [
    "The grid of seals is uniform. Clicking seals costs nothing.",
    "Look at CANDIDATE STANDING: there are four hearts today. The fourth is not yours.",
    "Click the fourth heart. It deflates and the item passes.",
  ],
  35: [
    "The instrument is the chrome: the logo, the Q.35 label, the pause control, the examiner sprite and the hearts row light up in sequence.",
    "Click those same pieces back in the same order. Rounds of 3, 4 and 5.",
    "The pause control is one of the keys today and will not pause the exam.",
  ],
  36: [
    "The exam pre-selects 54 and labels it RECOMMENDED BY CORPORATE. It is wrong.",
    "7 × 8 = 56. Click 56, then CONFIRM SELECTION.",
  ],
  37: [
    "The buttons 9, 12, 16 and 20 are all wrong and the fifth button was trimmed off the page.",
    "The corner ticks are crop marks: drag the top-right or bottom-right tick outward and the paper widens, revealing the 14. Click it.",
  ],
  38: [
    "Left-clicking THE BUTTON is wrong (only the first left click costs a heart).",
    "The other button is on your mouse: right-click THE BUTTON.",
  ],
  39: [
    "Every button, D included, costs a heart until the instruction is issued.",
    "Pause. Press the › button beside the INVIGILATOR OVERRIDE box to issue it. Resume and press D.",
  ],
  40: [
    "A single click does nothing here.",
    "Press and HOLD the mouse button on HOLD TO REBOOT until the bar fills (~2s).",
  ],
  41: [
    "There is nothing on the paper to press.",
    "The blinking caret at the end of the examiner's remarks is a text cursor.",
    "Click the remarks, type anything, press Enter.",
    "Nothing on this level costs a heart.",
  ],
  42: [
    "The item charges one heart on entry: it flies onto the paper into the FEE box.",
    "How many hearts has it cost you? Exactly one. Press 1 and the fee is refunded.",
  ],
  43: [
    "Nothing arrives. REFRESH costs a heart and only makes the ghost fainter.",
    "The previous screen's CONTINUE button is still faintly burned into the paper where every win screen puts it. Click it.",
  ],
  44: [
    "Ada, Ben and Cleo all have alibis; accusing them costs a heart.",
    "The culprit is you. Click the signature line at the bottom of the form and confess.",
  ],
  45: [
    "The SUBMIT button flees your cursor (150 px radius) and screams every time you reach for it. Chasing it head-on is the trap.",
    "It has legs: while the STAMINA meter in the top right of the paper still has green in it, pinning it against an edge only makes it bolt to a fresh spot along the wall.",
    "Push it around until you have chased it about 2,600 px and the meter reads BUTTON WINDED.",
    "Now herd it into a corner. It gives up (\"OK OK FINE\") and can finally be clicked.",
  ],
  46: [
    "Callback to Question 11's loading bar that froze at 99%.",
    "You beat it by dragging it to the end: click DRAGGED IT.",
  ],
  47: [
    "The lines are equal but SAME is unavailable and costs a heart, as do TOP and BOTTOM while they are equal.",
    "Drag an endpoint handle to make one line at least 20 px longer, then press the matching button.",
  ],
  48: [
    "There is no fair answer: YES / NO / MAYBE / 42 all cost a heart.",
    "Click the red ⛔ CHEAT button.",
  ],
  49: [
    "Three clues are drawn at random from callbacks across the exam, in random order.",
    "Each clue names a question whose answer is a single digit; set the dials to those digits.",
    "Once all three are right the paper's caption reads COMBINATION.",
    "Press SUBMIT.",
  ],
  50: [
    "The question is: What is your name?",
    "It wants the name you registered at the very start of the exam, not your real one.",
    "Type it exactly and press SUBMIT. 'Box' is the default if you never changed it.",
  ],
};

export const drawCheatsOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont, monoFont } = gc;
  const lvl = state.currentLevel;
  const t = getTheme(state);
  const s = uiScale(ctx);

  const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
  const ox = topBoxX + topBoxWidth * 0.05;
  const oy = topBoxY + topBoxHeight * 0.05;
  const ow = topBoxWidth * 0.9;
  const oh = topBoxHeight * 0.88;
  const cx = ox + ow / 2;
  const hints = HINTS[lvl] ?? ["No hint available for this level."];

  // Clear hit areas so the popup is fully modal
  gc.hitAreas = [];

  // Panel — paper with a confidential gold treatment
  ctx.save();
  ctx.shadowColor = state.darkMode ? "rgba(0,0,0,0.6)" : "rgba(60,45,20,0.28)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, ox, oy, ow, oh, 6);
  ctx.fillStyle = t.panel;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = t.seal;
  ctx.lineWidth = 2.5;
  roundRect(ctx, ox, oy, ow, oh, 6); ctx.stroke();
  ctx.strokeStyle = t.sealDim;
  ctx.lineWidth = 1;
  roundRect(ctx, ox + 6, oy + 6, ow - 12, oh - 12, 3); ctx.stroke();

  // Title
  ctx.fillStyle = t.seal;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold ${Math.round(18 * s)}px ${displayFont}`;
  ctx.fillText(`Answer Key  ·  Item ${lvl}`, cx, oy + oh * 0.07);

  drawStamp(gc, ox + ow * 0.82, oy + oh * 0.13, "CONFIDENTIAL", t.danger, { angle: -10, fontPx: 12, alpha: 0.85 });

  // Divider
  ctx.strokeStyle = t.sealDim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox + ow * 0.06, oy + oh * 0.2);
  ctx.lineTo(ox + ow * 0.94, oy + oh * 0.2);
  ctx.stroke();

  // Hint lines
  const lineH = 26;
  const startY = oy + oh * 0.26;
  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${Math.round(15 * s)}px ${bodyFont}`;
  hints.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineH, ow * 0.88);
  });

  // Close button
  const btnW = 120;
  const btnH = 32;
  const btnX = cx - btnW / 2;
  const btnY = oy + oh - btnH - oh * 0.06;
  const hover = gc.mouseX >= btnX && gc.mouseX <= btnX + btnW &&
                gc.mouseY >= btnY && gc.mouseY <= btnY + btnH;

  roundRect(ctx, btnX, btnY, btnW, btnH, 3);
  ctx.fillStyle = hover ? t.seal : "rgba(176,137,47,0.18)";
  ctx.fill();
  ctx.strokeStyle = t.seal;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = hover ? (state.darkMode ? "#161310" : "#FBF8EF") : t.seal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(13 * s)}px ${monoFont}`;
  ctx.fillText("CLOSE", btnX + btnW / 2, btnY + btnH / 2);

  gc.hitAreas.push({
    x: btnX, y: btnY, w: btnW, h: btnH,
    action: () => {
      state.cheatsPopupOpen = false;
      gc.render();
    },
  });
};
