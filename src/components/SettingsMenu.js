import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { getStoredProtocol } from "../services/protocolDetectionService";
import { migrateAllLogs } from "../utils/logMigration";
import { scoreManager } from "../utils/scoreManager";
import { clearCachedScore } from "../services/scoringService";
import { BackgroundMonitoringCard } from "./BackgroundMonitoringCard";
import { createLogger } from "../utils/debugLogger";

const logger = createLogger('SettingsMenu');

const SettingButton = ({ label, icon, onPress, theme }) => (
  <TouchableOpacity
    style={[
      styles.settingButton,
      {
        backgroundColor: theme.card,
        borderColor: theme.primary,
        shadowColor: theme.primary,
        ...(theme.dark && {
          shadowOpacity: 0.7,
          shadowRadius: 10,
          elevation: 10,
        }),
      },
    ]}
    onPress={onPress}
  >
    <MaterialCommunityIcons name={icon} size={24} color={theme.primary} />
    <Text style={[styles.settingButtonLabel, { color: theme.text }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const SettingsMenu = ({
  visible,
  onClose,
  updateSpeedingPinsFromLogs,
}) => {
  const { theme, isDark } = useTheme();
  const { speedingThreshold, updateSpeedingThreshold, scoreProvider, updateScoreProvider, debugLogging, updateDebugLogging } = useSettings();
  const [showingModal, setShowingModal] = useState(visible);
  const [localThreshold, setLocalThreshold] = useState(speedingThreshold);
  const [localScoreProvider, setLocalScoreProvider] = useState(scoreProvider);
  const [showScoreProviderDropdown, setShowScoreProviderDropdown] = useState(false);
  const [protocolId, setProtocolId] = useState(null);

  const scoreProviderOptions = ["Flux"]; // Only Flux for now
  const screenHeight = Dimensions.get("window").height;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const simLogUri = FileSystem.documentDirectory + "sim_session_logs.jsonl";
  const realLogUri = FileSystem.documentDirectory + "real_session_logs.jsonl";

  useEffect(() => {
    if (visible) {
      setLocalThreshold(speedingThreshold);
      setLocalScoreProvider(scoreProvider);
      setShowingModal(true);
      
      // Reset and start fade in animation for background
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Fetch the stored protocol when menu opens
      const fetchProtocol = async () => {
        try {
          const protocol = await getStoredProtocol();
          setProtocolId(protocol);
        } catch (error) {
          console.error("Error fetching protocol:", error);
          setProtocolId(null);
        }
      };
      fetchProtocol();
    } else if (showingModal) {
      // Fade out background before closing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowingModal(false);
      });
    }
  }, [visible, showingModal, speedingThreshold, scoreProvider, fadeAnim]);

  const handleExport = async (logType) => {
    const uri = logType === "sim" ? simLogUri : realLogUri;
    const logName =
      logType === "sim" ? "sim_session_logs.jsonl" : "real_session_logs.jsonl";
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert("Export Error", `Log file ${logName} does not exist.`);
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Error exporting log:", error);
      Alert.alert("Export Error", "Could not export the log file.");
    }
  };

  const handleImport = async (logType) => {
    const uri = logType === "sim" ? simLogUri : realLogUri;
    const logName =
      logType === "sim" ? "sim_session_logs.jsonl" : "real_session_logs.jsonl";
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        await FileSystem.copyAsync({
          from: pickedUri,
          to: uri,
        });
        Alert.alert(
          "Import Successful",
          `Log file ${logName} has been imported.`,
          [{ text: "OK", onPress: () => updateSpeedingPinsFromLogs() }]
        );
      }
    } catch (error) {
      console.error("Error importing log:", error);
      Alert.alert("Import Error", "Could not import the log file.");
    }
  };

  const handleIncrement = () => {
    setLocalThreshold((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setLocalThreshold((prev) => Math.max(0, prev - 1)); // Don't allow negative values
  };

  const handleClose = () => {
    updateSpeedingThreshold(localThreshold);
    updateScoreProvider(localScoreProvider);
    onClose(); // This will trigger useEffect to handle animation
  };

  const handleMigrateLogs = async () => {
    Alert.alert(
      "Migrate Logs",
      "This will add acceleration data to all existing log entries. This process may take a few moments.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Migrate",
          onPress: async () => {
            try {
              const result = await migrateAllLogs();
              if (result.sim || result.real) {
                Alert.alert(
                  "Migration Complete",
                  "Log files have been successfully updated with acceleration data."
                );
              } else {
                Alert.alert(
                  "Migration Info",
                  "No log files found to migrate or they already contain acceleration data."
                );
              }
            } catch (error) {
              console.error("Migration error:", error);
              Alert.alert(
                "Migration Error",
                "Failed to migrate log files. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleForceRefreshScores = async () => {
    Alert.alert(
      "Force Refresh Scores",
      "This will clear all cached score data and recalculate scores from scratch. This may help if you're seeing 0 acceleration events or outdated scores.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Refresh",
          onPress: async () => {
            try {
              // Clear cached score data
              await clearCachedScore();

              // Force refresh scores using the score manager
              await scoreManager.refreshScores(speedingThreshold, true);

              Alert.alert(
                "Refresh Complete",
                "Safety scores have been recalculated from scratch. You should now see updated acceleration events and scores."
              );
            } catch (error) {
              console.error("Force refresh error:", error);
              Alert.alert(
                "Refresh Error",
                "Failed to refresh scores. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleDebugLogs = async () => {
    try {
      // Import the necessary functions
      const { getTripsFromLogs, getAllTrips, getLogs } = await import(
        "../services/loggingService"
      );
      const { calculateSafetyScore } = await import(
        "../services/scoringService"
      );

      // Get real trips and logs
      const realTrips = await getTripsFromLogs("real");
      const allTrips = await getAllTrips();
      const realLogs = await getLogs("real");

      logger.debug("=== COMPREHENSIVE DEBUG LOG INFO ===");
      console.log("Real logs count:", realLogs?.length || 0);
      console.log("Real trips count:", realTrips?.length || 0);
      console.log("All trips count:", allTrips?.length || 0);

      // Analyze raw logs
      if (realLogs && realLogs.length > 0) {
        let totalWithAcceleration = 0;
        let positiveAcceleration = 0;
        let nullAcceleration = 0;
        let zeroAcceleration = 0;
        let negativeAcceleration = 0;

        realLogs.forEach((log) => {
          if (log.acceleration !== null && log.acceleration !== undefined) {
            totalWithAcceleration++;
            if (log.acceleration > 0) positiveAcceleration++;
            else if (log.acceleration === 0) zeroAcceleration++;
            else if (log.acceleration < 0) negativeAcceleration++;
          } else {
            nullAcceleration++;
          }
        });

        console.log("RAW LOGS ANALYSIS:");
        console.log(`- Total logs: ${realLogs.length}`);
        console.log(`- With acceleration data: ${totalWithAcceleration}`);
        console.log(`- Null acceleration: ${nullAcceleration}`);
        console.log(`- Zero acceleration: ${zeroAcceleration}`);
        console.log(`- Positive acceleration: ${positiveAcceleration}`);
        console.log(`- Negative acceleration: ${negativeAcceleration}`);

        // Sample first 10 logs with acceleration data
        const accelerationSamples = realLogs
          .filter(
            (log) => log.acceleration !== null && log.acceleration !== undefined
          )
          .slice(0, 10)
          .map((log, i) => ({
            index: i,
            timestamp: log.timestamp,
            acceleration: log.acceleration,
            speed: log.obd2Data?.speed,
          }));
        console.log("First 10 acceleration samples:", accelerationSamples);
      }

      // Analyze trips
      if (realTrips && realTrips.length > 0) {
        console.log("\nTRIPS ANALYSIS:");
        let totalTripLogs = 0;
        let totalAccelerationInTrips = 0;

        realTrips.forEach((trip, index) => {
          const tripLogCount = trip.logs?.length || 0;
          totalTripLogs += tripLogCount;

          const tripAccelerationCount =
            trip.logs?.filter(
              (log) =>
                log.acceleration !== null &&
                log.acceleration !== undefined &&
                log.acceleration > 0
            ).length || 0;
          totalAccelerationInTrips += tripAccelerationCount;

          console.log(`Trip ${index + 1}:`, {
            id: trip.id,
            logsCount: tripLogCount,
            positiveAcceleration: tripAccelerationCount,
            startTime: trip.startTime,
            endTime: trip.endTime,
            roadName: trip.roadName,
            hasAccelerationData:
              trip.logs?.some(
                (log) =>
                  log.acceleration !== null && log.acceleration !== undefined
              ) || false,
          });
        });

        console.log(`\nTRIPS SUMMARY:`);
        console.log(`- Total logs in trips: ${totalTripLogs}`);
        console.log(
          `- Total positive acceleration events in trips: ${totalAccelerationInTrips}`
        );
      }

      // Calculate score using the actual app logic
      try {
        console.log("\nCALCULATING SCORE WITH APP LOGIC:");
        const scoreData = await calculateSafetyScore(speedingThreshold);
        console.log("App calculated metrics:", {
          totalAccelerationEvents: scoreData.metrics?.totalAccelerationEvents,
          averageAcceleration: scoreData.metrics?.averageAcceleration,
          accelerationScore: scoreData.accelerationScore,
          tripsAnalyzed: scoreData.tripsAnalyzed,
        });
      } catch (error) {
        console.error("Error calculating score:", error);
      }

      Alert.alert(
        "Debug Info",
        `Raw logs: ${realLogs?.length || 0}\nTrips: ${
          realTrips?.length || 0
        }\nPositive acceleration in raw logs: ${
          realLogs?.filter((log) => log.acceleration > 0).length || 0
        }\n\nCheck console for detailed analysis.`
      );
    } catch (error) {
      console.error("Debug error:", error);
      Alert.alert(
        "Debug Error",
        "Failed to get debug info. Check console for details."
      );
    }
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay, 
          { 
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            opacity: fadeAnim 
          }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            setShowScoreProviderDropdown(false);
            handleClose();
          }}
        />
        <Animated.View
          style={[
            styles.menu,
            {
              backgroundColor: theme.card,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
              <View style={styles.settingOption}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Speeding Threshold
                </Text>
                <View style={styles.valueContainer}>
                  <TouchableOpacity
                    onPress={handleDecrement}
                    style={styles.button}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={24}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.valueInput,
                      { color: theme.text, borderColor: theme.border },
                    ]}
                    value={String(localThreshold)}
                    onChangeText={(text) => {
                      const numValue = parseInt(text, 10);
                      setLocalThreshold(isNaN(numValue) ? 0 : numValue);
                    }}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    onPress={handleIncrement}
                    style={styles.button}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={24}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingOption}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Score Provider
                </Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => setShowScoreProviderDropdown(!showScoreProviderDropdown)}
                  >
                    <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                      {localScoreProvider}
                    </Text>
                    <MaterialCommunityIcons
                      name={showScoreProviderDropdown ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                  
                  {showScoreProviderDropdown && (
                    <View
                      style={[
                        styles.dropdownContainer,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {scoreProviderOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.dropdownOption,
                            localScoreProvider === option && {
                              backgroundColor: theme.primary + "20",
                            },
                          ]}
                          onPress={() => {
                            setLocalScoreProvider(option);
                            setShowScoreProviderDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              {
                                color: localScoreProvider === option ? theme.primary : theme.text,
                                fontWeight: localScoreProvider === option ? "600" : "400",
                              },
                            ]}
                          >
                            {option}
                          </Text>
                          {localScoreProvider === option && (
                            <MaterialCommunityIcons
                              name="check"
                              size={20}
                              color={theme.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.settingOption}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  Debug Logging
                </Text>
                <Switch
                  value={debugLogging}
                  onValueChange={(value) => {
                    updateDebugLogging(value);
                    logger.userAction(`Debug logging ${value ? 'enabled' : 'disabled'}`);
                  }}
                  trackColor={{ false: theme.border, true: theme.primary + "40" }}
                  thumbColor={debugLogging ? theme.primary : theme.textSecondary}
                />
              </View>

              <BackgroundMonitoringCard />

              <View style={styles.separator} />

              <View key="sim-actions" style={styles.logActions}>
                <SettingButton
                  label="Import Sim"
                  icon="file-import-outline"
                  onPress={() => handleImport("sim")}
                  theme={theme}
                />
                <SettingButton
                  label="Export Sim"
                  icon="file-export-outline"
                  onPress={() => handleExport("sim")}
                  theme={theme}
                />
              </View>

              <View key="real-actions" style={styles.logActions}>
                <SettingButton
                  label="Import Real"
                  icon="file-import-outline"
                  onPress={() => handleImport("real")}
                  theme={theme}
                />
                <SettingButton
                  label="Export Real"
                  icon="file-export-outline"
                  onPress={() => handleExport("real")}
                  theme={theme}
                />
              </View>

              <View style={styles.separator} />

              <View key="tools-actions" style={styles.logActions}>
                <SettingButton
                  label="Migrate Logs"
                  icon="database-sync-outline"
                  onPress={handleMigrateLogs}
                  theme={theme}
                />
                <SettingButton
                  label="Refresh Scores"
                  icon="refresh"
                  onPress={handleForceRefreshScores}
                  theme={theme}
                />
              </View>

              <View style={styles.separator} />

              <View key="debug-actions" style={styles.logActions}>
                <SettingButton
                  label="Score Debug"
                  icon="bug-outline"
                  onPress={() => {
                    onClose();
                    // Navigate to score debug screen
                    // This would need navigation prop passed to SettingsMenu
                    logger.info("Score debug pressed - implement navigation");
                  }}
                  theme={theme}
                />
                <SettingButton
                  label="Debug Logs"
                  icon="bug-check-outline"
                  onPress={handleDebugLogs}
                  theme={theme}
                />
              </View>

              <View style={styles.separator} />

              <Text style={[styles.protocolText, { color: theme.textSecondary }]}>
                {protocolId
                  ? `OBD Protocol: ${protocolId}`
                  : "No OBD Protocol Configured"}
              </Text>

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    width: "98%",
    maxHeight: "80%",
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  settingOption: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 15,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: "600",
    width: 60,
    marginHorizontal: 10,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 15,
  },
  logActions: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    gap: 30,
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  settingButtonLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  protocolText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "500",
  },
  dropdownWrapper: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
    zIndex: 1001,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
});
