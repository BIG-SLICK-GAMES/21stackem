import { requestHubApi } from "./client";
import type { HubSocialClaimResponse, HubSocialStatus } from "../types";

export const hubSocialApi = {
  async getStatus(token: string) {
    return requestHubApi<HubSocialStatus>({
      method: "GET",
      path: "/social/status",
      token
    });
  },
  async claimPostShare(
    token: string,
    payload: {
      platform: string;
      postText: string;
      tags: string[];
    }
  ) {
    return requestHubApi<HubSocialClaimResponse>({
      body: payload,
      method: "POST",
      path: "/social/claim-post-share",
      token
    });
  }
};
