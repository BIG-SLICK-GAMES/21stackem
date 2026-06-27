import { ActivityIndicator, StyleSheet, View } from "react-native";

import { GameExperience } from "../../src/game/GameExperience";
import { useHubSession } from "../../src/platform/auth/session";
import { theme } from "../../src/theme";

export default function PlayTabScreen() {
  const { isReady } = useHubSession();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return <GameExperience />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center"
  }
});
