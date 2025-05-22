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
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

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
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ translateY: contentTranslateY }],
              width: "100%",
            }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  WiFi Settings
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.iosMessageContainer}>
                <Ionicons name="wifi" size={48} color={theme.primary} />
                <Text style={[styles.iosMessageTitle, { color: theme.text }]}>
                  Connect to WiFi
                </Text>
                <Text
                  style={[
                    styles.iosMessageText,
                    { color: theme.textSecondary },
                  ]}
                >
                  To retrieve data from your OBD connector, please connect to
                  its network.
                </Text>
                <TouchableOpacity
                  style={[
                    styles.iosSettingsButton,
                    { backgroundColor: theme.primary },
                  ]}
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
      <View
        style={[
          styles.modalSheet,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ translateY: contentTranslateY }],
            width: "100%",
          }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Retrieve Data
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.card }]}
              onPress={scanNetworks}
            >
              <Ionicons name="refresh" size={20} color={theme.primary} />
              <Text style={[styles.scanButtonText, { color: theme.primary }]}>
                Scan for Networks
              </Text>
            </TouchableOpacity>

            {scanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text
                  style={[styles.scanningText, { color: theme.textSecondary }]}
                >
                  Scanning for networks...
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
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
