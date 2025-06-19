import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Linking,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { SPRING_CONFIG, TIMING_CONFIG } from "../utils/animationConfig";
import { PidConfigModal } from "./PidConfigModal";

export default function WifiSelectionModal({
  visible,
  onClose,
  onSelectNetwork,
}) {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);
  const [showPidConfig, setShowPidConfig] = useState(false);

  // Animated values for overlay and sheet
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(1000); // Start from below screen

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          ...TIMING_CONFIG,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          ...SPRING_CONFIG,
        }),
      ]).start();

      scanNetworks();
    } else if (showingModal) {
      setDismissing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          ...TIMING_CONFIG,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 1000, // Slide down below screen
          ...TIMING_CONFIG,
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
        ...TIMING_CONFIG,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 1000, // Slide down below screen
        ...TIMING_CONFIG,
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
      // Remove Android-specific behavior - show the same UI for both platforms
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to open settings: ${error.message}`.toString(),
        [{ text: "OK" }]
      );
    } finally {
      setScanning(false);
    }
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: overlayOpacity,
            backgroundColor: theme.dark
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.25)",
          },
        ]}
        pointerEvents={dismissing ? "none" : "auto"}
      />
      <Animated.View
        style={[
          styles.modalSheet,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              WiFi Settings
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.iosMessageContainer}>
            <Ionicons name="wifi" size={48} color={theme.primary} />
            <Text style={[styles.iosMessageTitle, { color: theme.text }]}>
              Connect to WiFi
            </Text>
            <Text
              style={[styles.iosMessageText, { color: theme.textSecondary }]}
            >
              To retrieve data from your OBD connector, please connect to its
              network.
            </Text>

            <TouchableOpacity
              style={[
                styles.iosSettingsButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                if (Platform.OS === "ios") {
                  Linking.openURL("App-Prefs:root=WIFI");
                } else {
                  Linking.sendIntent("android.settings.WIFI_SETTINGS");
                }
                handleClose();
              }}
            >
              <Text style={styles.iosSettingsButtonText}>Open Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pidConfigButton,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => setShowPidConfig(true)}
            >
              <MaterialCommunityIcons
                name="tune"
                size={20}
                color={theme.primary}
              />
              <Text
                style={[styles.pidConfigButtonText, { color: theme.primary }]}
              >
                Configure PIDs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <PidConfigModal
        visible={showPidConfig}
        onClose={() => setShowPidConfig(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  modalContent: {
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: -20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  iosMessageContainer: {
    alignItems: "center",
    padding: 20,
  },
  iosMessageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  iosMessageText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  iosSettingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
  },
  iosSettingsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  pidConfigButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pidConfigButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
