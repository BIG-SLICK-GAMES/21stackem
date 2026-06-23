import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";

import {
  getStackemLaunchUrl,
  type BsgUser,
} from "../lib/bsgApi";
import CommunityRules from "./CommunityRules";
import DailyRewardsPanel from "./DailyRewardsPanel";
import Footer from "./Footer";
import Forum from "./Forum";
import GamesGrid from "./GamesGrid";
import Header from "./Header";
import Leaderboard from "./Leaderboard";
import Missions from "./Missions";
import PrivacyPolicy from "./PrivacyPolicy";
import ProfileSettings from "./ProfileSettings";
import Shop from "./Shop";
import TermsOfUse from "./TermsOfService";

interface DashboardProps {
  onProfileUpdate?: (profile: BsgUser) => void;
  user: BsgUser;
  profile: BsgUser;
}

type ActiveView =
  | "dashboard"
  | "shop"
  | "missions"
  | "settings"
  | "forum"
  | "leaderboard"
  | "privacy"
  | "terms"
  | "rules";

export default function Dashboard({
  onProfileUpdate,
  profile: initialProfile,
}: DashboardProps) {
  const [profile, setProfile] = useState<BsgUser>(initialProfile);
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [collapsedSections, setCollapsedSections] = useState({
    games: false,
    profile: false,
    dailyRewards: false,
    contacts: true,
  });
  const [showElements, setShowElements] = useState({
    header: false,
    leftSidebar: false,
    gamesGrid: false,
    rightSidebar: false,
  });

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (activeView !== "dashboard") {
      setShowElements({
        header: true,
        leftSidebar: true,
        gamesGrid: true,
        rightSidebar: true,
      });
      return;
    }

    [
      { element: "header", delay: 100 },
      { element: "leftSidebar", delay: 200 },
      { element: "gamesGrid", delay: 300 },
      { element: "rightSidebar", delay: 400 },
    ].forEach(({ element, delay }) => {
      window.setTimeout(() => {
        setShowElements((current) => ({ ...current, [element]: true }));
      }, delay);
    });
  }, [activeView]);

  const toggleSection = (sectionId: keyof typeof collapsedSections) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const handlePurchase = (newChipBalance: number) => {
    setProfile((current) => ({ ...current, chips: newChipBalance }));
  };

  const handleProfileUpdate = (nextProfile: BsgUser) => {
    setProfile(nextProfile);
    onProfileUpdate?.(nextProfile);
  };

  const handleGameClick = (gameId: string) => {
    if (gameId === "stack-em") {
      window.location.href = getStackemLaunchUrl();
      return;
    }

    if (gameId === "poker-opoly") {
      window.location.href = "/games/poker-opoly";
      return;
    }

    console.log(`Game ${gameId} not yet configured`);
  };

  const renderMainView = () => {
    if (activeView === "missions") {
      return <Missions profile={profile} onBack={() => setActiveView("dashboard")} />;
    }

    if (activeView === "settings") {
      return (
        <ProfileSettings
          profile={profile}
          onBack={() => setActiveView("dashboard")}
          onProfileUpdate={setProfile}
        />
      );
    }

    if (activeView === "privacy") {
      return <PrivacyPolicy onBack={() => setActiveView("dashboard")} />;
    }

    if (activeView === "terms") {
      return <TermsOfUse onBack={() => setActiveView("dashboard")} />;
    }

    if (activeView === "rules") {
      return <CommunityRules onBack={() => setActiveView("dashboard")} />;
    }

    if (activeView === "leaderboard") {
      return <Leaderboard profile={profile} onBack={() => setActiveView("dashboard")} />;
    }

    if (activeView === "shop") {
      return (
        <Shop
          profile={profile}
          onPurchase={handlePurchase}
          onBack={() => setActiveView("dashboard")}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-4">
        <div
          className={`hidden space-y-6 transition-all duration-500 lg:col-span-1 lg:block ${
            showElements.leftSidebar
              ? "translate-x-0 opacity-100"
              : "-translate-x-12 opacity-0"
          }`}
        >
          <CollapsibleSection
            title="Player Overview"
            isCollapsed={collapsedSections.profile}
            onToggle={() => toggleSection("profile")}
          >
            <ProfileSummary profile={profile} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Contact Us"
            isCollapsed={collapsedSections.contacts}
            onToggle={() => toggleSection("contacts")}
          >
            <ContactPanel />
          </CollapsibleSection>
        </div>

        <div
          className={`transition-all duration-500 lg:col-span-2 ${
            showElements.gamesGrid
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <CollapsibleSection
            title="Available Games"
            isCollapsed={collapsedSections.games}
            onToggle={() => toggleSection("games")}
          >
            <GamesGrid profile={profile} onGameClick={handleGameClick} />
          </CollapsibleSection>
        </div>

        <div
          className={`space-y-6 transition-all duration-500 lg:col-span-1 ${
            showElements.rightSidebar
              ? "translate-x-0 opacity-100"
              : "translate-x-12 opacity-0"
          }`}
        >
          <CollapsibleSection
            title="Daily Rewards"
            isCollapsed={collapsedSections.dailyRewards}
            onToggle={() => toggleSection("dailyRewards")}
          >
            <DailyRewardsPanel onProfileUpdate={setProfile} />
          </CollapsibleSection>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen min-w-full flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(249, 115, 22, 0.1) 2px, rgba(249, 115, 22, 0.1) 4px, transparent 4px, transparent 8px, rgba(156, 163, 175, 0.1) 8px, rgba(156, 163, 175, 0.1) 10px)",
          }}
        />
      </div>

      <div
        className={`relative z-20 transition-all duration-300 ${
          showElements.header
            ? "translate-y-0 opacity-100"
            : "-translate-y-16 opacity-0"
        }`}
      >
        <Header
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
          onShopClick={() => setActiveView("shop")}
          onMissionsClick={() => setActiveView("missions")}
          onSettingsClick={() => setActiveView("settings")}
          onForumClick={() => setActiveView("forum")}
          onLeaderboardClick={() => setActiveView("leaderboard")}
          onHomeClick={() => setActiveView("dashboard")}
        />
      </div>

      <main className="relative z-10 container mx-auto flex-1 px-4 py-8 pb-32">
        {renderMainView()}
      </main>

      <Footer onSetActiveView={setActiveView} />
    </div>
  );
}

function ProfileSummary({ profile }: { profile: BsgUser }) {
  return (
    <div className="space-y-4 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-5 shadow-xl shadow-orange-500/10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/40">
          <span className="text-xl font-bold text-white">
            {profile.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">{profile.username}</h3>
        <p className="text-sm text-gray-400">{profile.email}</p>
      </div>

      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-3 text-center">
        <p className="text-sm text-gray-400">Shared Bankroll</p>
        <p className="mt-1 text-2xl font-black text-yellow-300">
          {profile.chips.toLocaleString()}
        </p>
        <p className="text-xs text-yellow-100/70">chips</p>
      </div>
    </div>
  );
}

function ContactPanel() {
  return (
    <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-5 shadow-xl shadow-orange-500/10">
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Get in Touch</h3>
      </div>
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 text-center">
        <h4 className="mb-2 font-semibold text-white">Support & Inquiries</h4>
        <a
          href="mailto:bigslickgames@gmail.com"
          className="font-medium text-orange-400 hover:text-orange-300"
        >
          bigslickgames@gmail.com
        </a>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <section className="mb-4 sm:mb-6">
      <button
        onClick={onToggle}
        className="group mb-3 flex w-full items-center space-x-2 rounded-lg p-2 text-left transition hover:bg-gray-800/30"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
        )}
        <h3 className="text-sm font-semibold text-white group-hover:text-orange-100 sm:text-base">
          {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-orange-500/30 to-transparent" />
      </button>

      <div
        className={`transition-all duration-300 ${
          isCollapsed
            ? "max-h-0 overflow-hidden opacity-0"
            : "max-h-[2400px] overflow-visible opacity-100"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
