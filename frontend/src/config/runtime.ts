function normalizeUrl(
  value: string | undefined,
  allowedProtocols: readonly string[]
) {
  if (!value) {
    return null;
  }

  const candidate = value.trim();

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);

    if (!allowedProtocols.includes(url.protocol)) {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getHostLabel(value: string | null) {
  if (!value) {
    return "Not configured";
  }

  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

const appEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim() || "development";
const developmentApiHost = "192.168.0.111";
const productionApiBaseUrl = "https://api.bigslickgames.com";
const productionSocketBaseUrl = "wss://api.bigslickgames.com";

function getBrowserHost() {
  if (typeof window === "undefined" || !window.location?.hostname) {
    return developmentApiHost;
  }

  const host = window.location.hostname;

  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return developmentApiHost;
  }

  return host;
}

function buildDefaultApiBaseUrl() {
  if (appEnv === "production") {
    return productionApiBaseUrl;
  }

  return `http://${getBrowserHost()}:3050`;
}

function buildDefaultSocketBaseUrl() {
  if (appEnv === "production") {
    return productionSocketBaseUrl;
  }

  return `ws://${getBrowserHost()}:3050`;
}

const defaultApiBaseUrl = buildDefaultApiBaseUrl();
const defaultSocketBaseUrl = buildDefaultSocketBaseUrl();
const apiBaseUrl =
  normalizeUrl(process.env.EXPO_PUBLIC_API_BASE_URL, ["http:", "https:"]) ??
  defaultApiBaseUrl;
const bigSlickGamesUrl = normalizeUrl(
  process.env.EXPO_PUBLIC_BIG_SLICK_GAMES_URL?.trim() ||
    "https://bigslickgames.netlify.app",
  ["http:", "https:"]
);
const socketBaseUrl =
  normalizeUrl(process.env.EXPO_PUBLIC_SOCKET_BASE_URL, ["ws:", "wss:"]) ??
  defaultSocketBaseUrl;

export const runtimeConfig = {
  appEnv,
  apiBaseUrl,
  apiHostLabel: getHostLabel(apiBaseUrl),
  backendLabel: apiBaseUrl ? `${appEnv}: ${getHostLabel(apiBaseUrl)}` : "Not configured",
  bigSlickGamesHostLabel: getHostLabel(bigSlickGamesUrl),
  bigSlickGamesUrl,
  socketBaseUrl
};

export function buildApiUrl(path: string) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
