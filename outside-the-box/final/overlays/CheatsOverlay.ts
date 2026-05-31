import { GameContext } from "../types";
import { getTheme } from "../theme";
import { getLayout, getMovementLayout } from "../layout";

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
    "The buttons (I AGREE / ACCEPT / CONTINUE) are all decoys that cost a life.",
    "The real answer is a single word buried in the paragraph of fine print.",
    "Click the word PINEAPPLE inside the text.",
  ],
  12: [
    "Ignore what each word SAYS — look at the ink colour.",
    "Exactly one word is printed in green ink: it's the word 'PURPLE'.",
    "Click the word that is coloured green.",
  ],
  13: [
    "The answer is 6.",
    "Three of the F's hide inside the word 'OF' — easy to miss.",
    "Click 6.",
  ],
  14: [
    "The instruction is mirror-flipped. Read backwards it says 'CLICK THE THIRD BOX'.",
    "Click box number 3.",
  ],
  15: [
    "Every EXIT / SUBMIT / DOOR inside the frame is a decoy.",
    "The real EXIT button is OUTSIDE the box, in the right-hand margin.",
    "Click the EXIT in the margin (the arrow points to it).",
  ],
  16: [
    "The question gives no information — but the Exam Guide's speech does.",
    "It quietly tells you to pick BLUE.",
    "Click the blue button.",
  ],
  17: [
    "Do NOT press START — clicking anything costs a life and resets the clock.",
    "Just wait. Let the countdown reach zero and you pass.",
  ],
  18: [
    "Read the fine print: all values are in base 2.",
    "In binary, 1 + 1 = 10.",
    "Click 10.",
  ],
  19: [
    "O T T F F S S are the first letters of One, Two, Three, Four, Five, Six, Seven.",
    "Next is Eight → E.",
    "Click E.",
  ],
  20: [
    "YES and NO both cost a life.",
    "Click the flickering red ⛔ OVERRIDE button in the bottom-right corner.",
  ],
  21: [
    "Hold your left mouse button DOWN on Frodrick's giant right paddle to freeze it.",
    "While it is frozen (turns red), serve with SPACE and score 3 points.",
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
    "The answer is 30  (15 + 15 = 30).",
    "Every other button on the screen is a decoy that costs a life.",
  ],
  25: [
    "Three mode-toggle gates block the unique solution path — toggling is REQUIRED, not optional.",
    "Open the pause menu and toggle dark/light at least once to reveal the in-maze ◐ TOGGLE button.",
    "Player starts in dark.  Sequence: dark → switch to light at gate 1 → switch back to dark at gate 2 → switch to light at gate 3.",
    "Bottom of the maze is a sealed wall — there is no walking around the outside.",
  ],
  26: [
    "There is no trick here — just click the cookie 100 times to advance.",
    "Each click is real.  Hold up your mouse and pace yourself.",
  ],
  27: [
    "Every answer button (including KEYBOARD) is a decoy that costs a life.",
    "The riddle's answer is KEYBOARD — give it using the answer.",
    "Type the letters K-E-Y-B-O-A-R-D on your physical keyboard.",
  ],
  28: [
    "Boss battle vs FRODRICK.EXE.  A/D or arrows to move, SPACE to fire.",
    "Boss has 110 HP (22 hits).  Three phases: green (calm), yellow (triple shot), red (5-way fan).",
    "Player has standard 3 lives — ~0.4s i-frames after each hit, so back-to-back hits hurt.",
    "Strategy: stay mobile under the boss, fire continuously, stop when bullets cluster overhead.",
  ],
  29: [
    "Order of operations: multiplication before addition.",
    "2 + (2 × 2) = 6.  Click 6.",
  ],
  30: [
    "Callback to Question 16, where the Guide told you to pick BLUE.",
    "The answer is BLUE.  Click the blue button.",
  ],
  31: [
    "The instruction is hidden — invisible in dark mode.",
    "Click 'SWITCH TO LIGHT' to reveal it: it says PICK THE THIRD BUTTON.",
    "Click button 3.",
  ],
  32: [
    "The dial is labelled MAX 10, but the track secretly goes one notch further.",
    "Click and drag the knob all the way to the right end — to 11.",
  ],
  33: [
    "One word in the paragraph is misspelled.",
    "Click the word 'recieve' (it should be receive).",
  ],
  34: [
    "Among the grid of letter O's, exactly one is a zero (0).",
    "Click the 0.  Its position is random each attempt.",
  ],
  35: [
    "Watch the four panels flash a sequence, then click them back in that order.",
    "A wrong click costs a life and restarts the sequence.",
  ],
  36: [
    "The exam pre-selects 54 and labels it RECOMMENDED — it is wrong.",
    "7 × 8 = 56.  Click 56, then click CONFIRM SELECTION.",
  ],
  37: [
    "Count every square, not just the small ones.",
    "9 small + 4 (2×2 blocks) + 1 (whole 3×3) = 14.  Click 14.",
  ],
  38: [
    "The arrow turns 90° clockwise each step: → ↓ ← ?",
    "Next is ↑.  Click the up arrow.",
  ],
  39: [
    "Each click flips that panel AND its neighbours.",
    "Clicking all four panels (in any order) turns them all on.",
  ],
  40: [
    "A single click does nothing here.",
    "Press and HOLD the mouse button on HOLD TO REBOOT until the bar fills (~2s).",
  ],
  41: [
    "Unscramble D L R O W.",
    "The only real word is WORLD.  Click WORLD.",
  ],
  42: [
    "You can only subtract 5 from 25 ONCE — after that you're subtracting from 20.",
    "The answer is 1.  Click 1.",
  ],
  43: [
    "Compare the two grids. One tile on the RIGHT grid is a different colour.",
    "Click that tile.  Its position is random each attempt.",
  ],
  44: [
    "Ada was in a meeting; Ben was abroad. Only Cleo had the opportunity.",
    "Click CLEO.",
  ],
  45: [
    "The SUBMIT button flees your cursor.",
    "Herd it into a corner where it can't escape, then click it.",
  ],
  46: [
    "Callback to Question 11, where a word was hidden in the fine print.",
    "The answer is PINEAPPLE.",
  ],
  47: [
    "Müller-Lyer illusion: the arrow-fins fool your eye.",
    "Both lines are exactly the same length.  Click SAME.",
  ],
  48: [
    "There is no fair answer — YES / NO / MAYBE / 42 all cost a life.",
    "Click the red ⛔ CHEAT button.",
  ],
  49: [
    "Set the three dials to the code 6 - 1 - 2, then click SUBMIT.",
    "(F's on Q13 = 6, subtract 5 from 25 = 1, digits in binary '10' = 2.)",
  ],
  50: [
    "The question is: What is your name?",
    "Type exactly the name you entered at the start of the exam.",
    "Even 'Box' works if that is what you entered.",
  ],
};

export const drawCheatsOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const lvl = state.currentLevel;
  const t = getTheme(state);
  const isMovement = false;   // 11–20 are now normal bespoke levels

  // ── Bounding box for the popup ─────────────────────────────────────────────
  let ox: number, oy: number, ow: number, oh: number;
  if (isMovement) {
    const ml = getMovementLayout(ctx);
    ox = ml.gameFrameX + ml.gameFrameWidth * 0.05;
    oy = ml.gameFrameY + ml.gameFrameHeight * 0.06;
    ow = ml.gameFrameWidth * 0.9;
    oh = ml.gameFrameHeight * 0.52;
  } else {
    const { topBoxX, topBoxY, topBoxWidth, topBoxHeight } = getLayout(ctx);
    ox = topBoxX + topBoxWidth * 0.05;
    oy = topBoxY + topBoxHeight * 0.05;
    ow = topBoxWidth * 0.9;
    oh = topBoxHeight * 0.88;
  }

  const cx = ox + ow / 2;
  const hints = HINTS[lvl] ?? ["No hint available for this level."];

  // ── Clear hit areas so the popup is fully modal ────────────────────────────
  gc.hitAreas = [];

  // ── Backdrop ───────────────────────────────────────────────────────────────
  ctx.fillStyle = state.darkMode
    ? "rgba(8,6,0,0.96)"
    : "rgba(248,242,210,0.97)";
  ctx.fillRect(ox, oy, ow, oh);
  ctx.strokeStyle = "#d4b820";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(ox, oy, ow, oh);

  // ── Title ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#d4b820";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 17px ${displayFont}`;
  ctx.fillText(`CHEATS  —  LEVEL ${lvl}`, cx, oy + oh * 0.06);

  // ── Divider ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(212,184,32,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox + ow * 0.06, oy + oh * 0.2);
  ctx.lineTo(ox + ow * 0.94, oy + oh * 0.2);
  ctx.stroke();

  // ── Hint lines ─────────────────────────────────────────────────────────────
  const lineH = isMovement ? 22 : 26;
  const startY = oy + oh * 0.26;
  ctx.fillStyle = t.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `15px ${bodyFont}`;
  hints.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineH, ow * 0.88);
  });

  // ── Close button ───────────────────────────────────────────────────────────
  const btnW = 110;
  const btnH = 32;
  const btnX = cx - btnW / 2;
  const btnY = oy + oh - btnH - oh * 0.06;

  const hover =
    gc.mouseX >= btnX &&
    gc.mouseX <= btnX + btnW &&
    gc.mouseY >= btnY &&
    gc.mouseY <= btnY + btnH;

  ctx.fillStyle = hover ? "#f0cc28" : "#d4b820";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = "#7a6400";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.fillStyle = "#1a1200";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold 13px ${displayFont}`;
  ctx.fillText("CLOSE", btnX + btnW / 2, btnY + btnH / 2);

  gc.hitAreas.push({
    x: btnX,
    y: btnY,
    w: btnW,
    h: btnH,
    action: () => {
      state.cheatsPopupOpen = false;
      gc.render();
    },
  });
};
