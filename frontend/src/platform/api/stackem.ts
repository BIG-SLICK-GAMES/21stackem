import { requestHubApi } from "./client";
import type {
  HubStackemEntry,
  HubStackemCompleteResponse,
  HubStackemDailyStatus,
  HubStackemStartResponse,
  HubStackemWeeklyLeaderboard,
  HubStackemProfile,
  HubStackemRunPayload
} from "../types";

export const hubStackemApi = {
  async getLeaderboard(limit = 24, difficulty?: "easy" | "medium" | "hard") {
    return requestHubApi<HubStackemWeeklyLeaderboard>({
      method: "GET",
      path: "/stackem/leaderboard",
      query: { difficulty, limit }
    });
  },
  async getLegacyLeaderboard(limit = 24) {
    return requestHubApi<HubStackemEntry[]>({
      method: "GET",
      path: "/stackem/leaderboard",
      query: { legacy: true, limit }
    });
  },
  async getDailyStatus(token: string) {
    return requestHubApi<HubStackemDailyStatus>({
      method: "GET",
      path: "/stackem/daily-status",
      token
    });
  },
  async getProfile(token: string) {
    return requestHubApi<HubStackemProfile>({
      method: "GET",
      path: "/stackem/profile",
      token
    });
  },
  async startGame(token: string, difficulty: "easy" | "medium" | "hard") {
    return requestHubApi<HubStackemStartResponse>({
      body: { difficulty },
      method: "POST",
      path: "/stackem/start",
      token
    });
  },
  async completeGame(
    token: string,
    payload: {
      cardsUsed: number;
      finalTotal: number;
      gameSessionId: string;
    }
  ) {
    return requestHubApi<HubStackemCompleteResponse>({
      body: payload,
      method: "POST",
      path: "/stackem/complete",
      token
    });
  },
  async saveRun(token: string, payload: HubStackemRunPayload) {
    return requestHubApi<HubStackemEntry>({
      body: payload,
      method: "POST",
      path: "/stackem/run",
      token
    });
  }
};
