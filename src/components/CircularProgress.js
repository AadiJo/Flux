import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";

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
  const progressOffset = circumference - (progress / 100) * circumference;

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

        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors[0]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
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
          {score}
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
