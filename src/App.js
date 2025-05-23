import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";

import WelcomeScreen from "./components/Onboarding";
import WifiSelectionModal from "./components/WifiSelectionModal";
import { AlertBanner } from "./components/AlertBanner";
import { HomeScreen } from "./screens/HomeScreen";
import { MotionScreen } from "./screens/MotionScreen";
import { LiveScreen } from "./screens/LiveScreen";
import { SimulationScreen } from "./screens/SimulationScreen";
import { MapsScreen } from "./screens/MapsScreen";
import { useWifiConnection } from "./hooks/useWifiConnection";
import { useAlertBanner } from "./hooks/useAlertBanner";

// Keep the splash screen visible while fetching resources
SplashScreen.preventAutoHideAsync();

const AppContent = () => {
  const { theme } = useTheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [selectedMode, setSelectedMode] = useState("home");
  const { isVisible, showBanner } = useAlertBanner();
  const {
    selectedNetwork,
    isWifiModalVisible,
    setIsWifiModalVisible,
    handleWifiSelect,
  } = useWifiConnection();

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
        setHasSeenWelcome(!hasSeenWelcome);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    setHasSeenWelcome(false);
  };

  const handleResetSplash = async () => {
    await AsyncStorage.removeItem("hasSeenWelcome");
    setHasSeenWelcome(true);
  };

  // Expose handleResetSplash to window object
  useEffect(() => {
    window.handleResetSplash = handleResetSplash;
    return () => {
      delete window.handleResetSplash;
    };
  }, []);

  if (!isAppReady) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AlertBanner visible={isVisible} />
      <WelcomeScreen visible={hasSeenWelcome} onContinue={handleContinue} />

      <View
        style={[styles.contentContainer, { backgroundColor: theme.background }]}
      >
        {selectedMode === "home" && <HomeScreen />}
        {selectedMode === "motion" && (
          <MotionScreen onResetSplash={handleResetSplash} />
        )}
        {selectedMode === "live" && (
          <LiveScreen
            onOpenWifiModal={() => setIsWifiModalVisible(true)}
            selectedNetwork={selectedNetwork}
            onResetSplash={handleResetSplash}
          />
        )}
        {selectedMode === "simulation" && (
          <SimulationScreen onResetSplash={handleResetSplash} />
        )}
        {selectedMode === "maps" && <MapsScreen />}
      </View>

      <View
        style={[
          styles.navbar,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("home")}
        >
          <MaterialCommunityIcons
            name="home"
            size={24}
            color={
              selectedMode === "home" ? theme.primary : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.navText,
              {
                color:
                  selectedMode === "home" ? theme.primary : theme.textSecondary,
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("motion")}
        >
          <MaterialCommunityIcons
            name="motion-sensor"
            size={24}
            color={
              selectedMode === "motion" ? theme.primary : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.navText,
              {
                color:
                  selectedMode === "motion"
                    ? theme.primary
                    : theme.textSecondary,
              },
            ]}
          >
            Motion
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("live")}
        >
          <MaterialCommunityIcons
            name="connection"
            size={24}
            color={
              selectedMode === "live" ? theme.primary : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.navText,
              {
                color:
                  selectedMode === "live" ? theme.primary : theme.textSecondary,
              },
            ]}
          >
            Live
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("simulation")}
        >
          <MaterialCommunityIcons
            name="desktop-classic"
            size={24}
            color={
              selectedMode === "simulation"
                ? theme.primary
                : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.navText,
              {
                color:
                  selectedMode === "simulation"
                    ? theme.primary
                    : theme.textSecondary,
              },
            ]}
          >
            Simulation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("maps")}
        >
          <MaterialCommunityIcons
            name="map"
            size={24}
            color={
              selectedMode === "maps" ? theme.primary : theme.textSecondary
            }
          />
          <Text
            style={[
              styles.navText,
              {
                color:
                  selectedMode === "maps" ? theme.primary : theme.textSecondary,
              },
            ]}
          >
            Maps
          </Text>
        </TouchableOpacity>
      </View>

      <WifiSelectionModal
        visible={isWifiModalVisible}
        onClose={() => setIsWifiModalVisible(false)}
        onSelectNetwork={handleWifiSelect}
      />
    </View>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderColor: "#eee",
    height: 65,
    zIndex: 1,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "20%",
    paddingHorizontal: 4,
  },
  navText: {
    fontSize: 10,
    marginTop: 2,
    color: "#666",
    textAlign: "center",
  },
  activeNavText: {
    color: "#007AFF",
  },
});
