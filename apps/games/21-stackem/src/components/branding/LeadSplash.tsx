import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View
} from "react-native";

import {
  STACKEM_HERO_SIZE,
  STACKEM_ICON,
  STACKEM_LEAD_SPLASH_DURATION_MS
} from "./stackem-branding";

export function LeadSplash() {
  const scale = useRef(new Animated.Value(1)).current;
  const scanLine = useRef(new Animated.Value(-4)).current;

  useEffect(() => {
    const pulseUpDuration = 180;
    const driftDownDuration = 3500;
    const reverseDuration =
      STACKEM_LEAD_SPLASH_DURATION_MS - pulseUpDuration - driftDownDuration;

    Animated.sequence([
      Animated.timing(scale, {
        duration: pulseUpDuration,
        easing: Easing.out(Easing.cubic),
        toValue: 1.14,
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        duration: driftDownDuration,
        easing: Easing.inOut(Easing.cubic),
        toValue: 0.9,
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        duration: reverseDuration,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
  }, [scale]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanLine, {
        duration: 2400,
        easing: Easing.linear,
        toValue: STACKEM_HERO_SIZE.height + 20,
        useNativeDriver: true
      })
    ).start();
  }, [scanLine]);

  return (
    <View style={styles.root}>
      <View style={styles.imageWrap}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image resizeMode="contain" source={STACKEM_ICON} style={styles.image} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.scanLine, { transform: [{ translateY: scanLine }] }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: STACKEM_HERO_SIZE.height,
    maxWidth: "100%",
    width: STACKEM_HERO_SIZE.width
  },
  imageWrap: {
    alignItems: "center",
    height: STACKEM_HERO_SIZE.height,
    justifyContent: "center",
    maxWidth: "100%",
    overflow: "hidden",
    width: STACKEM_HERO_SIZE.width
  },
  scanLine: {
    backgroundColor: "rgba(0, 240, 255, 0.5)",
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  root: {
    alignItems: "center",
    backgroundColor: "#020408",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24
  }
});
