import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Dimensions,
  Animated,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  PanResponder,
  Linking,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { DeviceMotion } from "expo-sensors";
import { LineChart } from "react-native-chart-kit";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import WifiManager from "react-native-wifi-reborn";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const screenWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "3",
    strokeWidth: "1",
    stroke: "#007aff",
  },
  withInnerLines: false,
  withOuterLines: false,
  xAxisLabel: "",
  yAxisLabel: "",
  formatYLabel: () => "",
  formatXLabel: () => "",
};

const MAX_SPEED_DATA_POINTS = 30;

function WelcomeScreen({ visible, onContinue }) {
  // Animated values for overlay and sheet content
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);
  const MAX_PULL = 48;

  // PanResponder for bounce effect
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(Math.min(gestureState.dy, MAX_PULL));
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      },
    })
  ).current;

  // Animate overlay and sheet content in/out
  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
      overlayOpacity.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(40);
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }),
      ]).start();
    } else if (showingModal) {
      setDismissing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 40,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDismissing(false);
        panY.setValue(0);
        setShowingModal(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dismiss with animation on Continue
  const handleContinue = () => {
    setDismissing(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissing(false);
      panY.setValue(0);
      setShowingModal(false);
      onContinue();
    });
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View
        style={[sheetStyles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={dismissing ? "none" : "auto"}
      />
      <View style={sheetStyles.sheet}>
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: Animated.add(contentTranslateY, panY) }],
            width: "100%",
          }}
          {...panResponder.panHandlers}
        >
          <ScrollView
            contentContainerStyle={{ alignItems: "center", paddingBottom: 24 }}
            bounces={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={sheetStyles.iconContainer}>
              <Image
                source={require("./assets/icon.png")}
                style={sheetStyles.icon}
              />
            </View>
            <Text style={sheetStyles.title}>Welcome to MyApp</Text>
            <Text style={sheetStyles.subtitle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
              varius, sapien nec ullamcorper gravida, turpis nunc blandit arcu,
              eu fermentum risus nulla.
            </Text>
            <View style={sheetStyles.peopleContainer}>
              <Image
                source={require("./assets/icon.png")}
                style={sheetStyles.peopleIcon}
              />
            </View>
            <Text style={sheetStyles.privacy}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              cursus nunc nec pulvinar lacinia. Velit sapien bibendum magna
              vitae rutrum. Felis turpis sed curabitur accumsan nisi in commodo
              luctus. Urna justo fermentum sapien non blandit sem. Urna ut ante
              maecenas auctor eros eget odio commodo.{" "}
              <Text style={{ color: "#007aff" }}>
                Sed dapibus risus hendrerit vitae mollis augue…
              </Text>
            </Text>
            <TouchableOpacity
              style={sheetStyles.button}
              onPress={handleContinue}
            >
              <Text style={sheetStyles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function WifiSelectionModal({ visible, onClose, onSelectNetwork }) {
  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);

  // Animated values for overlay and sheet content
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
      overlayOpacity.setValue(0);
      contentTranslateY.setValue(40);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }),
      ]).start();

      scanNetworks();
    } else if (showingModal) {
      setDismissing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 40,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDismissing(false);
        setShowingModal(false);
      });
    }
  }, [visible]);

  const handleClose = () => {
    setDismissing(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissing(false);
      setShowingModal(false);
      onClose();
    });
  };

  const scanNetworks = async () => {
    try {
      setScanning(true);

      if (Platform.OS === "android") {
        // Close the modal first
        handleClose();
        // Small delay to ensure modal is closed before showing alert
        setTimeout(() => {
          Alert.alert(
            "Connect to WiFi",
            "To retrieve data from your OBD connector, please connect to its network.",
            [
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings();
                },
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ]
          );
        }, 300);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open settings: " + error.message, [
        { text: "OK" },
      ]);
    } finally {
      setScanning(false);
    }
  };

  const handleNetworkSelect = async (network) => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:root=WIFI");
      return;
    }

    if (network.isCurrent) {
      Alert.alert(
        "Already Connected",
        `You are already connected to ${network.ssid}`
      );
      return;
    }

    if (network.secured) {
      setSelectedNetwork(network);
      setShowPasswordInput(true);
    } else {
      try {
        await WifiManager.connectToSSID(network.ssid);
        onSelectNetwork(network);
      } catch (error) {
        Alert.alert(
          "Connection Failed",
          `Failed to connect to ${network.ssid}: ${error.message}`,
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleConnect = async () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:root=WIFI");
      return;
    }

    if (!selectedNetwork || !password) return;

    try {
      await WifiManager.connectToProtectedSSID(
        selectedNetwork.ssid,
        password,
        selectedNetwork.capabilities.includes("WPA")
      );
      onSelectNetwork(selectedNetwork);
      setShowPasswordInput(false);
      setPassword("");
    } catch (error) {
      Alert.alert(
        "Connection Failed",
        `Failed to connect to ${selectedNetwork.ssid}: ${error.message}`,
        [{ text: "OK" }]
      );
    }
  };

  // On iOS, show a simplified interface
  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={showingModal}
        animationType="none"
        transparent={true}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <Animated.View
          style={[styles.modalOverlay, { opacity: overlayOpacity }]}
          pointerEvents={dismissing ? "none" : "auto"}
        />
        <View style={styles.modalSheet}>
          <Animated.View
            style={{
              transform: [{ translateY: contentTranslateY }],
              width: "100%",
            }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>WiFi Settings</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.iosMessageContainer}>
                <Ionicons name="wifi" size={48} color="#007aff" />
                <Text style={styles.iosMessageTitle}>Connect to WiFi</Text>
                <Text style={styles.iosMessageText}>
                  To retrieve data from your OBD connector, please connect to
                  its network.
                </Text>
                <TouchableOpacity
                  style={styles.iosSettingsButton}
                  onPress={() => {
                    Linking.openURL("App-Prefs:root=WIFI");
                    handleClose();
                  }}
                >
                  <Text style={styles.iosSettingsButtonText}>
                    Open Settings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  // Android interface
  return (
    <Modal
      visible={showingModal}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: overlayOpacity }]}
        pointerEvents={dismissing ? "none" : "auto"}
      />
      <View style={styles.modalSheet}>
        <Animated.View
          style={{
            transform: [{ translateY: contentTranslateY }],
            width: "100%",
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Retrieve Data</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.scanButton} onPress={scanNetworks}>
              <Ionicons name="refresh" size={20} color="#007aff" />
              <Text style={styles.scanButtonText}>Scan for Networks</Text>
            </TouchableOpacity>

            {showPasswordInput ? (
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordTitle}>
                  Enter password for {selectedNetwork.ssid}
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.passwordButtons}>
                  <TouchableOpacity
                    style={[styles.passwordButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPasswordInput(false);
                      setPassword("");
                      setSelectedNetwork(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.passwordButton, styles.connectButton]}
                    onPress={handleConnect}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {scanning ? (
                  <View style={styles.scanningContainer}>
                    <ActivityIndicator size="large" color="#007aff" />
                    <Text style={styles.scanningText}>
                      Scanning for networks...
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.networkList}>
                    {networks.map((network, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.networkItem,
                          network.isCurrent && styles.currentNetwork,
                        ]}
                        onPress={() => handleNetworkSelect(network)}
                      >
                        <View style={styles.networkInfo}>
                          <Text style={styles.networkName}>
                            {network.ssid}
                            {network.isCurrent && " (Connected)"}
                          </Text>
                          <View style={styles.networkDetails}>
                            <Ionicons
                              name={
                                network.secured ? "lock-closed" : "lock-open"
                              }
                              size={16}
                              color="#666"
                            />
                            <Text style={styles.networkStrength}>
                              {Array(network.strength).fill("•").join("")}
                            </Text>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [mode, setMode] = useState("motion");
  const [motionData, setMotionData] = useState({
    acceleration: {},
    accelerationIncludingGravity: {},
    rotation: {},
    orientation: null,
  });
  const [obd2Data, setObd2Data] = useState({ speed: 0, rpm: 0, throttle: 0 });
  const [speedHistory, setSpeedHistory] = useState([0]);
  const [currentAcceleration, setCurrentAcceleration] = useState(0);
  const previousSpeedRef = useRef(0);
  const chartAnimationValue = useRef(new Animated.Value(0)).current;
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading time
        const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
        setShowWelcome(!hasSeenWelcome);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      // Hide splash screen once the app is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    if (mode === "motion") {
      DeviceMotion.setUpdateInterval(100);
      const subscription = DeviceMotion.addListener((data) =>
        setMotionData(data)
      );
      return () => subscription.remove();
    }
  }, [mode]);

  useEffect(() => {
    let interval;
    if (mode === "sim") {
      setSpeedHistory([0]);
      previousSpeedRef.current = 0;
      setCurrentAcceleration(0);
      Animated.timing(chartAnimationValue, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();

      const newSpeedHistory = [];

      interval = setInterval(() => {
        const newSpeed = Math.random() * 120;
        setObd2Data({
          speed: newSpeed,
          rpm: Math.random() * 8000,
          throttle: Math.random() * 100,
        });
        const accelerationValue = newSpeed - previousSpeedRef.current;
        setCurrentAcceleration(accelerationValue);

        newSpeedHistory.push(newSpeed);

        setSpeedHistory((prevHistory) => {
          const updatedHistory = [...prevHistory, newSpeed];
          return updatedHistory.length > MAX_SPEED_DATA_POINTS
            ? updatedHistory.slice(-MAX_SPEED_DATA_POINTS)
            : updatedHistory;
        });
        previousSpeedRef.current = newSpeed;
      }, 250);

      Animated.timing(chartAnimationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      return () => clearInterval(interval);
    } else if (interval) {
      clearInterval(interval);
    }
  }, [mode]);

  const { acceleration, accelerationIncludingGravity, rotation, orientation } =
    motionData;

  const speedChartData = {
    labels: [],
    datasets: [
      {
        data: speedHistory.length > 0 ? speedHistory : [0],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    setShowWelcome(false);
  };

  const handleResetSplash = async () => {
    await AsyncStorage.removeItem("hasSeenWelcome");
    setShowWelcome(true);
  };

  const openWifiSettings = async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("App-Prefs:root=WIFI");
    } else {
      await Linking.openSettings();
    }
  };

  const handleWifiSelect = (network) => {
    setSelectedNetwork(network);
    setShowWifiModal(false);
    // Here you would typically handle the actual WiFi connection
    // For now, we'll just show an alert
    Alert.alert(
      "Connecting to WiFi",
      `Attempting to connect to ${network.ssid}...`,
      [{ text: "OK" }]
    );
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WelcomeScreen visible={showWelcome} onContinue={handleContinue} />
      <View style={styles.buttonContainer}>
        <Button title="Device Motion" onPress={() => setMode("motion")} />
        <Button title="Live" onPress={() => setMode("live")} />
        <Button title="Simulation" onPress={() => setMode("sim")} />
      </View>

      {mode === "motion" && (
        <View style={styles.dataContainer}>
          <Text style={styles.heading}>📱Device Motion</Text>
          <Text style={styles.label}>Acceleration (w/o gravity):</Text>
          <Text style={styles.value}>x: {acceleration?.x?.toFixed(2)}</Text>
          <Text style={styles.value}>y: {acceleration?.y?.toFixed(2)}</Text>
          <Text style={styles.value}>z: {acceleration?.z?.toFixed(2)}</Text>
          <Text style={styles.label}>Acceleration (with gravity):</Text>
          <Text style={styles.value}>
            x: {accelerationIncludingGravity?.x?.toFixed(2)}
          </Text>
          <Text style={styles.value}>
            y: {accelerationIncludingGravity?.y?.toFixed(2)}
          </Text>
          <Text style={styles.value}>
            z: {accelerationIncludingGravity?.z?.toFixed(2)}
          </Text>
          <Text style={styles.label}>Rotation (radians):</Text>
          <Text style={styles.value}>α: {rotation?.alpha?.toFixed(2)}</Text>
          <Text style={styles.value}>β: {rotation?.beta?.toFixed(2)}</Text>
          <Text style={styles.value}>γ: {rotation?.gamma?.toFixed(2)}</Text>
          <Text style={styles.label}>
            Orientation:{" "}
            {orientation === null ? "null" : orientation.toFixed(0)}
          </Text>
        </View>
      )}

      {mode === "live" && (
        <View style={styles.dataContainer}>
          <Text style={styles.heading}>Live Data</Text>
          <TouchableOpacity
            style={styles.wifiButton}
            onPress={() => setShowWifiModal(true)}
          >
            <Ionicons name="wifi" size={24} color="#007aff" />
            <Text style={styles.wifiButtonText}>
              {selectedNetwork
                ? `Connected to ${selectedNetwork.ssid}`
                : "Retrieve Data"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.value}>Real time data</Text>
        </View>
      )}

      {mode === "sim" && (
        <View style={styles.dataContainer}>
          <Text style={styles.heading}>Simulated OBD2 Data</Text>
          <Text style={styles.value}>
            Speed: {Math.round(obd2Data.speed)} mph
          </Text>
          <Text style={styles.value}>RPM: {Math.round(obd2Data.rpm)}</Text>
          <Text style={styles.value}>
            Throttle: {obd2Data.throttle.toFixed(1)} %
          </Text>

          <Text style={styles.subHeading}>Vehicle Speed Over Time</Text>
          <LineChart
            data={speedChartData}
            width={screenWidth * 0.9}
            height={220}
            chartConfig={chartConfig}
            style={styles.chartStyle}
            yAxisSuffix=" mph"
            yLabelsOffset={5}
            paddingRight={35}
            paddingLeft={0}
          />

          <Text style={styles.label}>Current Acceleration:</Text>
          <Text style={styles.value}>
            {currentAcceleration.toFixed(2)} mph/s
          </Text>
        </View>
      )}

      <View style={resetStyles.resetButtonContainer}>
        <TouchableOpacity
          style={resetStyles.resetButton}
          onPress={handleResetSplash}
        >
          <Text style={resetStyles.resetButtonText}>Reset Splash Status</Text>
        </TouchableOpacity>
      </View>

      <WifiSelectionModal
        visible={showWifiModal}
        onClose={() => setShowWifiModal(false)}
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
  dataContainer: {
    width: "90%",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 600,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#555",
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
    color: "#666",
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  wifiButtonText: {
    marginLeft: 8,
    color: "#007aff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
    marginTop: Platform.OS === "ios" ? 40 : 0,
    overflow: "hidden",
  },
  modalContent: {
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanButtonText: {
    marginLeft: 8,
    color: "#007aff",
    fontSize: 16,
    fontWeight: "500",
  },
  scanningContainer: {
    alignItems: "center",
    padding: 20,
  },
  scanningText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  networkList: {
    maxHeight: 400,
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  networkDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  networkStrength: {
    marginLeft: 8,
    color: "#666",
    fontSize: 16,
  },
  currentNetwork: {
    backgroundColor: "#f0f8ff",
  },
  passwordContainer: {
    padding: 20,
  },
  passwordTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  passwordButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  passwordButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  connectButton: {
    backgroundColor: "#007aff",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  connectButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  iosMessageContainer: {
    alignItems: "center",
    padding: 20,
  },
  iosMessageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  iosMessageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  iosSettingsButton: {
    backgroundColor: "#007aff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  iosSettingsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

const sheetStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 500,
    width: "100%",
    zIndex: 2,
  },
  iconContainer: {
    backgroundColor: "#007aff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  icon: {
    width: 64,
    height: 64,
    tintColor: "white",
    resizeMode: "contain",
  },
  title: {
    color: "#222",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    color: "#222",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  peopleContainer: {
    marginBottom: 12,
    marginTop: 8,
    alignItems: "center",
  },
  peopleIcon: {
    width: 32,
    height: 32,
    tintColor: "#007aff",
    resizeMode: "contain",
  },
  privacy: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 16,
  },
  button: {
    backgroundColor: "#007aff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    width: "100%",
    maxWidth: 320,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
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
