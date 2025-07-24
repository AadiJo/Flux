import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import NetInfo from "@react-native-community/netinfo";
import { LineChart } from "react-native-chart-kit";
import { MAX_SPEED_DATA_POINTS } from "../constants/chartConfig";
import { useLocation } from "../contexts/LocationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  startLogging,
  stopLogging,
  logData,
  clearLogs,
  getLogs,
} from "../services/loggingService";
import { getSpeedLimit } from "../services/mapService";
import { fetchWicanData } from "../services/wicanService";
import LogViewerModal from "../components/LogViewerModal";
import { 
  startBackgroundMonitoring, 
  stopBackgroundMonitoring, 
  isBackgroundMonitoringActive 
} from "../services/backgroundService";

const screenWidth = Dimensions.get("window").width;
const LAST_ALERT_KEY = "last_speeding_alert_timestamp";

const getDistanceInFeet = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;
  const lat1 = coord1.latitude;
  const lon1 = coord1.longitude;
  const lat2 = coord2.latitude;
  const lon2 = coord2.longitude;

  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  )
    return Infinity;

  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;
  return distanceInMeters * 3.28084;
};

export const LiveScreen = ({
  onOpenWifiModal,
  selectedNetwork,
  onResetSplash,
  showBanner,
  setSpeedingPins,
}) => {
  const { theme, isDark } = useTheme();
  const { speedingThreshold } = useSettings();
  const { location, streetName } = useLocation();
  const [isWicanSimulated, setIsWicanSimulated] = useState(false);
  const [isWicanConnected, setIsWicanConnected] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [networkDetails, setNetworkDetails] = useState(null);
  const [obd2Data, setObd2Data] = useState({
    speed: 0,
    rpm: 0,
    throttle: 0,
  });
  const [speedHistory, setSpeedHistory] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [speedLimit, setSpeedLimit] = useState(null);
  const [isBackgroundActive, setIsBackgroundActive] = useState(false);
  const dataInterval = useRef(null);
  const lastFetchFailed = useRef(false);
  const bannerShown = useRef(false);
  const lastStreetName = useRef(null);

  console.log("Speeding threshold on LiveScreen:", speedingThreshold);

  const isConnected = isWicanSimulated || isWicanConnected;
  const isDataAvailable = isApiConnected || isWicanSimulated;

  // Check background monitoring status on mount
  useEffect(() => {
    const checkBackgroundStatus = async () => {
      const active = await isBackgroundMonitoringActive();
      setIsBackgroundActive(active);
    };
    checkBackgroundStatus();
  }, []);

  useEffect(() => {
    if (isDataAvailable && !bannerShown.current) {
      showBanner({ message: "Connected!", backgroundColor: "#4CAF50" });
      bannerShown.current = true;
    } else if (!isDataAvailable) {
      bannerShown.current = false;
    }
  }, [isDataAvailable, showBanner]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log("Network state changed:", state);
      if (state.type === "wifi" && state.isConnected) {
        setNetworkDetails(state.details);
        setIsWicanConnected(true);
        console.log("WiFi connected:", state.details);
      } else {
        setIsWicanConnected(false);
        setNetworkDetails(null);
        console.log("WiFi disconnected");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      console.log("Starting data polling...");
      fetchData();
      dataInterval.current = setInterval(fetchData, 1000); // Poll every second    } else {
      console.log("Stopping data polling...");
      if (dataInterval.current) {
        clearInterval(dataInterval.current);
        dataInterval.current = null;
      }
      setObd2Data({ speed: 0, rpm: 0, throttle: 0 });
      setSpeedHistory([]);
      setIsApiConnected(false);
      lastFetchFailed.current = false;
    }

    return () => {
      if (dataInterval.current) {
        clearInterval(dataInterval.current);
      }
    };
  }, [isConnected]);
  useEffect(() => {
    if (isLogging) {
      startLogging("real", { streetName });
    } else {
      stopLogging("real", { lastStreetName: lastStreetName.current }).then(
        () => {
          analyzeLogs();
        }
      );
    }
  }, [isLogging, streetName]);

  // Update last street name reference
  useEffect(() => {
    if (streetName) {
      lastStreetName.current = streetName;
    }
  }, [streetName]);

  // Handle connection state changes for logging markers
  useEffect(() => {
    const handleConnectionChange = async () => {
      if (isDataAvailable && !isLogging) {
        // Auto-start logging when connection is established
        setIsLogging(true);
      } else if (!isDataAvailable && isLogging) {
        // Auto-stop logging when connection is lost
        setIsLogging(false);
      }
    };

    handleConnectionChange();
  }, [isDataAvailable]);

  useEffect(() => {
    const fetchSpeedLimit = async () => {
      if (location) {
        const limit = await getSpeedLimit(
          location.coords.latitude,
          location.coords.longitude
        );
        setSpeedLimit(limit);
      }
    };

    fetchSpeedLimit();
    const speedLimitInterval = setInterval(fetchSpeedLimit, 5000); // Fetch every 5 seconds

    return () => clearInterval(speedLimitInterval);
  }, [location]);

  useEffect(() => {
    if (isLogging) {
      logData("real", {
        obd2Data,
        location: location?.coords,
        streetName,
        speedLimit,
      });
    }
  }, [isLogging, obd2Data, location, streetName, speedLimit]);
  const fetchData = async () => {
    if (isWicanSimulated) {
      console.log("Fetching simulated data...");
      const newObd2Data = {
        speed: Math.floor(60 + Math.random() * 10 - 5),
        rpm: Math.floor(2000 + Math.random() * 500 - 250),
        throttle: parseFloat((40 + Math.random() * 10 - 5).toFixed(1)),
      };
      setObd2Data(newObd2Data);
      setSpeedHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, newObd2Data.speed];
        return updatedHistory.length > MAX_SPEED_DATA_POINTS
          ? updatedHistory.slice(-MAX_SPEED_DATA_POINTS)
          : updatedHistory;
      });
      if (!isApiConnected) {
        setIsApiConnected(true);
      }
      if (lastFetchFailed.current) {
        console.log("Connection to WiCAN re-established.");
        lastFetchFailed.current = false;
      }
    } else {
      console.log("Fetching real WiCAN data...");
      try {
        const newObd2Data = await fetchWicanData();
        console.log("Received WiCAN data:", newObd2Data);
        setObd2Data(newObd2Data);
        setSpeedHistory((prevHistory) => {
          const updatedHistory = [...prevHistory, newObd2Data.speed];
          return updatedHistory.length > MAX_SPEED_DATA_POINTS
            ? updatedHistory.slice(-MAX_SPEED_DATA_POINTS)
            : updatedHistory;
        });
        if (!isApiConnected) {
          console.log("API connection established");
          setIsApiConnected(true);
        }
        if (lastFetchFailed.current) {
          console.log("Connection to WiCAN re-established.");
          lastFetchFailed.current = false;
        }
      } catch (error) {
        console.log("Failed to fetch WiCAN data:", error.message);
        if (isApiConnected) {
          console.log("API connection lost");
          setIsApiConnected(false);
        }
        if (!lastFetchFailed.current) {
          console.log(
            "Failed to fetch WiCAN data. Further errors will be suppressed until connection is re-established.",
            error.message
          );
          lastFetchFailed.current = true;
        }
      }
    }
  };

  const analyzeLogs = async () => {
    const logs = await getLogs("real");
    const speedingLogs = logs.filter((log) => {
      const speed = log.obd2Data?.speed;
      const limit = log.speedLimit;
      return (
        speed &&
        limit &&
        log.location &&
        Math.abs(speed - limit) > speedingThreshold
      );
    });

    // Get the last alert timestamp first
    const lastAlertStr = await AsyncStorage.getItem(LAST_ALERT_KEY);
    const lastAlertTime = lastAlertStr ? parseInt(lastAlertStr, 10) : 0;

    const uniquePins = [];
    const newUniquePins = [];
    for (const log of speedingLogs) {
      const newPin = {
        latitude: log.location.latitude,
        longitude: log.location.longitude,
        speed: log.obd2Data.speed,
        speedLimit: log.speedLimit,
        timestamp: log.timestamp,
      };

      let isTooClose = false;
      for (const existingPin of uniquePins) {
        if (getDistanceInFeet(newPin, existingPin) < 100) {
          isTooClose = true;
          break;
        }
      }

      if (!isTooClose) {
        uniquePins.push(newPin);
        // Check if this is a new event
        if (new Date(log.timestamp).getTime() > lastAlertTime) {
          newUniquePins.push(newPin);
        }
      }
    }

    if (uniquePins.length > 0) {
      setSpeedingPins(uniquePins);

      // Only show alert if we have new speeding events
      if (newUniquePins.length > 0) {
        const mostRecentTimestamp = Math.max(
          ...newUniquePins.map((pin) => new Date(pin.timestamp).getTime())
        );
        const eventText =
          newUniquePins.length === 1
            ? "1 new speeding event has been marked on the map."
            : `${newUniquePins.length} new speeding events have been marked on the map.`;

        Alert.alert("Speeding Detected", eventText);
        // Update the last alert timestamp
        await AsyncStorage.setItem(
          LAST_ALERT_KEY,
          mostRecentTimestamp.toString()
        );
      }
    }
  };

  const handleSimulationToggle = (value) => {
    setIsWicanSimulated(value);
  };

  const showNetworkDebug = () => {
    if (networkDetails) {
      const { ssid, ipAddress, strength, bssid, frequency, subnet } =
        networkDetails;
      const infoString = `SSID: ${ssid || "N/A"}\nIP Address: ${
        ipAddress || "N/A"
      }\nSignal Strength: ${
        strength !== undefined ? `${strength}%` : "N/A"
      }\nBSSID: ${bssid || "N/A"}\nFrequency: ${
        frequency !== undefined ? `${frequency} MHz` : "N/A"
      }\nSubnet: ${subnet || "N/A"}`.toString(); // Ensure infoString is a valid string
      Alert.alert("Network Debug", infoString);
    } else {
      Alert.alert(
        "Network Debug",
        "No Wi-Fi network details available. Connect to a Wi-Fi network to see details."
      );
    }
  };

  const handleBackgroundToggle = async () => {
    try {
      if (isBackgroundActive) {
        const result = await stopBackgroundMonitoring();
        if (result.success) {
          setIsBackgroundActive(false);
          Alert.alert(
            'Background Monitoring Disabled',
            'Flux will only collect data when the app is active.'
          );
        }
      } else {
        Alert.alert(
          'Enable Background Monitoring',
          'Flux will continue monitoring your driving when you switch to other apps. This may affect battery life.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                const result = await startBackgroundMonitoring();
                if (result.success) {
                  setIsBackgroundActive(true);
                  Alert.alert(
                    'Background Monitoring Enabled',
                    'Flux will now continue collecting OBD data when you switch to other apps.'
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling background monitoring:', error);
      Alert.alert('Error', 'Failed to toggle background monitoring.');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      "Clear Logs",
      "Are you sure you want to delete all logs for this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: () => clearLogs("real"),
          style: "destructive",
        },
      ]
    );
  };

  const viewLogs = () => setIsModalVisible(true);

  const speedChartData = {
    labels: [],
    datasets: [
      {
        data: speedHistory.length > 0 ? speedHistory : [0],
        color: (opacity = 1) =>
          isDark
            ? `rgba(255, 255, 255, ${opacity})`
            : `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartBaseConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    },
  };

  const getDotColor = (dataPoint) => {
    if (speedLimit && dataPoint > speedLimit) {
      return theme.error;
    }
    return speedChartData.datasets[0].color(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.headerButton} onPress={onResetSplash}>
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={viewLogs}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClearLogs}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={24}
              color={theme.error}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBackgroundToggle}
          >
            <MaterialCommunityIcons
              name={isBackgroundActive ? "cloud-check" : "cloud-off-outline"}
              size={24}
              color={isBackgroundActive ? theme.success : theme.textSecondary}
            />
          </TouchableOpacity>
          {isDataAvailable && (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={showNetworkDebug}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={24}
                  color={theme.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsLogging(!isLogging)}
              >
                <MaterialCommunityIcons
                  name={isLogging ? "pause-circle" : "play-circle"}
                  size={24}
                  color={isLogging ? theme.error : theme.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={{ flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ color: theme.text, marginRight: 8 }}>
              Simulate WiCAN
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: theme.primary }}
              thumbColor={isWicanSimulated ? theme.card : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleSimulationToggle}
              value={isWicanSimulated}
            />
          </View>
          {isBackgroundActive && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="cloud-check"
                size={16}
                color={theme.success}
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: theme.success, fontSize: 12 }}>
                Background Active
              </Text>
            </View>
          )}
        </View>
      </View>

      <LogViewerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        logType="real"
      />

      <View
        style={[
          styles.dataContainer,
          {
            backgroundColor: theme.card,
            shadowColor: theme.shadow,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.heading, { color: theme.text }]}>Live Data</Text>
        {!isDataAvailable ? (
          <>
            <TouchableOpacity
              style={[
                styles.wifiButton,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.15)", // Darkened background for Android
                  shadowColor: theme.shadow,
                  elevation: Platform.OS === "android" ? 0 : 2, // Remove elevation for Android
                },
              ]}
              onPress={onOpenWifiModal}
            >
              <Ionicons name="wifi" size={24} color={theme.primary} />
              <Text style={[styles.wifiButtonText, { color: theme.primary }]}>
                {selectedNetwork
                  ? `Connected to ${selectedNetwork.ssid}`
                  : "Retrieve Data"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.subHeading, { color: theme.text }]}>
              Vehicle Speed Over Time
            </Text>
            <LineChart
              key={isDark ? "dark-empty" : "light-empty"}
              data={{ labels: [], datasets: [{ data: [0] }] }}
              width={screenWidth * 0.9}
              height={220}
              chartConfig={chartBaseConfig}
              style={styles.chartStyle}
            />
          </>
        ) : (
          <>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              Speed: {Math.round(obd2Data.speed)} mph
            </Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              RPM: {Math.round(obd2Data.rpm)}
            </Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              Throttle: {obd2Data.throttle.toFixed(1)} %
            </Text>
            <Text style={[styles.value, { color: theme.textSecondary }]}>
              Speed Limit:{" "}
              {speedLimit ? `${Math.round(speedLimit)} mph` : "N/A"}
            </Text>
            <Text style={[styles.subHeading, { color: theme.text }]}>
              Vehicle Speed Over Time
            </Text>
            <LineChart
              key={isDark ? "dark" : "light"}
              data={speedChartData}
              width={screenWidth * 0.9}
              height={220}
              chartConfig={chartBaseConfig}
              style={styles.chartStyle}
              yAxisSuffix=" mph"
              yLabelsOffset={5}
              paddingRight={35}
              paddingLeft={0}
              getDotColor={getDotColor}
            />
            <Text
              style={[
                styles.value,
                { color: theme.textSecondary, marginTop: 10 },
              ]}
            >
              Delta from Speed Limit:{" "}
              {speedLimit !== null
                ? `${Math.round(obd2Data.speed - speedLimit)} mph`
                : "N/A"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  dataContainer: {
    width: "90%",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 600,
    borderWidth: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
  },
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  wifiButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
});
