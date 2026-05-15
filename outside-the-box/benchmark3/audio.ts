type SoundKey = "bgmMovement" | "bgmLevel4" | "bgmLevel6" | "bgmLevel8" | "bgmLevel21" | "clickDontClick" | "eraser" | "pongBounce" | "mazeOof" | "allOfTheLights" | "boom" | "correctAnswer" | "wrongAnswer" | "dash" | "typing";

type SoundPlayOptions = {
  loop?: boolean;
  volume?: number;
  restart?: boolean;
  startTime?: number;   // seconds offset into the file to begin playback
};

const SOUND_PATHS: Record<SoundKey, string> = {
  bgmMovement:    "./assets/sounds/BGM1_FROM_PIXABAY.mp3",
  bgmLevel4:      "./assets/sounds/level4.mp3",
  bgmLevel6:      "./assets/sounds/pongEasyBGMusic.mp3",
  bgmLevel8:      "./assets/sounds/crying.mp3",
  bgmLevel21:     "./assets/sounds/pongBGMusicHard.mp3",
  clickDontClick: "./assets/sounds/clickDontClickSoundEffect.mp3",
  eraser:         "./assets/sounds/eraser.mp3",
  pongBounce:     "./assets/sounds/pongBallBounce.mp3",
  mazeOof:        "./assets/sounds/mazeOof.mp3",
  allOfTheLights: "./assets/sounds/allOfTheLights.mp3",
  boom:           "./assets/sounds/boom.wav",
  correctAnswer:  "./assets/sounds/correctAnswer.wav",
  wrongAnswer:    "./assets/sounds/wrongAnswer.wav",
  dash:           "./assets/sounds/dash.wav",
  typing:         "./assets/sounds/typing.mp3",
};

export class SoundManager {
  private readonly loopedAudio = new Map<SoundKey, HTMLAudioElement>();
  // Tracks the pending play() promise so stop() can chain after it
  private readonly pendingPlays = new Map<SoundKey, Promise<void>>();
  // Browser autoplay policy: no audio may attempt to play before the first
  // user gesture, otherwise the tab gets flagged and the user has to click
  // the tab's audio indicator to re-enable sound.
  private unlocked = false;

  public unlock() {
    this.unlocked = true;
  }

  public play(key: SoundKey, options: SoundPlayOptions = {}) {
    if (!this.unlocked) return;
    const { loop = false, volume = 1, restart = true, startTime } = options;
    const source = SOUND_PATHS[key];

    if (loop) {
      const existing = this.loopedAudio.get(key) ?? new Audio(source);
      existing.loop = true;
      existing.volume = volume;
      if (restart) {
        existing.currentTime = startTime ?? 0;
      }

      this.loopedAudio.set(key, existing);
      if (existing.paused) {
        const p = existing.play().catch(() => {}) as Promise<void>;
        this.pendingPlays.set(key, p);
      }
      return;
    }

    // One-shot
    const audio = new Audio(source);
    audio.volume = volume;
    audio.currentTime = startTime ?? 0;
    void audio.play().catch(() => {});
  }

  public stop(key: SoundKey) {
    const audio = this.loopedAudio.get(key);
    if (!audio) {
      return;
    }

    const doStop = () => {
      audio.pause();
      audio.currentTime = 0;
    };

    // If a play() promise is still pending, chain the pause after it resolves.
    // Without this, browsers can resume playback once the pending promise settles.
    const pending = this.pendingPlays.get(key);
    if (pending) {
      void pending.then(doStop).catch(() => {});
      this.pendingPlays.delete(key);
    } else {
      doStop();
    }
  }
}
