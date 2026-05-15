console.log("BENCHMARK 3 MAIN LOADED");

import { GameContext, GameState, MovementArea } from "./types";
import { drawBackground, drawLogo, drawGameplayFrame, drawBottomPanel, drawCheatsButton, drawExamTimer } from "./renderer";
import { drawCheatsOverlay } from "./overlays/CheatsOverlay";
import { LEVEL_DATA } from "./levelData";
import { drawMainMenu } from "./screens/MainMenu";
import { drawLevelSelect, drawLevelSelectBackButton } from "./screens/LevelSelect";
import { drawLevel } from "./screens/Level";
import { drawPauseOverlay } from "./overlays/PauseOverlay";
import { drawControlsOverlay } from "./overlays/ControlsOverlay";
import { drawGameOverOverlay } from "./overlays/GameOverOverlay";
import { getLayout, getMovementLayout } from "./layout";
import { SoundManager } from "./audio";

import { EventEmitter } from "./Helpers/Events/EventEmitter";
import { InputManager } from "./Helpers/InputManager";
import { PlayerControl } from "./Helpers/PlayerControl";
import { NormalBlock } from "./Helpers/objects/NormalBlock";
import { InvisibleBlock } from "./Helpers/objects/InvisibleBlock";
import { CountdownNumberBlock } from "./Helpers/objects/CountdownNumberBlock";
import { HeavyBlock } from "./Helpers/objects/HeavyBlock";
import { GlassBlock } from "./Helpers/objects/GlassBlock";
import { Block } from "./Helpers/objects/Block";
import { MOVEMENT_LEVEL_CONFIG } from "./movementLevelConfig";

window.onload = () => {
  const gameCanvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
  const debugCanvas = document.getElementById("debug-canvas") as HTMLCanvasElement | null;
  const textCanvas = document.getElementById("text-canvas") as HTMLCanvasElement | null;

  if (!gameCanvas || !debugCanvas || !textCanvas) {
    console.error("Missing one or more canvas elements.");
    return;
  }

  const ctx = gameCanvas.getContext("2d");
  if (!ctx) {
    console.error("Could not get 2D context.");
    return;
  }

  const state: GameState = {
    currentScreen: "mainmenu",
    currentLevel: 1,
    lives: 3,
    paused: false,
    controlsOpen: false,
    darkMode: true,
    storyTitle: "Exam Briefing",
    storyLines: [
      "Welcome, candidate. I will be guiding you through the \"Outside-the-Box\" assessment.",
      "This exam will test your critical thinking and problem solving capabilities.",
      "If you are to pass the exam, you will get an OtB Thinking Certificate to brag about on your resume!",
    ],
    playerName: "Box",
    nameInput: "",
    nameFocused: false,
    playMode: "play",
    gameOver: false,
    levelTimerEnd: 0,
    skips: 0,
    levelSubPhase: "",
    guideTarget: "",
    guideReveal: 0,
    guideCursor: false,
    movementIntroSeen: false,
    level21IntroSeen:  false,
    cheatsEnabled:     false,
    cheatsPopupOpen:   false,
    examStartTime:     0,
    examFinalMs:       0,
  };

  const emitter = new EventEmitter();
  const input = new InputManager(emitter);
  const player = new PlayerControl(emitter);
  let previousLevel = state.currentLevel;
  let previousScreen = state.currentScreen;
  let needsMovementReset = false;
  let flashOpacity = 0;
  let lastTimerTick = performance.now();
  let lastFrameTick = performance.now();

  const defaultMovementArea: MovementArea = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  const gc: GameContext = {
    ctx,
    state,
    hitAreas: [],
    render: () => {},
    loseLife: () => {},
    resetPlayerName: () => {},
    resetMovementLevel: () => {},
    submitMovementAnswer: () => {},
    getCurrentAnswer: () => "",
    getAnswerPreview: () => "",
    displayFont: `"Trebuchet MS", "Verdana", sans-serif`,
    bodyFont: `"Trebuchet MS", "Arial", sans-serif`,
    logo: new Image(),
    gameplayFrame: new Image(),
    pauseButton: new Image(),
    levelSelectImg: new Image(),
    startExamImg: new Image(),
    controlsImg: new Image(),
    resumeImg: new Image(),
    quitExamImg: new Image(),
    lightModeImg: new Image(),
    darkModeImg: new Image(),
    levelBGImg: new Image(),
    bannerImg: new Image(),
    longBlankButtonImg: new Image(),
    acceptImg: new Image(),
    declineImg: new Image(),
    heartImg: new Image(),
    lostHeartImg: new Image(),
    backImg: new Image(),
    beggarImg: new Image(),
    playerDownImg: new Image(),
    playerUpImg: new Image(),
    playerLeftImg: new Image(),
    playerRightImg: new Image(),
    logoLoaded: false,
    gameplayFrameLoaded: false,
    pauseButtonLoaded: false,
    levelSelectLoaded: false,
    startExamLoaded: false,
    controlsLoaded: false,
    resumeLoaded: false,
    quitExamLoaded: false,
    lightModeLoaded: false,
    darkModeLoaded: false,
    levelBGLoaded: false,
    bannerLoaded: false,
    longBlankButtonLoaded: false,
    acceptLoaded: false,
    declineLoaded: false,
    heartLoaded: false,
    lostHeartLoaded: false,
    backLoaded: false,
    beggarLoaded: false,
    playerDownLoaded: false,
    playerUpLoaded: false,
    playerLeftLoaded: false,
    playerRightLoaded: false,
    guideCharOffsetX: 0,
    guideCharOffsetY: 0,
    guideCharDir: "down",
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    keysDown: new Set<string>(),
    wheelDeltaY: 0,
    sounds: new SoundManager(),
    player,
    blocks: [],
    answerSlots: [],
    movementArea: defaultMovementArea,
    quizPrompt: MOVEMENT_LEVEL_CONFIG[11].prompt,
    quizAnswer: MOVEMENT_LEVEL_CONFIG[11].answer,
    timeLeftSeconds: MOVEMENT_LEVEL_CONFIG[11].time,
  };

  player.setSoundManager(gc.sounds);

  // Unlock audio on the very first user gesture anywhere on the page.
  // Without this, sounds triggered from setInterval/RAF before any click
  // (e.g. the typing sound on the main menu) get blocked by the browser
  // and silently flag the tab as muted.
  const unlockAudio = () => {
    gc.sounds.unlock();
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("touchstart", unlockAudio);

  const isMovementLevel = (level: number) => level >= 11 && level <= 20;

  const resolveGuideLines = (): string[] => {
    if (gc.state.currentScreen === "level") {
      return LEVEL_DATA[gc.state.currentLevel - 1]?.lines ?? [];
    }

    return gc.state.storyLines;
  };

  const syncMovementArea = (resetSlots = false) => {
    const movementLayout = getMovementLayout(ctx);
    const slotGap = 10;
    const slotSize = player.width;
    const answerCount = 10;
    const answerZoneWidth = answerCount * slotSize + (answerCount - 1) * slotGap;
    const answerZoneX = movementLayout.gameFrameX + (movementLayout.gameFrameWidth - answerZoneWidth) / 2;
    const answerZoneY = movementLayout.gameFrameY + 28;
    const previousSlots = gc.answerSlots;

    gc.answerSlots = Array.from({ length: answerCount }, (_, index) => ({
      x: answerZoneX + index * (slotSize + slotGap),
      y: answerZoneY,
      size: slotSize,
      block: resetSlots ? null : previousSlots[index]?.block ?? null,
    }));

    gc.movementArea = {
      x: movementLayout.movementAreaX,
      y: movementLayout.movementAreaY,
      width: movementLayout.movementAreaWidth,
      height: movementLayout.movementAreaHeight,
    };
  };

  const buildMovementBlocks = () => {
    const config = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
    const { x, y, width, height } = gc.movementArea;
    const size = player.width;
    const spawnX = gc.movementArea.x + player.width;
    const spawnY = gc.movementArea.y + gc.movementArea.height / 2 - player.height / 2;
    const occupiedRects: Array<{ x: number; y: number; size: number }> = [
      { x: spawnX, y: spawnY, size: player.width },
    ];
    const randomizePosition = () => {
      const maxAttempts = 80;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidateX = x + Math.random() * Math.max(0, width - size);
        const candidateY = y + Math.random() * Math.max(0, height - size);
        const collides = occupiedRects.some((rect) => (
          candidateX < rect.x + rect.size &&
          candidateX + size > rect.x &&
          candidateY < rect.y + rect.size &&
          candidateY + size > rect.y
        ));

        if (!collides) {
          occupiedRects.push({ x: candidateX, y: candidateY, size });
          return { x: candidateX, y: candidateY };
        }
      }

      const fallbackX = x + Math.random() * Math.max(0, width - size);
      const fallbackY = y + Math.random() * Math.max(0, height - size);
      occupiedRects.push({ x: fallbackX, y: fallbackY, size });
      return { x: fallbackX, y: fallbackY };
    };

    return config.blocks.map((block): Block => {
      const randomizedPosition = randomizePosition();
      const blockX = randomizedPosition.x;
      const blockY = randomizedPosition.y;

      switch (block.type) {
        case "invisible":
          return new InvisibleBlock(blockX, blockY, size, block.value);
        case "countdown":
          return new CountdownNumberBlock(blockX, blockY, size, block.value, gc.sounds);
        case "heavy":
          return new HeavyBlock(blockX, blockY, size, block.value);
        case "glass":
          return new GlassBlock(blockX, blockY, size, block.value);
        case "normal":
        default:
          return new NormalBlock(blockX, blockY, size, block.value);
      }
    });
  };

  const syncMovementScene = (resetScene = false) => {
    const config = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
    gc.quizPrompt = config.prompt;
    gc.quizAnswer = config.answer;
    syncMovementArea(resetScene);

    const minX = gc.movementArea.x;
    const minY = gc.movementArea.y;
    const maxX = gc.movementArea.x + gc.movementArea.width - player.width;
    const maxY = gc.movementArea.y + gc.movementArea.height - player.height;

    player.setBounds(minX, minY, maxX, maxY);
    player.setAnswerSlots(gc.answerSlots);

    if (resetScene) {
      gc.blocks = buildMovementBlocks();
      player.setBlocks(gc.blocks);
      player.resetPosition(
        minX + player.width,
        minY + gc.movementArea.height / 2 - player.height / 2,
      );
      return;
    }

    player.setBlocks(gc.blocks);
  };

  gc.getCurrentAnswer = () => {
    let answer = "";

    for (const slot of gc.answerSlots) {
      if (!slot.block) {
        break;
      }

      answer += slot.block.value;
    }

    return answer;
  };

  gc.getAnswerPreview = () => gc.answerSlots
    .map((slot) => slot.block?.value ?? "_")
    .join("");

  gc.resetPlayerName = () => {
    gc.state.playerName = "Box";
    gc.state.nameInput = "";
    gc.state.nameFocused = false;
    gc.state.levelTimerEnd = 0;
    gc.state.skips = 0;
    gc.state.levelSubPhase = "";
    gc.state.examStartTime = 0;
    gc.state.examFinalMs   = 0;
  };

  gc.loseLife = () => {
    if (gc.state.cheatsEnabled) return;   // infinite lives — swallow the penalty
    gc.state.lives--;
    if (gc.state.lives <= 0) {
      gc.state.lives = 0;
      gc.state.gameOver = true;
    }
    if (!isMovementLevel(gc.state.currentLevel)) {
      gc.sounds.play("boom", { volume: 0.55 });
    }
    flashOpacity = 1;
  };

  gc.submitMovementAnswer = () => {
    const currentAnswer = gc.getCurrentAnswer();
    const config = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
    const answerMode = config.answerMode ?? "fixed";
    const isCorrect = answerMode === "timeLeftFloor"
      ? Number(currentAnswer) === Math.floor(gc.timeLeftSeconds)
      : currentAnswer === gc.quizAnswer;

    if (!isCorrect) {
      gc.sounds.play("wrongAnswer", { volume: 0.55 });
      gc.loseLife();
      needsMovementReset = true;
      gc.timeLeftSeconds = config.time;
      lastTimerTick = performance.now();
      lastFrameTick = performance.now();
      gc.render();
      return;
    }

    gc.sounds.play("correctAnswer", { volume: 0.55 });
    if (gc.state.currentLevel < 20) {
      gc.state.currentLevel++;
      needsMovementReset = true;
      gc.state.levelSubPhase = "";
      gc.state.levelTimerEnd = 0;
      const nextConfig = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
      gc.timeLeftSeconds = nextConfig.time;
      lastTimerTick = performance.now();
      lastFrameTick = performance.now();
      gc.render();
      return;
    }

    gc.state.currentScreen = "levelselect";
    gc.render();
  };

  gc.resetMovementLevel = () => {
    if (!isMovementLevel(gc.state.currentLevel)) {
      return;
    }

    needsMovementReset = true;
    gc.render();
  };

  gc.render = () => {
    gc.hitAreas = [];

    // Activate cheats only while the player's name is the cheat code
    gc.state.cheatsEnabled = gc.state.playerName === "380TA";

    const newTarget = resolveGuideLines().join("\n");
    if (newTarget !== gc.state.guideTarget) {
      gc.state.guideTarget = newTarget;
      gc.state.guideReveal = 0;
      gc.sounds.stop("typing");
    }

    const movementLevelActive = gc.state.currentScreen === "level" && isMovementLevel(gc.state.currentLevel);
    const enteringMovementLevel =
      movementLevelActive && (previousScreen !== "level" || previousLevel !== gc.state.currentLevel);

    // Level 4 BGM — play on level 4, stop everywhere else
    if (gc.state.currentScreen === "level" && gc.state.currentLevel === 4 && !gc.state.paused && !gc.state.gameOver) {
      gc.sounds.play("bgmLevel4", { loop: true, volume: 0.4, restart: false });
    } else {
      gc.sounds.stop("bgmLevel4");
    }

    // Level 6 BGM (pong) — play on level 6, stop everywhere else
    if (gc.state.currentScreen === "level" && gc.state.currentLevel === 6 && !gc.state.paused && !gc.state.gameOver) {
      gc.sounds.play("bgmLevel6", { loop: true, volume: 0.35, restart: false });
    } else {
      gc.sounds.stop("bgmLevel6");
    }

    // Level 8 BGM (crying) — play on level 8, stop everywhere else
    if (gc.state.currentScreen === "level" && gc.state.currentLevel === 8 && !gc.state.paused && !gc.state.gameOver) {
      gc.sounds.play("bgmLevel8", { loop: true, volume: 0.35, restart: false });
    } else {
      gc.sounds.stop("bgmLevel8");
    }

    // Level 21 BGM (hard pong) — play on level 21, stop everywhere else
    if (gc.state.currentScreen === "level" && gc.state.currentLevel === 21 && !gc.state.paused && !gc.state.gameOver) {
      gc.sounds.play("bgmLevel21", { loop: true, volume: 0.35, restart: false });
    } else {
      gc.sounds.stop("bgmLevel21");
    }

    if (movementLevelActive) {
      if (gc.state.movementIntroSeen) {
        gc.sounds.play("bgmMovement", { loop: true, volume: 0.3, restart: false });
      } else {
        gc.sounds.stop("bgmMovement");
      }

      if (enteringMovementLevel) {
        const config = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
        gc.timeLeftSeconds = config.time;
        lastTimerTick = performance.now();
        lastFrameTick = performance.now();
      }

      syncMovementScene(enteringMovementLevel || gc.blocks.length === 0 || needsMovementReset);
      needsMovementReset = false;
    } else {
      gc.sounds.stop("bgmMovement");
      gc.blocks = [];
      gc.answerSlots = [];
      player.setBlocks([]);
      player.setAnswerSlots([]);
      gc.timeLeftSeconds = MOVEMENT_LEVEL_CONFIG[11].time;
      lastTimerTick = performance.now();
      lastFrameTick = performance.now();

      const { movementAreaX, movementAreaY, movementAreaWidth, movementAreaHeight } = getLayout(ctx);
      gc.movementArea = {
        x: movementAreaX,
        y: movementAreaY,
        width: movementAreaWidth,
        height: movementAreaHeight,
      };
    }

    drawBackground(gc);

    if (!movementLevelActive) {
      drawLogo(gc);
      drawGameplayFrame(gc);
    }

    switch (gc.state.currentScreen) {
      case "mainmenu":
        drawMainMenu(gc);
        break;
      case "levelselect":
        drawLevelSelect(gc);
        break;
      case "level":
        drawLevel(gc);
        break;
    }

    drawBottomPanel(gc);

    if (gc.state.currentScreen === "levelselect") {
      drawLevelSelectBackButton(gc);
    }

    const onCertificate = gc.state.currentLevel === 30 &&
      (gc.state.levelSubPhase === 'certificate' || gc.state.levelSubPhase === 'win');

    // Cheats button (above play area, only when cheats active on levels 2-30)
    if (!onCertificate && gc.state.cheatsEnabled && gc.state.currentScreen === "level" &&
        gc.state.currentLevel >= 2 && gc.state.currentLevel <= 30) {
      drawCheatsButton(gc);
    }

    // Exam timer (top-right above play area, play-mode only, levels 2-30)
    if (!onCertificate && gc.state.playMode === "play" && gc.state.examStartTime > 0 &&
        gc.state.currentScreen === "level" &&
        gc.state.currentLevel >= 2 && gc.state.currentLevel <= 30) {
      drawExamTimer(gc);
    }

    // Cheats popup overlay (modal — clears hit areas behind it)
    if (!onCertificate && gc.state.cheatsPopupOpen) {
      drawCheatsOverlay(gc);
    }

    if (!onCertificate && gc.state.paused) {
      drawPauseOverlay(gc);
    }

    if (!onCertificate && gc.state.controlsOpen) {
      drawControlsOverlay(gc);
    }

    if (gc.state.gameOver) {
      drawGameOverOverlay(gc);
    }

    // Red flash overlay on life lost
    if (flashOpacity > 0) {
      ctx.fillStyle = `rgba(220, 30, 30, ${flashOpacity * 0.45})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    previousLevel = gc.state.currentLevel;
    previousScreen = gc.state.currentScreen;
  };

  const resizeCanvases = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    gameCanvas.width = debugCanvas.width = w;
    gameCanvas.height = debugCanvas.height = h;
    needsMovementReset = true;
  };

  const toCanvas = (e: MouseEvent) => {
    const rect = gameCanvas.getBoundingClientRect();
    const scaleX = gameCanvas.width / rect.width;
    const scaleY = gameCanvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  gameCanvas.addEventListener("click", (e) => {
    const { x, y } = toCanvas(e);
    for (const area of gc.hitAreas) {
      if (x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        area.action();
        break;
      }
    }
  });

  gameCanvas.addEventListener("mousemove", (e) => {
    const { x, y } = toCanvas(e);
    gc.mouseX = x;
    gc.mouseY = y;
    const over = gc.hitAreas.some(
      (area) => !area.noCursor && x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h,
    );
    gameCanvas.style.cursor = over ? "pointer" : "default";
    if (gc.mouseDown) {
      gc.render();
    }
  });

  gameCanvas.addEventListener("mousedown", (e) => {
    const { x, y } = toCanvas(e);
    gc.mouseX = x;
    gc.mouseY = y;
    gc.mouseDown = true;
    gc.render();
  });

  gameCanvas.addEventListener("mouseup", () => {
    gc.mouseDown = false;
  });

  gameCanvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    gc.wheelDeltaY = e.deltaY;
    gc.render();
    gc.wheelDeltaY = 0;
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    gc.keysDown.add(e.key);

    if (gc.state.nameFocused && !gc.state.paused && !gc.state.controlsOpen) {
      if (e.key === "Escape") {
        gc.state.nameFocused = false;
        gc.render();
        return;
      }

      if (e.key === "Enter") {
        if (gc.state.currentLevel === 30) {
          // Level 30: check name answer
          const typed   = gc.state.nameInput.trim().toLowerCase();
          const correct = gc.state.playerName.toLowerCase();
          gc.state.nameFocused = false;
          if (typed === correct) {
            gc.state.examFinalMs   = gc.state.examStartTime > 0
              ? performance.now() - gc.state.examStartTime
              : 0;
            gc.state.levelSubPhase = 'win';
          } else {
            gc.loseLife();
            gc.state.nameInput = '';
          }
          gc.render();
          return;
        }
        gc.state.playerName = gc.state.nameInput.trim() || "Box";
        gc.state.nameFocused = false;
        gc.state.currentLevel = 2;
        if (gc.state.playMode === "play" && gc.state.examStartTime === 0) {
          gc.state.examStartTime = performance.now();
        }
        gc.render();
        return;
      }

      if (e.key === "Backspace") {
        gc.state.nameInput = gc.state.nameInput.slice(0, -1);
        gc.render();
        return;
      }

      if (e.key.length === 1 && gc.state.nameInput.length < 24) {
        gc.state.nameInput += e.key;
        gc.render();
        return;
      }

      return;
    }

    if (e.key === "Escape") {
      if (gc.state.controlsOpen) {
        gc.state.controlsOpen = false;
        gc.render();
      } else if (gc.state.paused) {
        gc.state.paused = false;
        gc.render();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    gc.keysDown.delete(e.key);
  });

  window.addEventListener("resize", () => {
    resizeCanvases();
    gc.render();
  });

  setInterval(() => {
    const totalChars = resolveGuideLines().reduce((sum, line) => sum + line.length, 0);
    if (gc.state.guideReveal < totalChars) {
      gc.state.guideReveal++;
      gc.sounds.play("typing", { loop: true, volume: 0.4, restart: false });
      gc.render();
    } else {
      gc.sounds.stop("typing");
    }
  }, 22);

  setInterval(() => {
    gc.state.guideCursor = !gc.state.guideCursor;
    const totalChars = resolveGuideLines().reduce((sum, line) => sum + line.length, 0);
    if (gc.state.guideReveal >= totalChars || gc.state.nameFocused) {
      gc.render();
    }
  }, 530);

  // Exam timer tick — re-render once per second while the exam clock is running
  setInterval(() => {
    if (gc.state.playMode === "play" && gc.state.examStartTime > 0 &&
        gc.state.currentScreen === "level" &&
        gc.state.currentLevel >= 2 && gc.state.currentLevel <= 30 &&
        !gc.state.paused && !gc.state.gameOver) {
      gc.render();
    }
  }, 1000);

  // Idle animation: occasional glance/step, held naturally, then settle back to forward
  const scheduleGuideStep = () => {
    const delay = 3000 + Math.random() * 4000;
    setTimeout(() => {
      const dirs: Array<"up" | "down" | "left" | "right"> = ["up", "down", "left", "right"];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const dist = 5;
      gc.guideCharDir = dir;
      gc.guideCharOffsetX = dir === "left" ? -dist : dir === "right" ? dist : 0;
      gc.guideCharOffsetY = dir === "up" ? -dist : dir === "down" ? dist : 0;
      gc.render();
      // Horizontal glances hold longer to feel like a real look; vertical is quicker
      const holdTime = (dir === "left" || dir === "right")
        ? 1800 + Math.random() * 1400
        : 600  + Math.random() * 500;
      setTimeout(() => {
        gc.guideCharDir = "down";
        gc.guideCharOffsetX = 0;
        gc.guideCharOffsetY = 0;
        gc.render();
        scheduleGuideStep();
      }, holdTime);
    }, delay);
  };
  scheduleGuideStep();

  gc.logo.onload = () => {
    gc.logoLoaded = true;
    gc.render();
  };
  gc.logo.onerror = () => {
    gc.logoLoaded = false;
    gc.render();
  };

  gc.gameplayFrame.onload = () => { gc.gameplayFrameLoaded = true; gc.render(); };
  gc.gameplayFrame.onerror = () => { gc.gameplayFrameLoaded = false; };
  gc.pauseButton.onload = () => { gc.pauseButtonLoaded = true; gc.render(); };
  gc.pauseButton.onerror = () => { gc.pauseButtonLoaded = false; };
  gc.levelSelectImg.onload = () => { gc.levelSelectLoaded = true; gc.render(); };
  gc.levelSelectImg.onerror = () => { gc.levelSelectLoaded = false; };
  gc.startExamImg.onload = () => { gc.startExamLoaded = true; gc.render(); };
  gc.startExamImg.onerror = () => { gc.startExamLoaded = false; };
  gc.controlsImg.onload = () => { gc.controlsLoaded = true; gc.render(); };
  gc.controlsImg.onerror = () => { gc.controlsLoaded = false; };
  gc.resumeImg.onload = () => { gc.resumeLoaded = true; gc.render(); };
  gc.resumeImg.onerror = () => { gc.resumeLoaded = false; };
  gc.quitExamImg.onload = () => { gc.quitExamLoaded = true; gc.render(); };
  gc.quitExamImg.onerror = () => { gc.quitExamLoaded = false; };
  gc.lightModeImg.onload = () => { gc.lightModeLoaded = true; gc.render(); };
  gc.lightModeImg.onerror = () => { gc.lightModeLoaded = false; };
  gc.darkModeImg.onload = () => { gc.darkModeLoaded = true; gc.render(); };
  gc.darkModeImg.onerror = () => { gc.darkModeLoaded = false; };
  gc.levelBGImg.onload = () => { gc.levelBGLoaded = true; gc.render(); };
  gc.levelBGImg.onerror = () => { gc.levelBGLoaded = false; };
  gc.bannerImg.onload = () => { gc.bannerLoaded = true; gc.render(); };
  gc.bannerImg.onerror = () => { gc.bannerLoaded = false; };
  gc.longBlankButtonImg.onload = () => { gc.longBlankButtonLoaded = true; gc.render(); };
  gc.longBlankButtonImg.onerror = () => { gc.longBlankButtonLoaded = false; };
  gc.acceptImg.onload = () => { gc.acceptLoaded = true; gc.render(); };
  gc.acceptImg.onerror = () => { gc.acceptLoaded = false; };
  gc.declineImg.onload = () => { gc.declineLoaded = true; gc.render(); };
  gc.declineImg.onerror = () => { gc.declineLoaded = false; };
  gc.heartImg.onload = () => { gc.heartLoaded = true; gc.render(); };
  gc.heartImg.onerror = () => { gc.heartLoaded = false; };
  gc.lostHeartImg.onload = () => { gc.lostHeartLoaded = true; gc.render(); };
  gc.lostHeartImg.onerror = () => { gc.lostHeartLoaded = false; };
  gc.backImg.onload = () => { gc.backLoaded = true; gc.render(); };
  gc.backImg.onerror = () => { gc.backLoaded = false; };
  gc.beggarImg.onload = () => { gc.beggarLoaded = true; gc.render(); };
  gc.beggarImg.onerror = () => { gc.beggarLoaded = false; };
  gc.playerDownImg.onload = () => { gc.playerDownLoaded = true; gc.render(); };
  gc.playerDownImg.onerror = () => { gc.playerDownLoaded = false; };
  gc.playerUpImg.onload = () => { gc.playerUpLoaded = true; gc.render(); };
  gc.playerUpImg.onerror = () => { gc.playerUpLoaded = false; };
  gc.playerLeftImg.onload = () => { gc.playerLeftLoaded = true; gc.render(); };
  gc.playerLeftImg.onerror = () => { gc.playerLeftLoaded = false; };
  gc.playerRightImg.onload = () => { gc.playerRightLoaded = true; gc.render(); };
  gc.playerRightImg.onerror = () => { gc.playerRightLoaded = false; };

  gc.logo.src = "./assets/Logo.png";
  gc.pauseButton.src = "./assets/buttons/pauseButton.png";
  gc.levelSelectImg.src = "./assets/buttons/levelSelect.png";
  gc.startExamImg.src = "./assets/buttons/startExam.png";
  gc.controlsImg.src = "./assets/buttons/controls.png";
  gc.resumeImg.src = "./assets/buttons/resume.png";
  gc.quitExamImg.src = "./assets/buttons/quitExam.png";
  gc.lightModeImg.src = "./assets/buttons/lightMode.png";
  gc.darkModeImg.src = "./assets/buttons/darkMode.png";
  gc.levelBGImg.src = "./assets/levelBG.png";
  gc.bannerImg.src = "./assets/banner.png";
  gc.longBlankButtonImg.src = "./assets/buttons/longBlankButton.png";
  gc.acceptImg.src = "./assets/buttons/accept.png";
  gc.declineImg.src = "./assets/buttons/decline.png";
  gc.heartImg.src = "./assets/heart.png";
  gc.lostHeartImg.src = "./assets/lostHeart.png";
  gc.backImg.src = "./assets/buttons/back.png";
  gc.beggarImg.src = "./assets/beggar.png";
  gc.playerDownImg.src = "./assets/Player/Player_Down.png";
  gc.playerUpImg.src = "./assets/Player/Player_Up.png";
  gc.playerLeftImg.src = "./assets/Player/Player_Left.png";
  gc.playerRightImg.src = "./assets/Player/Player_Right.png";

  resizeCanvases();
  gc.render();

  const gameLoop = () => {
    const movementLevelActive = gc.state.currentScreen === "level" && isMovementLevel(gc.state.currentLevel);

    if (
      movementLevelActive &&
      !gc.state.paused &&
      !gc.state.controlsOpen &&
      !gc.state.gameOver &&
      gc.state.movementIntroSeen
    ) {
      const now = performance.now();
      const deltaSeconds = Math.max(0, (now - lastFrameTick) / 1000);
      lastFrameTick = now;

      if (now - lastTimerTick >= 1000) {
        const elapsedSeconds = Math.floor((now - lastTimerTick) / 1000);
        gc.timeLeftSeconds = Math.max(0, gc.timeLeftSeconds - elapsedSeconds);
        lastTimerTick += elapsedSeconds * 1000;

        if (gc.timeLeftSeconds === 0) {
          gc.loseLife();
          needsMovementReset = true;
          const config = MOVEMENT_LEVEL_CONFIG[gc.state.currentLevel] ?? MOVEMENT_LEVEL_CONFIG[11];
          gc.timeLeftSeconds = config.time;
          lastTimerTick = performance.now();
          lastFrameTick = performance.now();
        }
      }

      for (const block of gc.blocks) {
        block.update(deltaSeconds, gc.blocks);
      }

      gc.blocks = gc.blocks.filter((block) => !block.destroyed);
      gc.answerSlots = gc.answerSlots.map((slot) => ({
        ...slot,
        block: slot.block && !slot.block.destroyed ? slot.block : null,
      }));

      player.setBlocks(gc.blocks);
      player.setAnswerSlots(gc.answerSlots);
      input.update();
      player.update();
      gc.render();
    } else {
      lastTimerTick = performance.now();
      lastFrameTick = performance.now();
    }

    // Fade out red flash (works on all screens, not just movement levels)
    if (flashOpacity > 0) {
      flashOpacity = Math.max(0, flashOpacity - 0.04);
      gc.render();
    }

    requestAnimationFrame(gameLoop);
  };

  gameLoop();
};
