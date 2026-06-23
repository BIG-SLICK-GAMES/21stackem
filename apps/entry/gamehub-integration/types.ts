export interface GameHubUser {
  id: string;
  email: string;
  username: string;
  chips: number;
  level: number;
  experience: number;
  country?: string;
  created_at: string;
}

export interface AuthToken {
  email: string;
  username: string;
  chips: number;
  level: number;
  experience?: number;
  country?: string;
  app: string;
  timestamp: number;
}

export interface GameResult {
  gameType: string;
  chipsWon: number;
  chipsBet: number;
  duration?: number;
  resultType: 'win' | 'loss' | 'draw';
  gameData?: any;
}

export interface GameStats {
  games_played?: number;
  games_won?: number;
  experience_gained?: number;
  highest_score?: number;
  [key: string]: any;
}

export interface GameHubContextType {
  user: GameHubUser | null;
  chips: number;
  isAuthenticated: boolean;
  loading: boolean;
  updateChips: (newAmount: number) => void;
  reportGameResult: (result: GameResult) => Promise<boolean>;
  syncWithGameHub: () => Promise<void>;
}