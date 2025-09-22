import { Platform } from "react-native";
import { Easing } from 'react-native-reanimated';

// Configuration for high refresh rate animations using Reanimated
export const ANIMATION_CONFIG = {
  // Optimized for 120fps on ProMotion displays
  frameRate: 120,
  useNativeDriver: true,
};

// Spring animation config for smooth 120Hz animations using Reanimated
export const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 2,
};

// Timing animation config for smooth 120Hz animations using Reanimated
export const TIMING_CONFIG = {
  duration: 300,
  // Easing curves optimized for 120fps
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Material Design standard easing
};

// Fast timing for quick transitions
export const FAST_TIMING_CONFIG = {
  duration: 200,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design deceleration
};

// Shared transition config for Reanimated
export const SHARED_TRANSITION_CONFIG = {
  duration: 250,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design deceleration
};

// Gesture-based animation config
export const GESTURE_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
};

// High-performance animation config for data visualizations
export const DATA_VIZ_CONFIG = {
  damping: 25,
  stiffness: 300,
  mass: 0.5,
};

// Smooth entrance animations
export const ENTRANCE_CONFIG = {
  damping: 18,
  stiffness: 180,
  mass: 0.9,
};
