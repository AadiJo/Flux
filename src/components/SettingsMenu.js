import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { SPRING_CONFIG, TIMING_CONFIG } from "../utils/animationConfig";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { getStoredProtocol } from "../services/protocolDetectionService";

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
  const { speedingThreshold, updateSpeedingThreshold } = useSettings();
  const [showingModal, setShowingModal] = useState(visible);
  const [localThreshold, setLocalThreshold] = useState(speedingThreshold);
  const [protocolId, setProtocolId] = useState(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.95)).current;

  const simLogUri = FileSystem.documentDirectory + "sim_session_logs.jsonl";
  const realLogUri = FileSystem.documentDirectory + "real_session_logs.jsonl";

  useEffect(() => {
    if (visible) {
      setLocalThreshold(speedingThreshold);
      setShowingModal(true);
      overlayOpacity.setValue(0);
      menuScale.setValue(0.95);

      // Fetch the stored protocol when menu opens
      const fetchProtocol = async () => {
        const protocol = await getStoredProtocol();
        setProtocolId(protocol);
      };
      fetchProtocol();

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          ...TIMING_CONFIG,
        }),
        Animated.spring(menuScale, {
          toValue: 1,
          ...SPRING_CONFIG,
        }),
      ]).start();
    } else if (showingModal) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          ...TIMING_CONFIG,
        }),
        Animated.timing(menuScale, {
          toValue: 0.95,
          ...TIMING_CONFIG,
        }),
      ]).start(() => {
        setShowingModal(false);
      });
    }
  }, [visible, showingModal, overlayOpacity, menuScale, speedingThreshold]);

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
    onClose();
  };

  if (!showingModal) return null;
  return (
    <Modal
      visible={showingModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={[
          styles.modalOverlay,
          {
            backgroundColor: theme.dark
              ? "rgba(0, 0, 0, 0.98)"
              : "rgba(0, 0, 0, 0.65)",
          },
        ]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View
            style={[
              styles.menu,
              {
                backgroundColor: "transparent",
                opacity: overlayOpacity,
                transform: [{ scale: menuScale }],
              },
            ]}
          >
            <BlurView
              intensity={isDark ? 80 : 140}
              tint={isDark ? "dark" : "light"}
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(10, 10, 10, 0.4)"
                    : "rgba(255, 255, 255, 0.5)",
                  overflow: "hidden",
                  borderRadius: 16,
                },
              ]}
              experimentalBlurMethod="dimezis"
            />
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
                  onChangeText={(text) => setLocalThreshold(Number(text) || 0)}
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
            <View style={styles.separator} />
            <View style={styles.logActions}>
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
            <View style={styles.logActions}>
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
            <View style={styles.logActions}>
              <SettingButton
                label="Score Debug"
                icon="bug-outline"
                onPress={() => {
                  onClose();
                  // Navigate to score debug screen
                  // This would need navigation prop passed to SettingsMenu
                  console.log("Score debug pressed - implement navigation");
                }}
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
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    width: "80%",
    backgroundColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
    padding: 20,
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
});
