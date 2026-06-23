import React, { ReactNode } from 'react';
import { useGameHub } from './useGameHub';
import { Coins, User, ArrowLeft } from 'lucide-react';

interface GameHubLayoutProps {
  children: ReactNode;
  gameTitle?: string;
  showBackButton?: boolean;
}

export const GameHubLayout: React.FC<GameHubLayoutProps> = ({ 
  children, 
  gameTitle = "Game",
  showBackButton = true 
}) => {
  const { user, chips } = useGameHub();

  const handleBackToGameHub = () => {
    window.location.href = 'https://big-slick-games-hub-ctb3.bolt.host';
  };

  return (
    <div className="min-h-screen gamehub-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-b border-orange-500/20 shadow-lg shadow-orange-500/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <button
                  onClick={handleBackToGameHub}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                  <span>GameHub</span>
                </button>
              )}
              <h1 className="text-xl font-bold text-white">{gameTitle}</h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Chip Balance */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-2 rounded-full border border-orange-500/40 shadow-lg shadow-orange-500/20">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">
                  {chips.toLocaleString()}
                </span>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-medium text-sm">{user?.username}</p>
                  <p className="text-gray-400 text-xs">Level {user?.level}</p>
                </div>
                
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50">
                  <span className="text-white font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
};