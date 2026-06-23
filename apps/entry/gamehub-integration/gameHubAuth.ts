import { AuthToken, GameHubUser, GameResult, GameStats } from './types';

const GAMEHUB_URL = 'https://big-slick-games-hub-ctb3.bolt.host';

// Parse authentication token from URL
export const parseAuthTokenFromUrl = (): AuthToken | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('authToken');
  
  if (!authToken) return null;
  
  try {
    return JSON.parse(atob(authToken));
  } catch (error) {
    console.error('Failed to parse auth token:', error);
    return null;
  }
};

// Validate token age (max 5 minutes)
export const isTokenValid = (token: AuthToken): boolean => {
  const tokenAge = Date.now() - token.timestamp;
  return tokenAge <= 5 * 60 * 1000; // 5 minutes
};

// Convert auth token to user object
export const tokenToUser = (token: AuthToken): GameHubUser => {
  return {
    id: `user_${token.email}`, // Generate consistent ID
    email: token.email,
    username: token.username,
    chips: token.chips,
    level: token.level || 1,
    experience: token.experience || 0,
    country: token.country,
    created_at: new Date().toISOString()
  };
};

// Redirect to GameHub for authentication
export const redirectToGameHub = (gameId: string) => {
  const returnUrl = encodeURIComponent(window.location.origin);
  window.location.href = `${GAMEHUB_URL}?game=${gameId}&return=${returnUrl}`;
};

// Report game result back to GameHub (mock implementation)
export const reportGameResult = async (
  userEmail: string,
  gameId: string,
  result: GameResult,
  stats: GameStats
): Promise<boolean> => {
  try {
    // In a real implementation, this would call the GameHub API
    console.log('🎮 Game Result Reported:', {
      user: userEmail,
      game: gameId,
      result,
      stats
    });
    
    // Store locally for now
    const gameResults = JSON.parse(localStorage.getItem('gameResults') || '[]');
    gameResults.push({
      userEmail,
      gameId,
      result,
      stats,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('gameResults', JSON.stringify(gameResults));
    
    return true;
  } catch (error) {
    console.error('Failed to report game result:', error);
    return false;
  }
};

// Sync chips with GameHub (mock implementation)
export const syncChipsWithGameHub = async (
  userEmail: string,
  newChipAmount: number
): Promise<boolean> => {
  try {
    // In a real implementation, this would update the GameHub database
    console.log('💰 Chips Synced:', {
      user: userEmail,
      chips: newChipAmount
    });
    
    // Store locally for now
    localStorage.setItem(`chips_${userEmail}`, newChipAmount.toString());
    
    return true;
  } catch (error) {
    console.error('Failed to sync chips:', error);
    return false;
  }
};