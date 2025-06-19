import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";
import * as Location from "expo-location";
import { LocationProvider } from "./contexts/LocationContext";
import { initializeLogging } from "./services/loggingService";
import { getSpeedingPins } from "./services/speedingService";
import { BlurView } from "expo-blur";

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
  const { theme, isDark } = useTheme();
  const { speedingThreshold } = useSettings();
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [selectedMode, setSelectedMode] = useState("home");
  const { bannerConfig, showBanner, hideBanner } = useAlertBanner();
  const {
    selectedNetwork,
    isWifiModalVisible,
    setIsWifiModalVisible,
    handleWifiSelect,
  } = useWifiConnection();

  // Add location state
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState(null);
  const [speedingPins, setSpeedingPins] = useState([]);
  const [homeSelectedTrip, setHomeSelectedTrip] = useState(null);

  const updateSpeedingPinsFromLogs = async () => {
    const pins = await getSpeedingPins(speedingThreshold);
    setSpeedingPins(pins);
  };

  useEffect(() => {
    async function prepare() {
      try {
        await initializeLogging();
        await updateSpeedingPinsFromLogs();
        // Get location permission and initial location while loading
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);

          // Get street name
          const address = await Location.reverseGeocodeAsync({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });

          if (address && address[0]?.street) {
            setStreetName(address[0].street);
          } else {
            setStreetName("Unknown Street");
          }
        }

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

  // Set up location watching
  useEffect(() => {
    let locationSubscription;

    async function setupLocationWatching() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            setLocation(newLocation);

            const newAddress = await Location.reverseGeocodeAsync({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });

            if (newAddress && newAddress[0]?.street) {
              setStreetName(newAddress[0].street);
            }
          }
        );
      }
    }

    if (isAppReady) {
      setupLocationWatching();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isAppReady]);

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
    <LocationProvider location={location} streetName={streetName}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AlertBanner
          visible={bannerConfig.isVisible}
          message={bannerConfig.message}
          backgroundColor={bannerConfig.backgroundColor}
          onHide={hideBanner}
        />
        <WelcomeScreen visible={hasSeenWelcome} onContinue={handleContinue} />

        {selectedMode === "maps" ? (
          <MapsScreen
            appLocation={location}
            appStreetName={streetName}
            speedingPins={speedingPins}
            updateSpeedingPinsFromLogs={updateSpeedingPinsFromLogs}
            homeSelectedTrip={homeSelectedTrip}
            setHomeSelectedTrip={setHomeSelectedTrip}
          />
        ) : (
          <View
            style={[
              styles.contentContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {selectedMode === "home" && (
              <HomeScreen
                updateSpeedingPinsFromLogs={updateSpeedingPinsFromLogs}
                showBanner={showBanner}
                setSelectedMode={setSelectedMode}
                setHomeSelectedTrip={setHomeSelectedTrip}
              />
            )}
            {selectedMode === "motion" && (
              <MotionScreen onResetSplash={handleResetSplash} />
            )}
            {selectedMode === "live" && (
              <LiveScreen
                onOpenWifiModal={() => setIsWifiModalVisible(true)}
                selectedNetwork={selectedNetwork}
                onResetSplash={handleResetSplash}
                showBanner={showBanner}
                setSpeedingPins={setSpeedingPins}
              />
            )}
            {selectedMode === "simulation" && (
              <SimulationScreen onResetSplash={handleResetSplash} />
            )}
          </View>
        )}

        <View
          style={[
            styles.navbar,
            {
              borderColor: isDark
                ? "rgba(20, 20, 20, 0.1)"
                : "rgba(255, 255, 255, 0.3)",
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(10, 10, 10, 0.4)"
                  : "rgba(255, 255, 255, 0.5)",
              },
            ]}
            experimentalBlurMethod="dimezis"
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDark
                ? "rgba(49, 49, 49, 0.3)"
                : "rgba(211, 211, 211, 0.3)",
            }}
          />
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
                    selectedMode === "home"
                      ? theme.primary
                      : theme.textSecondary,
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
                    selectedMode === "live"
                      ? theme.primary
                      : theme.textSecondary,
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
                    selectedMode === "maps"
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              Maps
            </Text>
          </TouchableOpacity>
        </View>

        <WifiSelectionModal
          visible={isWifiModalVisible}
          onSelect={handleWifiSelect}
          onClose={() => setIsWifiModalVisible(false)}
        />
      </View>
    </LocationProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
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
    paddingVertical: 8,
    borderRadius: 20,
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 1,
    height: 65,
    overflow: "hidden",
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
