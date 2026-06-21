export interface TypingSentence {
  id: string;
  kanji: string;      // What is displayed with Kanji (e.g. 「一期一会」)
  kana: string;       // Hiragana guide (e.g. 「いちごいちえ」)
  romaji: string;     // Targets to be typed by the player (e.g. 「ichigoichie」)
  meaning?: string;   // Context/translation
}

export interface TypingCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sentences: TypingSentence[];
}

export interface KeyboardState {
  pressedKeys: Record<string, boolean>;
}

export interface ScoreRecord {
  id: string;
  categoryName: string;
  kpm: number;        // Keystrokes Per Minute
  accuracy: number;   // Percentage
  correctKeys: number;
  missedKeys: number;
  timestamp: string;
  isSushiMode?: boolean;
  sushiEarnedYen?: number;
  sushiCourseCost?: number;
}

export interface GameSettings {
  showHiraganaGuide: boolean;
  soundEnabled: boolean;
  currentCategoryId: string;
  fontSizeMultiplier: number; // 1, 1.25, 1.5, etc.
}

export interface SessionConfigGoal {
  kpmEnabled: boolean;
  kpmValue: number;
  accuracyEnabled: boolean;
  accuracyValue: number;
  streakEnabled: boolean;
  streakValue: number;
}

export interface SessionGoalProgress {
  kpmAchieved: boolean;
  accuracyAchieved: boolean;
  streakAchieved: boolean;
}

