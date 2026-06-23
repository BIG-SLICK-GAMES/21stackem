import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      onComplete();
    }, 3000); // Show for 3 seconds total

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!showSplash) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Inline CSS for border animation */}
      <style>{`
        @keyframes borderGlow {
          0% {
            border-color: #ff4500;
            box-shadow: 0 0 10px #ff4500;
          }
          50% {
            border-color: #ff9900;
            box-shadow: 0 0 25px #ff9900;
          }
          100% {
            border-color: #ff4500;
            box-shadow: 0 0 10px #ff4500;
          }
        }

        .animate-borderGlow {
          animation: borderGlow 2s infinite ease-in-out;
        }
      `}</style>

      {/* Center Image with glowing border */}
      <div className="relative p-4 rounded-xl">
        <div className="absolute inset-0 rounded-xl border-4 border-transparent animate-borderGlow"></div>
        <img
          src="/images/bigslickgames.png"
          alt="Big Slick Games Logo"
          className="w-48 h-auto rounded-xl shadow-lg relative z-10"
        />
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">
            Loading Big Slick Games...
          </span>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-all text-sm font-medium"
      >
        Skip
      </button>
    </div>
  );
}
