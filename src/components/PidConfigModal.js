import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { detectProtocol } from "../services/protocolDetectionService";

const screenHeight = Dimensions.get("window").height;

export const PidConfigModal = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [scanStatus, setScanStatus] = React.useState(null);
  const [detectedProtocol, setDetectedProtocol] = React.useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleProtocolDetection = async () => {
    setScanStatus("scanning");
    setDetectedProtocol(null);
    const result = await detectProtocol();
    if (result.success) {
      setDetectedProtocol(result.protocol);
      setScanStatus("success");
    } else {
      setScanStatus("error");
    }
    setTimeout(() => {
      if (result.success) {
        handleClose();
      } else {
        setScanStatus(null);
      }
    }, 2000);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} onRequestClose={handleClose}>
      <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.card,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Configure Protocol
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Detect the correct OBD-II protocol for your vehicle. This will test
            protocols 6-9 to find the one that works with your car.
          </Text>

          {detectedProtocol && (
            <Text style={[styles.protocolText, { color: theme.success }]}>
              Protocol {detectedProtocol} detected!
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: theme.card,
                borderColor:
                  scanStatus === "success"
                    ? theme.success
                    : scanStatus === "error"
                    ? theme.error
                    : theme.primary,
                opacity: scanStatus === "scanning" ? 0.6 : 1,
              },
            ]}
            onPress={handleProtocolDetection}
            disabled={scanStatus === "scanning"}
          >
            {scanStatus === "scanning" ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color={theme.text} style={styles.spinner} />
                <Text style={[styles.scanButtonText, { color: theme.text }]}>
                  Configuring...
                </Text>
              </View>
            ) : (
              <Text style={[styles.scanButtonText, { color: theme.text }]}>
                {scanStatus === "success"
                  ? "Protocol Configured!"
                  : scanStatus === "error"
                  ? "Configuration Failed"
                  : "Configure"}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 600,
    maxHeight: "80%",
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  protocolText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  scanButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 24,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: 10,
  },
});
