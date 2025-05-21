import React, { useEffect, useState } from "react";
import { StyleSheet, View, Button, TouchableOpacity, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

import WelcomeScreen from "./components/WelcomeScreen";
import WifiSelectionModal from "./components/WifiSelectionModal";
import { MotionScreen } from "./screens/MotionScreen";
import { LiveScreen } from "./screens/LiveScreen";
import { SimulationScreen } from "./screens/SimulationScreen";
import { useWifiConnection } from "./hooks/useWifiConnection";

// Keep the splash screen visible while fetching resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [selectedMode, setSelectedMode] = useState("motion");
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

  if (!isAppReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WelcomeScreen visible={hasSeenWelcome} onContinue={handleContinue} />
      <View style={styles.buttonContainer}>
        <Button
          title="Device Motion"
          onPress={() => setSelectedMode("motion")}
        />
        <Button title="Live" onPress={() => setSelectedMode("live")} />
        <Button
          title="Simulation"
          onPress={() => setSelectedMode("simulation")}
        />
      </View>

      {selectedMode === "motion" && <MotionScreen />}
      {selectedMode === "live" && (
        <LiveScreen
          onOpenWifiModal={() => setIsWifiModalVisible(true)}
          selectedNetwork={selectedNetwork}
        />
      )}
      {selectedMode === "simulation" && <SimulationScreen />}

      <View style={resetStyles.resetButtonContainer}>
        <TouchableOpacity
          style={resetStyles.resetButton}
          onPress={handleResetSplash}
        >
          <Text style={resetStyles.resetButtonText}>Reset Splash Status</Text>
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
});

const resetStyles = StyleSheet.create({
  resetButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 32,
    backgroundColor: "transparent",
  },
  resetButton: {
    backgroundColor: "#ff375f",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    width: "90%",
    maxWidth: 320,
  },
  resetButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
