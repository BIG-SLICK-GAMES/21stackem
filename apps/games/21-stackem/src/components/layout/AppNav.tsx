import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Linking, Pressable, StyleSheet, View } from "react-native";

import { stackemRoutes } from "../../navigation/routes";
import { fireHaptic } from "../../services/haptics";
import { useGameSettings } from "../../store/game-settings";

export type AppNavKey =
  | "game"
  | "daily"
  | "leaderboards"
  | "profile"
  | "social"
  | "settings";

const NAV_ITEMS: Array<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  key: AppNavKey;
  path?: Href;
  url?: string;
}> = [
  { icon: "cards-playing", key: "game", path: stackemRoutes.lobby },
  { icon: "gift", key: "daily", path: stackemRoutes.rewards },
  { icon: "trophy", key: "leaderboards", path: stackemRoutes.leaderboard },
  { icon: "account-circle", key: "profile", path: stackemRoutes.profile },
  { icon: "share-variant", key: "social", path: stackemRoutes.social },
  {
    icon: "cog",
    key: "settings",
    path: { pathname: stackemRoutes.profile, params: { section: "settings" } }
  }
];

const PATH_TO_KEY: Record<string, AppNavKey> = {
  [String(stackemRoutes.lobby)]: "game",
  [String(stackemRoutes.rewards)]: "daily",
  [String(stackemRoutes.leaderboard)]: "leaderboards",
  [String(stackemRoutes.profile)]: "profile",
  [String(stackemRoutes.social)]: "social",
  [String(stackemRoutes.settings)]: "settings"
};

// ─── NavIcon ─────────────────────────────────────────────────────────────────

function NavIcon({
  icon,
  onPress,
  selected
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  selected: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const offset = Math.random() * 3000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(offset + 2400),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();
  }, [scale]);

  const translateX = shimmer.interpolate({ inputRange: [-1, 1], outputRange: [-90, 90] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.outer, selected && styles.outerSelected]}
    >
      <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={
            selected
              ? ["rgba(100, 182, 245, 0.44)", "rgba(14, 60, 120, 0.96)"]
              : ["rgba(255,255,255,0.18)", "rgba(6, 20, 44, 0.94)"]
          }
          end={{ x: 0, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.glare} />
          <MaterialCommunityIcons color="#f0f8ff" name={icon} size={30} />
          <Animated.View
            pointerEvents="none"
            style={[styles.shimmer, { transform: [{ translateX }, { skewX: "-14deg" }] }]}
          />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─── AppNav ───────────────────────────────────────────────────────────────────

export function AppNav({
  activeKey,
  onSelect
}: {
  activeKey?: AppNavKey;
  onSelect?: (key: AppNavKey) => boolean | void;
}) {
  const pathname = usePathname();
  const { settings } = useGameSettings();
  const resolvedKey = activeKey ?? PATH_TO_KEY[pathname];

  return (
    <LinearGradient
      colors={["rgba(25, 62, 88, 0.9)", "rgba(3, 15, 26, 0.98)"]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.panel}
    >
      {NAV_ITEMS.map((item) => (
        <NavIcon
          key={item.key}
          icon={item.icon}
          selected={resolvedKey === item.key}
          onPress={() => {
            if (onSelect?.(item.key)) {
              void fireHaptic(settings.haptics, "tap");
              return;
            }

            if (item.path) {
              void fireHaptic(settings.haptics, "tap");
              router.navigate(item.path);
            } else if (item.url) {
              void fireHaptic(settings.haptics, "confirm");
              void Linking.openURL(item.url);
            }
          }}
        />
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glare: {
    backgroundColor: "rgba(220,240,255,0.1)",
    height: 24,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  gradient: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0
  },
  inner: {
    alignSelf: "stretch",
    borderRadius: 20,
    flex: 1,
    overflow: "hidden"
  },
  outer: {
    borderColor: "rgba(160, 210, 255, 0.22)",
    borderRadius: 20,
    borderWidth: 1.5,
    elevation: 8,
    flexBasis: "30%",
    flexGrow: 1,
    height: 68,
    minWidth: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 10
  },
  outerSelected: {
    borderColor: "rgba(158, 223, 255, 0.7)",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18
  },
  panel: {
    borderColor: "rgba(71, 111, 148, 0.52)",
    borderRadius: 34,
    borderWidth: 2,
    elevation: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    shadowColor: "#000000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16
  },
  shimmer: {
    backgroundColor: "rgba(255,255,255,0.14)",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 32
  }
});
