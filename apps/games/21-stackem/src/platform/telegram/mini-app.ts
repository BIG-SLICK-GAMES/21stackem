import { useEffect, useState } from "react";

type TelegramWebApp = {
  colorScheme?: "dark" | "light";
  initData?: string;
  platform?: string;
  ready?: () => void;
  expand?: () => void;
  setBackgroundColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

function getWindow() {
  return typeof window === "undefined" ? null : window;
}

export function getTelegramWebApp() {
  return getWindow()?.Telegram?.WebApp ?? null;
}

export function isTelegramMiniAppRuntime() {
  const currentWindow = getWindow();

  if (!currentWindow) {
    return false;
  }

  const webApp = getTelegramWebApp();
  const params = new URLSearchParams(currentWindow.location.search);

  return Boolean(
    webApp?.initData ||
      params.has("tgWebAppData") ||
      params.has("tgWebAppStartParam") ||
      params.get("source") === "telegram"
  );
}

export function setupTelegramMiniApp() {
  const webApp = getTelegramWebApp();

  if (!webApp) {
    return false;
  }

  webApp.ready?.();
  webApp.expand?.();
  webApp.setHeaderColor?.("#0b2438");
  webApp.setBackgroundColor?.("#0b1624");
  return true;
}

export function useTelegramMiniApp() {
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setIsTelegram(isTelegramMiniAppRuntime());
    setupTelegramMiniApp();
  }, []);

  return {
    isTelegram,
    webApp: getTelegramWebApp()
  };
}
