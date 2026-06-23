import React from "react";
import {
  Coins,
  LogIn,
  Settings,
  X,
  Trophy,
  ShoppingCart,
} from "lucide-react";
import { bsgLogin, bsgRegister, type BsgUser } from "../lib/bsgApi";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
}

interface HeaderProps {
  profile: UserProfile;
  onProfileUpdate?: (profile: BsgUser) => void;
  onShopClick?: () => void;
  onMissionsClick?: () => void;
  onSettingsClick?: () => void;
  onForumClick?: () => void;
  onLeaderboardClick?: () => void;
  onHomeClick?: () => void;
}

export default function Header({
  profile,
  onProfileUpdate,
  onShopClick,
  onMissionsClick,
  onSettingsClick,
  onForumClick,
  onLeaderboardClick,
  onHomeClick,
}: HeaderProps) {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "register">("login");
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showLogin, setShowLogin] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");

  const chips = profile.chips || 0;
  const formatChips = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  const isVisitor = profile.id === "public-visitor";

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsLoggingIn(true);

    try {
      const nextProfile =
        mode === "register"
          ? await bsgRegister(email, password, username)
          : await bsgLogin(email, password);
      onProfileUpdate?.(nextProfile);
      setShowLogin(false);
      setEmail("");
      setPassword("");
      setUsername("");
    } catch (loginError: any) {
      setError(loginError.message || "Login failed.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <header className="bg-gray-900/98 backdrop-blur-xl border-b border-gray-800 shadow-2xl sticky top-0 z-100">
      <div className="container mx-auto px-4">
        {/* MOBILE VIEW */}
        <div className="flex md:hidden items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onHomeClick}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity active:scale-95"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">BS</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                BigSlick
              </h1>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Chips Badge */}
            <div className="flex items-center space-x-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-3 py-2 rounded-xl border border-yellow-500/30">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-bold text-sm">
                {formatChips(chips)}
              </span>
            </div>

            {/* PROMINENT CHIP SHOP BUTTON - Mobile */}
            {onShopClick && (
              <button
                onClick={onShopClick}
                className="relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-lg shadow-orange-500/30 border border-orange-400/50"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs">Shop</span>
                {/* Pulse indicator */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {isVisitor && (
              <button
                onClick={() => setShowLogin(true)}
                className="p-2.5 text-orange-300 hover:text-white hover:bg-orange-500/10 rounded-xl transition-all active:scale-95 border border-orange-500/30"
                aria-label="Login"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}

          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:flex items-center justify-between h-20">
          {/* Left Section */}
          <div className="flex items-center space-x-6">
            <button
              onClick={onHomeClick}
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity active:scale-98"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-orange-500/20">
                <span className="text-white font-black text-xl">BS</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                  BigSlick<span className="text-orange-500">Games</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Premium Gaming Hub
                </p>
              </div>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* PROMINENT CHIP SHOP BUTTON - Desktop */}
            {onShopClick && (
              <button
                onClick={onShopClick}
                className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-red-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2.5 transition-all duration-200 hover:scale-105 shadow-xl shadow-orange-500/30 border-2 border-orange-400/50 group"
              >
                <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-base">Chip Shop</span>
                {/* <div className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold border border-white/30">
                  {formatChips(chips)}
                </div> */}
                {/* Pulse indicator */}
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
                </span>
              </button>
            )}

            {/* Chips Display */}
            <div className="flex items-center space-x-2.5 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 px-5 py-3 rounded-xl border border-yellow-500/20 shadow-lg">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium leading-none mb-0.5">
                  Balance
                </span>
                <span className="text-yellow-300 font-bold text-lg leading-none">
                  {chips.toLocaleString()}
                </span>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-gray-800/50 px-4 py-2.5 rounded-xl border border-gray-700">
              <div className="text-right">
                <p className="text-white font-semibold text-sm leading-none mb-1">
                  {profile.username}
                </p>
                <p className="text-orange-400 text-xs font-medium leading-none">
                  Level {profile.level || 1}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {isVisitor && (
                <button
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-500/20 hover:text-white"
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </button>
              )}

              <button
                onClick={onSettingsClick}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (keeping for future use if needed) */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowMobileMenu(false)}
          ></div>

          <div className="absolute top-full left-0 right-0 bg-red-900 border-b-2 border-orange-500/60 shadow-2xl z-50">
            <div className="container mx-auto px-4 py-4 bg-gray-900">
              <div className="flex items-center space-x-3 px-4 py-3 mb-3 bg-red-800 rounded-xl border-2 border-orange-500/40 shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-base">
                    {profile.username}
                  </p>
                  <p className="text-orange-400 text-sm font-semibold">
                    Level {profile.level || 1}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 bg-yellow-500/30 px-3 py-1.5 rounded-full border-2 border-yellow-500/60">
                    <Coins className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300 font-bold text-sm">
                      {(profile.chips || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {onLeaderboardClick && (
                  <button
                    onClick={() => {
                      onLeaderboardClick();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all border-2 border-gray-700 hover:border-yellow-500/60 shadow-lg"
                  >
                    <div className="w-10 h-10 bg-yellow-500/30 rounded-lg flex items-center justify-center border-2 border-yellow-500/50">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="font-bold text-base">Leaderboard</span>
                  </button>
                )}

              </div>
            </div>
          </div>
        </>
      )}

      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-orange-500/30 bg-gray-950 p-5 shadow-2xl shadow-orange-500/20">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Login</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Use your BSG platform account.
                </p>
              </div>
              <button
                onClick={() => setShowLogin(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
                aria-label="Close login"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
                {error}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 rounded-lg border border-gray-800 bg-gray-900 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                  mode === "login"
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                  mode === "register"
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {mode === "register" && (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
                    Username
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-white outline-none transition focus:border-orange-400"
                    required
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-white outline-none transition focus:border-orange-400"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-400">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-white outline-none transition focus:border-orange-400"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 font-black text-white transition hover:from-orange-400 hover:to-red-500 disabled:cursor-wait disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {isLoggingIn
                  ? mode === "register"
                    ? "Creating Account..."
                    : "Logging In..."
                  : mode === "register"
                    ? "Create BSG Account"
                    : "Login"}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
