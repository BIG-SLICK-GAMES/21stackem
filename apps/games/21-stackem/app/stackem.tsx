import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { HomeScreen } from "../src/screens/HomeScreen";
import { useHubSession } from "../src/platform/auth/session";
import { theme } from "../src/theme";

export default function StackemLobbyScreen() {
  const params = useLocalSearchParams<{
    bsgToken?: string | string[];
    hubToken?: string | string[];
  }>();
  const { consumeHubToken, isReady } = useHubSession();
  const [consumedToken, setConsumedToken] = useState<string | null>(null);
  const [isConsumingToken, setIsConsumingToken] = useState(false);
  const hubToken = useMemo(
    () => {
      const token = params.bsgToken ?? params.hubToken;
      return Array.isArray(token) ? token[0] : token;
    },
    [params.bsgToken, params.hubToken]
  );

  useEffect(() => {
    if (!isReady || !hubToken || hubToken === consumedToken || isConsumingToken) {
      return;
    }

    let active = true;
    setIsConsumingToken(true);

    consumeHubToken(hubToken)
      .then(() => {
        if (!active) {
          return;
        }

        setConsumedToken(hubToken);
        router.replace("/stackem" as Href);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        // Keep the local screen available if a stale handoff token is supplied.
        setConsumedToken(hubToken);
        router.replace("/stackem" as Href);
      })
      .finally(() => {
        if (active) {
          setIsConsumingToken(false);
        }
      });

    return () => {
      active = false;
    };
  }, [consumeHubToken, consumedToken, hubToken, isConsumingToken, isReady]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center"
  }
});
