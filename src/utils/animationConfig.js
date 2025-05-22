import { Platform } from "react-native";

// Configuration for high refresh rate animations
export const ANIMATION_CONFIG = {
  // Use higher frame rate on supported devices
  frameRate: 120,
  useNativeDriver: true,
};

// Spring animation config for smooth 120Hz animations
export const SPRING_CONFIG = {
  ...ANIMATION_CONFIG,
  tension: 65, // Lower tension for smoother motion
  friction: 10, // Lower friction for smoother motion
  useNativeDriver: true,
};

// Timing animation config for smooth 120Hz animations
export const TIMING_CONFIG = {
  ...ANIMATION_CONFIG,
  duration: 300,
  useNativeDriver: true,
};
