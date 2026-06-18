import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { hubAuthApi } from "../api/auth";
import { HubApiError } from "../api/client";
import { hubProfileApi } from "../api/profile";
import { defaultHubProduct, getHubProduct, hubProducts } from "../catalog/products";
import type {
  HubLoginPayload,
  HubPlayerSettingsPayload,
  HubProduct,
  HubProfile,
  HubProfileUpdatePayload,
  HubRegisterPayload
} from "../types";
import {
  clearPersistedHubSession,
  loadPersistedHubSession,
  savePersistedHubSession
} from "./storage";

type HubSessionStatus = "anonymous" | "authenticated";

interface HubSessionContextValue {
  consumeWebsiteHandoff: (handoffCode: string) => Promise<HubProfile>;
  currentProduct: HubProduct;
  hasToken: boolean;
  isReady: boolean;
  login: (payload: HubLoginPayload) => Promise<HubProfile>;
  logout: () => Promise<void>;
  profile: HubProfile | null;
  products: HubProduct[];
  refreshProfile: () => Promise<HubProfile | null>;
  refreshToken: () => Promise<string | null>;
  register: (payload: HubRegisterPayload) => Promise<string>;
  selectProduct: (productId: string) => void;
  status: HubSessionStatus;
  token: string | null;
  updatePlayerSettings: (payload: HubPlayerSettingsPayload) => Promise<void>;
  updateProfile: (payload: HubProfileUpdatePayload) => Promise<void>;
}

const HubSessionContext = createContext<HubSessionContextValue | null>(null);

export function HubSessionProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<HubProfile | null>(null);
  const [currentProductId, setCurrentProductId] = useState(defaultHubProduct.id);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const persistedSession = await loadPersistedHubSession();

        if (!mounted) {
          return;
        }

        setCurrentProductId(getHubProduct(persistedSession.currentProductId).id);

        if (!persistedSession.token) {
          return;
        }

        try {
          const profileResponse = await hubProfileApi.getProfile(persistedSession.token);
          const nextProfile = profileResponse.body.data;

          if (!mounted) {
            return;
          }

          if (nextProfile.eUserType === "guest") {
            await clearPersistedHubSession();
            setToken(null);
            setProfile(null);
            return;
          }

          setToken(persistedSession.token);
          setProfile(nextProfile);
        } catch {
          await clearPersistedHubSession();

          if (!mounted) {
            return;
          }

          setToken(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void savePersistedHubSession({
      currentProductId,
      token
    });
  }, [currentProductId, isReady, token]);

  const status: HubSessionStatus = token ? "authenticated" : "anonymous";

  async function applyAuthenticatedSession(nextToken: string) {
    const profileResponse = await hubProfileApi.getProfile(nextToken);
    setToken(nextToken);
    setProfile(profileResponse.body.data);
    return profileResponse.body.data;
  }

  async function register(payload: HubRegisterPayload) {
    const response = await hubAuthApi.register(payload);
    return response.body.message;
  }

  async function login(payload: HubLoginPayload) {
    const result = await hubAuthApi.login(payload);

    if (!result.token) {
      throw new HubApiError("Login succeeded without an authorization token.", 500);
    }

    return applyAuthenticatedSession(result.token);
  }

  async function consumeWebsiteHandoff(handoffCode: string) {
    const result = await hubAuthApi.exchangeHandoff(handoffCode);

    if (!result.token) {
      throw new HubApiError(
        "Handoff exchange succeeded without an authorization token.",
        500
      );
    }

    return applyAuthenticatedSession(result.token);
  }

  async function logout() {
    if (token) {
      try {
        await hubProfileApi.logout(token);
      } catch {
        // Clear local session even if the remote token is already invalid.
      }
    }

    setToken(null);
    setProfile(null);
    await clearPersistedHubSession();
  }

  async function refreshProfile() {
    if (!token) {
      return profile;
    }

    const response = await hubProfileApi.getProfile(token);
    setProfile(response.body.data);
    return response.body.data;
  }

  async function refreshToken() {
    if (!token) {
      return token;
    }

    const result = await hubAuthApi.refreshToken(token);

    if (!result.token) {
      throw new HubApiError(
        "Refresh token request succeeded without an authorization token.",
        500
      );
    }

    setToken(result.token);
    return result.token;
  }

  async function updateProfile(payload: HubProfileUpdatePayload) {
    if (!token) {
      throw new HubApiError(
        "A verified user session is required to update the profile.",
        401
      );
    }

    await hubProfileApi.updateProfile(token, payload);
    await refreshProfile();
  }

  async function updatePlayerSettings(payload: HubPlayerSettingsPayload) {
    if (!token) {
      throw new HubApiError(
        "A verified user session is required to update player settings.",
        401
      );
    }

    await hubProfileApi.updateSettings(token, payload);
    await refreshProfile();
  }

  const value = useMemo<HubSessionContextValue>(
    () => ({
      consumeWebsiteHandoff,
      currentProduct: getHubProduct(currentProductId),
      hasToken: Boolean(token),
      isReady,
      login,
      logout,
      profile,
      products: hubProducts,
      refreshProfile,
      refreshToken,
      register,
      selectProduct: (productId: string) => {
        setCurrentProductId(getHubProduct(productId).id);
      },
      status,
      token,
      updatePlayerSettings,
      updateProfile
    }),
    [currentProductId, isReady, profile, status, token]
  );

  return (
    <HubSessionContext.Provider value={value}>
      {children}
    </HubSessionContext.Provider>
  );
}

export function useHubSession() {
  const context = useContext(HubSessionContext);

  if (!context) {
    throw new Error("useHubSession must be used inside HubSessionProvider.");
  }

  return context;
}
