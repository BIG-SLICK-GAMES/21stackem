import React from 'react';
import { useGameHub } from './useGameHub';
import { Coins, Trophy, Star } from 'lucide-react';

// Chip Display Component
export const ChipDisplay: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { chips } = useGameHub();
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Coins className="w-5 h-5 text-yellow-400" />
      <span className="text-yellow-400 font-semibold">
        {chips.toLocaleString()}
      </span>
    </div>
  );
};

// User Profile Component
export const UserProfile: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { user } = useGameHub();
  
  if (!user) return null;
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
        <span className="text-white font-bold">
          {user.username.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <p className="text-white font-medium text-sm">{user.username}</p>
        <p className="text-gray-400 text-xs">Level {user.level}</p>
      </div>
    </div>
  );
};

// Game Result Modal Component
interface GameResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: 'win' | 'loss' | 'draw';
  chipsWon: number;
  message?: string;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  onClose,
  result,
  chipsWon,
  message
}) => {
  if (!isOpen) return null;
  
  const getResultIcon = () => {
    switch (result) {
      case 'win': return <Trophy className="w-12 h-12 text-yellow-400" />;
      case 'loss': return <div className="w-12 h-12 text-red-400 text-4xl">😞</div>;
      case 'draw': return <Star className="w-12 h-12 text-blue-400" />;
    }
  };
  
  const getResultColor = () => {
    switch (result) {
      case 'win': return 'from-green-500/20 to-yellow-500/20 border-green-500/40';
      case 'loss': return 'from-red-500/20 to-red-600/20 border-red-500/40';
      case 'draw': return 'from-blue-500/20 to-purple-500/20 border-blue-500/40';
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gamehub-card p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            {getResultIcon()}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {result === 'win' ? 'You Won!' : result === 'loss' ? 'You Lost!' : 'Draw!'}
          </h2>
          {message && <p className="text-gray-400">{message}</p>}
        </div>

        <div className={`bg-gradient-to-r ${getResultColor()} rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-white">
              {chipsWon >= 0 ? '+' : ''}{chipsWon.toLocaleString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm">Chips {chipsWon >= 0 ? 'Won' : 'Lost'}</p>
        </div>

        <button
          onClick={onClose}
          className="gamehub-button w-full"
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
};

// Loading Spinner Component
export const GameHubSpinner: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full gamehub-spin"></div>
    </div>
  );
};