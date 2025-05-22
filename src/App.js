import React, { useEffect, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import WelcomeScreen from "./components/Onboarding";
import WifiSelectionModal from "./components/WifiSelectionModal";
import { AlertBanner } from "./components/AlertBanner";
import { MotionScreen } from "./screens/MotionScreen";
import { LiveScreen } from "./screens/LiveScreen";
import { SimulationScreen } from "./screens/SimulationScreen";
import { useWifiConnection } from "./hooks/useWifiConnection";
import { useAlertBanner } from "./hooks/useAlertBanner";

// Keep the splash screen visible while fetching resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [selectedMode, setSelectedMode] = useState("motion");
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
    <View style={styles.container}>
      <AlertBanner visible={isVisible} />
      <WelcomeScreen visible={hasSeenWelcome} onContinue={handleContinue} />

      <View style={styles.contentContainer}>
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
      </View>

      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setSelectedMode("motion")}
        >
          <MaterialCommunityIcons
            name="motion-sensor"
            size={24}
            color={selectedMode === "motion" ? "#007AFF" : "#666"}
          />
          <Text
            style={[
              styles.navText,
              selectedMode === "motion" && styles.activeNavText,
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
            color={selectedMode === "live" ? "#007AFF" : "#666"}
          />
          <Text
            style={[
              styles.navText,
              selectedMode === "live" && styles.activeNavText,
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
            color={selectedMode === "simulation" ? "#007AFF" : "#666"}
          />
          <Text
            style={[
              styles.navText,
              selectedMode === "simulation" && styles.activeNavText,
            ]}
          >
            Simulation
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingBottom: 90, // Add padding to account for floating navbar
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
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
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12, // Increased touch target
    minWidth: 80, // Ensure minimum width for touch target
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
  },
  activeNavText: {
    color: "#007AFF",
  },
});
