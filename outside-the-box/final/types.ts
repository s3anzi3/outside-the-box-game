import { SoundManager } from './audio';
export { SoundManager };

export type GameScreen = "intro" | "mainmenu" | "levelselect" | "level";

export interface GameState {
  currentScreen: GameScreen;
  currentLevel: number;
  lives: number;
  paused: boolean;
  controlsOpen: boolean;
  darkMode: boolean;
  storyTitle: string;
  storyLines: string[];
  playerName: string;
  nameInput: string;
  nameFocused: boolean;
  pauseCheatInput: string;
  pauseCheatFocused: boolean;
  playMode: "play" | "levelselect";
  gameOver: boolean;
  levelTimerEnd: number;   // ms timestamp; 0 = no active timer
  skips: number;
  levelSubPhase: string;   // reusable per-level sub-state, reset to "" on level change
  guideTarget:  string;    // joined lines — used to detect text changes
  guideReveal:  number;    // characters revealed by the typewriter
  guideCursor:  boolean;   // blinking cursor visibility
  movementIntroSeen: boolean;  // true after the level 11-20 intro popup is dismissed
  level21IntroSeen:  boolean;  // true after the level 21 return popup is dismissed
  cheatsEnabled:     boolean;  // true when player name is "380TA"
  cheatsPopupOpen:   boolean;  // true when the cheats popup is visible
  examStartTime:     number;   // performance.now() timestamp when exam began; 0 = not running
  examFinalMs:       number;   // elapsed ms at the moment level 30 was completed; 0 = not yet
}

export interface HitArea {
  x: number;
  y: number;
  w: number;
  h: number;
  action: () => void;
  noCursor?: boolean;   // if true, hovering won't change the cursor to pointer
}

export interface BlockEntity {
  x: number;
  y: number;
  size: number;
  value: string;
  type: string;
  held: boolean;
  destroyed: boolean;
  draw: (ctx: CanvasRenderingContext2D) => void;
  collidesWithRect: (x: number, y: number, width: number, height: number) => boolean;
  moveTo: (x: number, y: number) => void;
  setHeld: (held: boolean) => void;
  destroy: () => void;
  update: (deltaSeconds: number, blocks: BlockEntity[]) => void;
  canBePickedUp: () => boolean;
  onPickedUp: () => boolean;
  onReleased: () => void;
  getMoveSpeedMultiplier: () => number;
}

export interface AnswerSlotEntity {
  x: number;
  y: number;
  size: number;
  block: BlockEntity | null;
}

export interface PlayerEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  setBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
  setBlocks: (blocks: BlockEntity[]) => void;
  setAnswerSlots: (slots: AnswerSlotEntity[]) => void;
  resetPosition: (x: number, y: number) => void;
  getFacingDirection: () => "up" | "down" | "left" | "right";
}

export interface MovementArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameContext {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  hitAreas: HitArea[];
  render: () => void;
  loseLife: () => void;
  resetPlayerName: () => void;
  resetMovementLevel: () => void;
  submitMovementAnswer: () => void;
  submitPauseCheat: () => void;
  getCurrentAnswer: () => string;
  getAnswerPreview: () => string;
  displayFont: string;
  bodyFont: string;
  logo: HTMLImageElement;
  gameplayFrame: HTMLImageElement;
  pauseButton: HTMLImageElement;
  levelSelectImg: HTMLImageElement;
  startExamImg: HTMLImageElement;
  controlsImg: HTMLImageElement;
  resumeImg: HTMLImageElement;
  quitExamImg: HTMLImageElement;
  lightModeImg: HTMLImageElement;
  darkModeImg: HTMLImageElement;
  levelBGImg: HTMLImageElement;
  bannerImg: HTMLImageElement;
  longBlankButtonImg: HTMLImageElement;
  acceptImg: HTMLImageElement;
  declineImg: HTMLImageElement;
  heartImg: HTMLImageElement;
  lostHeartImg: HTMLImageElement;
  backImg: HTMLImageElement;
  beggarImg: HTMLImageElement;
  tutorialBackgroundImg: HTMLImageElement;
  playerDownImg: HTMLImageElement;
  playerUpImg: HTMLImageElement;
  playerLeftImg: HTMLImageElement;
  playerRightImg: HTMLImageElement;
  logoLoaded: boolean;
  gameplayFrameLoaded: boolean;
  pauseButtonLoaded: boolean;
  levelSelectLoaded: boolean;
  startExamLoaded: boolean;
  controlsLoaded: boolean;
  resumeLoaded: boolean;
  quitExamLoaded: boolean;
  lightModeLoaded: boolean;
  darkModeLoaded: boolean;
  levelBGLoaded: boolean;
  bannerLoaded: boolean;
  longBlankButtonLoaded: boolean;
  acceptLoaded: boolean;
  declineLoaded: boolean;
  heartLoaded: boolean;
  lostHeartLoaded: boolean;
  backLoaded: boolean;
  beggarLoaded: boolean;
  tutorialBackgroundLoaded: boolean;
  playerDownLoaded: boolean;
  playerUpLoaded: boolean;
  playerLeftLoaded: boolean;
  playerRightLoaded: boolean;
  guideCharOffsetX: number;
  guideCharOffsetY: number;
  guideCharDir: "up" | "down" | "left" | "right";
  mouseX:          number;
  mouseY:          number;
  mouseDown:       boolean;
  keysDown:        Set<string>;
  wheelDeltaY:     number;
  sounds:          SoundManager;
  player:          PlayerEntity;
  blocks:          BlockEntity[];
  answerSlots:     AnswerSlotEntity[];
  movementArea:    MovementArea;
  quizPrompt:      string;
  quizAnswer:      string;
  timeLeftSeconds: number;
  assetsReady:     boolean;   // false until image assets have finished fetching
  assetProgress:   number;    // 0..1 fraction of image assets loaded
}
