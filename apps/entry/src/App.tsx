import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import GameInfoPage from "./components/GameInfoPage";
import SplashScreen from "./components/SplashScreen";
import { bsgGetProfile, getBsgToken, type BsgUser } from "./lib/bsgApi";

const publicVisitorProfile: BsgUser = {
  id: "public-visitor",
  email: "public@bigslickgames.local",
  username: "Visitor",
  chips: 0,
  created_at: new Date(0).toISOString(),
  country: null,
  level: 1,
  experience: 0,
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [profile, setProfile] = useState<BsgUser>(publicVisitorProfile);

  useEffect(() => {
    let cancelled = false;

    async function loadSharedProfile() {
      try {
        if (!getBsgToken()) return;
        const profileData = await bsgGetProfile();
        if (cancelled) return;
        setProfile(profileData);
      } catch (error) {
        console.warn("BSG profile unavailable:", error);
      }
    }

    loadSharedProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <BrowserRouter>
        <Routes>
          <Route path="/games/:gameId" element={<GameInfoPage />} />
          <Route
            path="/*"
            element={
              <Dashboard
                user={profile}
                profile={profile}
                onProfileUpdate={setProfile}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
