import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Save,
  Mail,
  Globe,
  TrendingUp,
  Coins,
} from "lucide-react";
import { bsgUpdateProfile, bsgUpdateSettings } from "../lib/bsgApi";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
  theme_preference?: string;
  preferences?: {
    sound: boolean;
    theme: string;
    notifications: boolean;
  };
}

interface ProfileSettingsProps {
  profile: UserProfile;
  onBack: () => void;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export default function ProfileSettings({
  profile,
  onBack,
  onProfileUpdate,
}: ProfileSettingsProps) {
  const [username, setUsername] = useState(profile.username);
  const [country, setCountry] = useState(profile.country || "");
  const [notifications, setNotifications] = useState(
    profile.preferences?.notifications ?? true
  );
  const [soundEnabled, setSoundEnabled] = useState(
    profile.preferences?.sound ?? true
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      await bsgUpdateSettings({
        sound: soundEnabled,
        notifications,
        theme: profile.preferences?.theme || "orange",
      });
      const updatedProfile = await bsgUpdateProfile({ country: country || null });

      onProfileUpdate(updatedProfile);
      showMessage("Settings saved successfully", "success");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      // showMessage("Failed to save settings. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const xpNeeded = 1000 * (profile.level || 1);
    const currentXP = profile.experience || 0;
    return Math.min((currentXP / xpNeeded) * 100, 100);
  };

  return (
    <div className="min-h-screen py-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <button
          onClick={onBack}
          className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Account Settings
          </h1>
          <p className="text-gray-400 text-base">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div
            className={`p-4 rounded-xl border backdrop-blur-sm ${
              messageType === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            } animate-fadeIn`}
          >
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  messageType === "success" ? "bg-green-400" : "bg-red-400"
                }`}
              ></div>
              <span className="font-medium">{message}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 via-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30">
                  <span className="text-white font-black text-4xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {profile.username}
                  </h3>
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                </div>

                <div className="pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-400 text-sm font-medium">
                      Level Progress
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-bold">
                        Level {profile.level || 1}
                      </span>
                      <span className="text-gray-400">
                        {profile.experience || 0} /{" "}
                        {1000 * (profile.level || 1)} XP
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-orange-500/50"
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        Current Balance
                      </p>
                      <p className="text-lg font-bold text-yellow-400">
                        {(profile.chips || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">
                        Account Status
                      </p>
                      <p className="text-sm font-bold text-green-400">
                        Active & Verified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-gray-700/50 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Profile Information
                    </h3>
                    <p className="text-xs text-gray-400">
                      Update your personal details
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
                    <User className="w-4 h-4 text-orange-400" />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-3.5 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Username cannot be changed once set
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
                    <Mail className="w-4 h-4 text-orange-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-3.5 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Email address cannot be modified
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <span>Country (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
                    placeholder="Enter your country"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Help us personalize your experience
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-700/50 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Preferences
                    </h3>
                    <p className="text-xs text-gray-400">
                      Customize your gaming experience
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        Push Notifications
                      </p>
                      <p className="text-xs text-gray-400">
                        Receive updates about games and rewards
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔊</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">Sound Effects</p>
                      <p className="text-xs text-gray-400">
                        Enable audio feedback for interactions
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-700/50 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Account Security
                    </h3>
                    <p className="text-xs text-gray-400">
                      Your account information and status
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                    <p className="text-xs text-gray-400 font-medium mb-2">
                      Member Since
                    </p>
                    <p className="text-white font-bold text-lg">
                      {new Date(profile.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
                    <p className="text-xs text-gray-400 font-medium mb-2">
                      Account Type
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <p className="text-green-400 font-bold text-lg">
                        Premium
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-400">
                Changes will be saved to your account immediately
              </p>
              <button
                onClick={handleSave}
                disabled={loading}
                className="group relative bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/25 flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span className="relative z-10">
                  {loading ? "Saving..." : "Save Changes"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
