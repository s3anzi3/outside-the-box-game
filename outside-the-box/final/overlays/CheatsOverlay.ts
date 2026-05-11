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
    "Quiz: Spell CAT.",
    "Use WASD to move, H to pick up / drop a block.",
    "Place C, A, T in the answer zone at the top, then click SUBMIT.",
  ],
  12: [
    "Quiz: Spell MAPA.",
    "Two of the four blocks are invisible — walk around to find them.",
    "Pick them up with H and place them in order.",
  ],
  13: [
    "Quiz: Spell BOX.",
    "The B and O blocks are heavy — you move at 25% speed while holding one.",
    "The X block is normal weight.",
  ],
  14: [
    "Quiz: Spell SKY.",
    "All blocks are glass — pick each one up once and place it carefully.",
    "Dropping a glass block and picking it up again destroys it.",
  ],
  15: [
    "Quiz: Spell 123.",
    "There is a hidden invisible '1' block — walk the area to bump into it.",
    "Pick up a countdown block only when it is displaying the digit you need.",
  ],
  16: [
    "Quiz: Spell lIlIlI  (lowercase-L, uppercase-I, alternating).",
    "Two blocks are invisible — explore the whole area to find them.",
  ],
  17: [
    "Quiz: Spell RUN.",
    "The R, U, N blocks are normal weight.  Ignore the countdown block.",
  ],
  18: [
    "Quiz: Spell FOG.",
    "All three letter blocks (F, O, G) are invisible.",
    "Walk every corner of the play area to find them.",
  ],
  19: [
    "Quiz: Spell 908.",
    "Hold the countdown '11' block until it ticks down to show '9'.",
    "Hold the countdown '2' block until it shows '0'.  The '8' block is heavy.",
  ],
  20: [
    "Quiz: Spell MIX.",
    "One block is invisible, one is glass, one is countdown — and there is a heavy decoy.",
    "Use H to pick up blocks; handle the glass block in one trip.",
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
    "The question is: What is your name?",
    "Type exactly the name you entered at the start of the exam.",
    "Even 'Box' works if that is what you entered.",
  ],
};

export const drawCheatsOverlay = (gc: GameContext) => {
  const { ctx, state, displayFont, bodyFont } = gc;
  const lvl = state.currentLevel;
  const t = getTheme(state);
  const isMovement = lvl >= 11 && lvl <= 20;

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
