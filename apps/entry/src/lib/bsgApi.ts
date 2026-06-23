const TOKEN_STORAGE_KEY = "bsg_platform_auth_token";

export type BsgUser = {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
  preferences?: {
    notifications: boolean;
    sound: boolean;
    theme: string;
  };
  raw?: Record<string, unknown>;
};

export type BsgShopItem = {
  _id?: string;
  nPrice: number;
  nChips: number;
  sTitle?: string;
  sDescription?: string;
  sCurrency?: string;
  [key: string]: unknown;
};

export type BsgDailyRewards = {
  rewards: number[];
  nBoardDays: number;
  aDailyBonuses: Array<Record<string, unknown>>;
  eligibleDay: number;
  bTodayRewardClaimed: boolean;
  dNextClaimAt?: string;
};

type ApiResponse<T = any> = {
  data?: T;
  message?: string;
  [key: string]: unknown;
};

export const bsgApiRoot = (
  import.meta.env.VITE_BSG_API_ENDPOINT || "http://127.0.0.1:3001/api"
).replace(/\/$/, "");

export const stackemAppUrl = (
  import.meta.env.VITE_STACKEM_APP_URL || "http://127.0.0.1:8094/stackem"
).replace(/\/$/, "");

export function getBsgToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setBsgToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearBsgToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStackemLaunchUrl() {
  const token = getBsgToken();
  const target = new URL(stackemAppUrl);

  target.searchParams.set("launch", String(Date.now()));

  if (token) {
    target.searchParams.set("bsgToken", token);
    target.searchParams.set("from", "bsg-hub");
  }

  return target.toString();
}

function extractError(payload: ApiResponse, fallback: string) {
  return typeof payload?.message === "string" ? payload.message : fallback;
}

async function bsgRequest<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getBsgToken();
  if (requiresAuth && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${bsgApiRoot}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(extractError(payload, "BSG API request failed."));
  }

  return payload;
}

export async function bsgLogin(email: string, password: string) {
  const payload = await bsgRequest<{ token: string; user: BsgUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!payload.data?.token || !payload.data?.user) {
    throw new Error("Login succeeded without a BSG session.");
  }
  setBsgToken(payload.data.token);
  return payload.data.user;
}

export async function bsgRegister(email: string, password: string, username: string) {
  const payload = await bsgRequest<{ token: string; user: BsgUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, username }),
  });
  if (!payload.data?.token || !payload.data?.user) {
    throw new Error("Registration succeeded without a BSG session.");
  }
  setBsgToken(payload.data.token);
  return payload.data.user;
}

export async function bsgGetProfile() {
  const payload = await bsgRequest<BsgUser>("/profile", { method: "GET" }, true);
  if (!payload.data) throw new Error("Profile was not returned.");
  return payload.data;
}

export async function bsgUpdateProfile(payload: { country?: string | null }) {
  const response = await bsgRequest<BsgUser>(
    "/profile/update",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    true
  );
  if (!response.data) throw new Error("Updated profile was not returned.");
  return response.data;
}

export async function bsgUpdateSettings(settings: {
  notifications: boolean;
  sound: boolean;
  theme?: string;
}) {
  const response = await bsgRequest<BsgUser>(
    "/profile/setting",
    {
      method: "POST",
      body: JSON.stringify(settings),
    },
    true
  );
  if (!response.data) throw new Error("Updated profile was not returned.");
  return response.data;
}

export async function bsgGetShop() {
  const payload = await bsgRequest<BsgShopItem[]>("/shop", { method: "GET" }, true);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function bsgBuyShopItem(nPrice: number) {
  const payload = await bsgRequest<{ transaction?: unknown }>(
    "/shop/buy",
    {
      method: "POST",
      body: JSON.stringify({ nPrice }),
    },
    true
  );
  return payload.data || {};
}

export async function bsgGetDailyRewards() {
  const payload = await bsgRequest<BsgDailyRewards>(
    "/daily_rewards",
    { method: "GET" },
    true
  );
  if (!payload.data) throw new Error("Daily rewards were not returned.");
  return payload.data;
}

export async function bsgClaimDailyReward() {
  const payload = await bsgRequest(
    "/daily_rewards/claim",
    { method: "POST" },
    true
  );
  return payload.data as {
    reward?: number;
    streak?: number;
    [key: string]: unknown;
  };
}
