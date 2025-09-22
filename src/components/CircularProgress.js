import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withSpring,
  interpolate,
  useAnimatedReaction,
  runOnJS
} from 'react-native-reanimated';
import { useTheme } from "../contexts/ThemeContext";
import { SPRING_CONFIG } from "../utils/animationConfig";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularProgress = ({
  size = 250,
  strokeWidth = 15,
  progress = 0,
  score,
  gradientColors = ["#007AFF", "#007AFF"],
}) => {
  const { theme, isDark } = useTheme();
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const animatedProgress = useSharedValue(0);
  const animatedScore = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(score || 0);

  const animatedCircleProps = useAnimatedProps(() => {
    const progressOffset = circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset: progressOffset,
    };
  });

  // Use useAnimatedReaction to update the display score
  useAnimatedReaction(
    () => {
      const targetScore = score || 0;
      return interpolate(
        animatedScore.value,
        [0, 1],
        [0, targetScore]
      );
    },
    (currentScore) => {
      runOnJS(setDisplayScore)(Math.round(currentScore));
    }
  );

  useEffect(() => {
    console.log('CircularProgress: progress =', progress, 'score =', score);
    if (score !== undefined && score !== null) {
      setDisplayScore(score);
    }
    animatedProgress.value = withSpring(progress, SPRING_CONFIG);
    animatedScore.value = withSpring(1, SPRING_CONFIG);
  }, [progress, score]);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isDark ? "#FFFFFF20" : "#E0E0E0"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors[0]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          animatedProps={animatedCircleProps}
        />

        {/* Score Text */}
        <SvgText
          x={center}
          y={center + 15}
          fontSize="48"
          fontWeight="bold"
          fill={theme.text}
          textAnchor="middle"
        >
          {displayScore}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
