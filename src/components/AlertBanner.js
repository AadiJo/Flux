import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay,
  withSequence,
  runOnJS 
} from 'react-native-reanimated';
import { useTheme } from "../contexts/ThemeContext";
import { SPRING_CONFIG } from "../utils/animationConfig";

export const AlertBanner = ({
  visible,
  message = "Refreshed!",
  duration = 2000,
  onHide,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const translateY = useSharedValue(-100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      // Show banner with sequence animation
      translateY.value = withSequence(
        withSpring(0, SPRING_CONFIG),
        withDelay(duration, withSpring(-100, SPRING_CONFIG, () => {
          if (onHide) {
            runOnJS(onHide)();
          }
        }))
      );
    }
  }, [visible, duration, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.content,
          { backgroundColor: backgroundColor || theme.primary },
        ]}
      >
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: "center",
    paddingTop: 60, // Increased from 40 to account for Dynamic Island
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
