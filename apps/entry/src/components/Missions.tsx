import React from "react";
import { ArrowLeft, Target } from "lucide-react";

import type { BsgUser } from "../lib/bsgApi";

interface MissionsProps {
  profile: BsgUser;
  onBack: () => void;
}

export default function Missions({ profile, onBack }: MissionsProps) {
  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-gray-400 transition hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-gray-800/90 to-gray-950/90 p-8 text-center shadow-xl shadow-orange-500/10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300">
            <Target className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white">Missions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-300">
            {profile.username}, missions will use your BSG platform account,
            wallet, and reward economy.
          </p>
        </div>
      </div>
    </div>
  );
}
