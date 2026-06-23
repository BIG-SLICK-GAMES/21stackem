// Example usage in your new game project

import React, { useState } from 'react';
import { GameHubProvider } from './gamehub-integration/GameHubProvider';
import { GameHubLayout } from './gamehub-integration/GameHubLayout';
import { useGameHub } from './gamehub-integration/useGameHub';
import { ChipDisplay, GameResultModal } from './gamehub-integration/GameHubComponents';
import './gamehub-integration/gameHubStyles.css';

// Your main game component
function YourGameComponent() {
  const { user, chips, updateChips, reportGameResult } = useGameHub();
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  const handleGameEnd = async (won: boolean, chipsWon: number) => {
    // Report the game result to GameHub
    const result = await reportGameResult({
      gameType: 'your-game-name',
      chipsWon: won ? chipsWon : -chipsWon,
      chipsBet: 100, // Example bet amount
      resultType: won ? 'win' : 'loss',
      gameData: {
        // Any additional game-specific data
        score: 1000,
        level: 5
      }
    });

    if (result) {
      setGameResult({
        result: won ? 'win' : 'loss',
        chipsWon: won ? chipsWon : -chipsWon
      });
      setShowResult(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gamehub-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Your Game</h2>
          <ChipDisplay />
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-gray-300">Welcome, {user?.username}!</p>
          
          {/* Your game UI here */}
          <div className="bg-gray-800/50 rounded-lg p-8 mb-4">
            <p className="text-white mb-4">Game content goes here...</p>
            
            {/* Example game buttons */}
            <div className="space-x-4">
              <button 
                className="gamehub-button"
                onClick={() => handleGameEnd(true, 500)}
              >
                Win Game (+500)
              </button>
              <button 
                className="gamehub-button"
                onClick={() => handleGameEnd(false, 100)}
              >
                Lose Game (-100)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Modal */}
      {gameResult && (
        <GameResultModal
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          result={gameResult.result}
          chipsWon={gameResult.chipsWon}
          message="Great game!"
        />
      )}
    </div>
  );
}

// Your main App component
function App() {
  return (
    <GameHubProvider gameId="your-game-id">
      <GameHubLayout gameTitle="Your Game Name">
        <YourGameComponent />
      </GameHubLayout>
    </GameHubProvider>
  );
}

export default App;