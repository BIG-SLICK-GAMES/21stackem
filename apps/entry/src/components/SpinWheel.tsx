import React, { useState, useRef } from 'react';
import { X, RotateCcw, Gift } from 'lucide-react';

interface SpinWheelProps {
  onClose: () => void;
  onSpinComplete: (prize: string) => void;
}

const wheelPrizes = [
  { label: '100 Chips', value: 100, color: '#ef4444', type: 'chips' },
  { label: '500 Chips', value: 500, color: '#f97316', type: 'chips' },
  { label: '1000 Chips', value: 1000, color: '#eab308', type: 'chips' },
  { label: '2500 Chips', value: 2500, color: '#22c55e', type: 'chips' },
  { label: '5000 Chips', value: 5000, color: '#3b82f6', type: 'chips' },
  { label: 'Free Spin', value: 0, color: '#8b5cf6', type: 'spin' },
  { label: '10000 Chips', value: 10000, color: '#ec4899', type: 'chips' },
  { label: 'Bonus XP', value: 1000, color: '#06b6d4', type: 'xp' }
];

export default function SpinWheel({ onClose, onSpinComplete }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setPrize(null);

    // Generate random rotation (multiple full rotations + random position)
    const spins = 5 + Math.random() * 5; // 5-10 full rotations
    const finalRotation = spins * 360 + Math.random() * 360;
    
    setRotation(prev => prev + finalRotation);

    // Calculate which prize was won
    setTimeout(() => {
      const normalizedRotation = finalRotation % 360;
      const prizeIndex = Math.floor(((360 - normalizedRotation) / 360) * wheelPrizes.length);
      const wonPrize = wheelPrizes[prizeIndex];
      
      setPrize(wonPrize.label);
      setIsSpinning(false);
      
      // Call completion callback after showing result
      setTimeout(() => {
        onSpinComplete(wonPrize.label);
      }, 2000);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full text-center relative shadow-2xl shadow-purple-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Spin the Wheel!</h2>
          <p className="text-gray-400">Test your luck and win amazing prizes!</p>
        </div>

        <div className="relative mb-8">
          {/* Wheel Container */}
          <div className="relative w-80 h-80 mx-auto">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-4 border-white shadow-2xl relative overflow-hidden transition-transform duration-3000 ease-out"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${wheelPrizes.map((prize, index) => 
                  `${prize.color} ${(index / wheelPrizes.length) * 360}deg ${((index + 1) / wheelPrizes.length) * 360}deg`
                ).join(', ')})`
              }}
            >
              {/* Prize Labels */}
              {wheelPrizes.map((prize, index) => {
                const angle = (index / wheelPrizes.length) * 360;
                const midAngle = angle + (360 / wheelPrizes.length) / 2;
                
                return (
                  <div
                    key={index}
                    className="absolute w-full h-full"
                    style={{
                      transform: `rotate(${midAngle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div 
                      className="absolute top-8 left-1/2 transform -translate-x-1/2 text-white font-bold text-xs whitespace-nowrap"
                      style={{ 
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        transform: `translateX(-50%) rotate(${-midAngle}deg)`
                      }}
                    >
                      {prize.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {prize && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg p-6 mb-6 shadow-lg shadow-purple-500/20">
            <h3 className="text-2xl font-bold text-white mb-2">🎉 Congratulations!</h3>
            <p className="text-purple-400 text-xl font-semibold">You won: {prize}</p>
          </div>
        )}

        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30 ${
            isSpinning ? 'animate-pulse' : ''
          }`}
        >
          {isSpinning ? (
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 animate-spin" />
              <span>Spinning...</span>
            </div>
          ) : (
            'SPIN THE WHEEL!'
          )}
        </button>

        <p className="text-gray-400 text-sm mt-4">
          Cost: 100 Mission Points
        </p>
      </div>
    </div>
  );
}