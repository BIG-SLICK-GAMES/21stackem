import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GameHubContextType, 
  GameHubUser, 
  GameResult,
  AuthToken 
} from './types';
import { 
  parseAuthTokenFromUrl, 
  isTokenValid, 
  tokenToUser, 
  redirectToGameHub,
  reportGameResult as reportToGameHub,
  syncChipsWithGameHub
} from './gameHubAuth';

const GameHubContext = createContext<GameHubContextType | undefined>(undefined);

interface GameHubProviderProps {
  children: ReactNode;
  gameId: string;
}

export const GameHubProvider: React.FC<GameHubProviderProps> = ({ children, gameId }) => {
  const [user, setUser] = useState<GameHubUser | null>(null);
  const [chips, setChips] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [gameId]);

  const initializeAuth = async () => {
    try {
      const authToken = parseAuthTokenFromUrl();
      
      if (!authToken) {
        console.log('No auth token found, redirecting to GameHub...');
        redirectToGameHub(gameId);
        return;
      }
      
      if (!isTokenValid(authToken)) {
        console.log('Auth token expired, redirecting to GameHub...');
        redirectToGameHub(gameId);
        return;
      }
      
      const userData = tokenToUser(authToken);
      setUser(userData);
      setChips(userData.chips);
      
      console.log('✅ User authenticated:', userData.username);
    } catch (error) {
      console.error('Authentication failed:', error);
      redirectToGameHub(gameId);
    } finally {
      setLoading(false);
    }
  };

  const updateChips = (newAmount: number) => {
    setChips(newAmount);
    if (user) {
      syncChipsWithGameHub(user.email, newAmount);
    }
  };

  const reportGameResult = async (result: GameResult): Promise<boolean> => {
    if (!user) return false;
    
    const stats = {
      games_played: 1,
      games_won: result.resultType === 'win' ? 1 : 0,
      experience_gained: result.resultType === 'win' ? 50 : 10
    };
    
    // Update local chips
    const newChips = chips + result.chipsWon;
    updateChips(newChips);
    
    // Report to GameHub
    return await reportToGameHub(user.email, gameId, result, stats);
  };

  const syncWithGameHub = async () => {
    if (user) {
      await syncChipsWithGameHub(user.email, chips);
    }
  };

  const contextValue: GameHubContextType = {
    user,
    chips,
    isAuthenticated: !!user,
    loading,
    updateChips,
    reportGameResult,
    syncWithGameHub
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">GH</span>
          </div>
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Connecting to GameHub...</p>
        </div>
      </div>
    );
  }

  return (
    <GameHubContext.Provider value={contextValue}>
      {children}
    </GameHubContext.Provider>
  );
};

export const useGameHub = (): GameHubContextType => {
  const context = useContext(GameHubContext);
  if (context === undefined) {
    throw new Error('useGameHub must be used within a GameHubProvider');
  }
  return context;
};