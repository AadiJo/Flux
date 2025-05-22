import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useColorScheme, Appearance } from "react-native";

const ThemeContext = createContext();

export const themes = {
  light: {
    primary: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#333333",
    textSecondary: "#666666",
    border: "#EEEEEE",
    shadow: "#000000",
  },
  dark: {
    primary: "#007AFF",
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    background: "#000000",
    card: "#1C1C1E",
    text: "#FFFFFF",
    textSecondary: "#AEAEB2",
    border: "#38383A",
    shadow: "#000000",
  },
};

export const ThemeProvider = ({ children }) => {
  // Get initial system theme
  const initialColorScheme = Appearance.getColorScheme() || "dark";
  const [isDark, setIsDark] = useState(initialColorScheme === "dark");

  // Subscribe to theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === "dark");
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
