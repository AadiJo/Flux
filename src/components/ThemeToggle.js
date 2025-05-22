import React, { useEffect } from "react";
import { TouchableOpacity, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

export const ThemeToggle = () => {
  const { isDark, toggleTheme, theme } = useTheme();
  const rotateAnim = new Animated.Value(0);

  const handlePress = () => {
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      rotateAnim.setValue(0);
    });
    toggleTheme();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <TouchableOpacity
      style={{
        padding: 8,
        borderRadius: 20,
      }}
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialCommunityIcons
          name={isDark ? "weather-night" : "weather-sunny"}
          size={24}
          color={theme.primary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};
