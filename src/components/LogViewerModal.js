import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { getLogs } from "../services/loggingService";

const screenHeight = Dimensions.get("window").height;

const LogViewerModal = ({ visible, onClose, logType }) => {
  const { theme } = useTheme();
  const { speedingThreshold } = useSettings();
  const [logs, setLogs] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    let interval;
    if (visible) {
      const fetchLogs = async () => {
        const fetchedLogs = await getLogs(logType);
        setLogs(fetchedLogs);
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 1000); // Poll every second
      // Start animations
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
      setLogs([]);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [visible]);

  const handleClose = () => {
    // Animate out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const renderLogEntry = (entry, index) => {
    if (!entry) {
      return null;
    }

    // Handle connection markers differently
    if (entry.type === "CONNECTION_MARKER") {
      const isConnected = entry.state === "CONNECTED";
      const backgroundColor = isConnected
        ? "rgba(76, 175, 80, 0.2)" // Green for connected
        : "rgba(244, 67, 54, 0.2)"; // Red for disconnected

      return (
        <View
          key={index}
          style={[
            styles.logEntryContainer,
            styles.connectionMarkerContainer,
            { backgroundColor },
          ]}
        >
          <View style={styles.connectionMarkerHeader}>
            <Ionicons
              name={isConnected ? "link" : "unlink"}
              size={20}
              color={isConnected ? "#4CAF50" : "#F44336"}
            />
            <Text
              style={[
                styles.connectionMarkerTitle,
                { color: isConnected ? "#4CAF50" : "#F44336" },
              ]}
            >
              {entry.state}
            </Text>
          </View>
          <Text style={[styles.logTimestamp, { color: theme.text }]}>
            {new Date(entry.timestamp).toLocaleString()}
          </Text>
          <Text
            style={[
              styles.connectionMarkerMessage,
              { color: theme.textSecondary },
            ]}
          >
            {entry.message}
          </Text>
          {entry.streetName && (
            <Text style={[styles.logText, { color: theme.textSecondary }]}>
              Street: {entry.streetName}
            </Text>
          )}
          {entry.lastStreetName && (
            <Text style={[styles.logText, { color: theme.textSecondary }]}>
              Last Street: {entry.lastStreetName}
            </Text>
          )}
        </View>
      );
    }

    // Handle unsafe turning events
    if (entry.type === "UNSAFE_TURNING") {
      const severityColor = entry.severity === "HIGH" ? "#FF0000" : "#FF8C00";
      const backgroundColor = entry.severity === "HIGH" 
        ? "rgba(255, 0, 0, 0.3)" 
        : "rgba(255, 140, 0, 0.3)";

      return (
        <View
          key={index}
          style={[
            styles.logEntryContainer,
            styles.connectionMarkerContainer,
            { backgroundColor, borderColor: severityColor },
          ]}
        >
          <View style={styles.connectionMarkerHeader}>
            <Ionicons
              name="warning"
              size={20}
              color={severityColor}
            />
            <Text
              style={[
                styles.connectionMarkerTitle,
                { color: severityColor },
              ]}
            >
              🚨 UNSAFE TURNING EVENT - {entry.severity} SEVERITY
            </Text>
          </View>
          <Text style={[styles.logTimestamp, { color: theme.text }]}>
            {new Date(entry.timestamp).toLocaleString()}
          </Text>
          <Text
            style={[
              styles.connectionMarkerMessage,
              { color: theme.textSecondary },
            ]}
          >
            {entry.message}
          </Text>
          <Text style={[styles.logText, { color: theme.textSecondary }]}>
            G-Force Values: X: {entry.gForce.x}g, Y: {entry.gForce.y}g, Z: {entry.gForce.z}g
          </Text>
          <Text style={[styles.logText, { color: severityColor, fontWeight: "bold" }]}>
            Maximum G-Force: {entry.gForce.max}g (Threshold: {entry.threshold}g)
          </Text>
          {entry.streetName && (
            <Text style={[styles.logText, { color: theme.textSecondary }]}>
              Location: {entry.streetName}
            </Text>
          )}
        </View>
      );
    }

    // Handle regular data entries
    const {
      timestamp,
      obd2Data,
      location,
      streetName,
      speedLimit,
      acceleration,
      turningAnalysis,
    } = entry;
    const isSpeeding =
      obd2Data?.speed &&
      speedLimit &&
      Math.abs(obd2Data.speed - speedLimit) > speedingThreshold;

    // Determine if this entry has unsafe turning
    const hasUnsafeTurning = turningAnalysis?.isUnsafeTurning;
    const turningSeverity = turningAnalysis?.severity;

    // Set background color based on safety status
    let backgroundColor = "transparent";
    if (hasUnsafeTurning && turningSeverity === "HIGH") {
      backgroundColor = "rgba(255, 0, 0, 0.25)"; // Red for high severity
    } else if (hasUnsafeTurning && turningSeverity === "MEDIUM") {
      backgroundColor = "rgba(255, 165, 0, 0.25)"; // Orange for medium severity
    } else if (isSpeeding) {
      backgroundColor = "rgba(255, 0, 0, 0.15)"; // Light red for speeding
    }

    return (
      <View
        key={index}
        style={[
          styles.logEntryContainer,
          { backgroundColor },
        ]}
      >
        <Text style={[styles.logTimestamp, { color: theme.text }]}>
          {new Date(timestamp).toLocaleString()}
        </Text>
        
        {/* Unsafe Turning Alert */}
        {hasUnsafeTurning && (
          <View style={styles.unsafeTurningAlert}>
            <Ionicons
              name="warning"
              size={16}
              color={turningSeverity === "HIGH" ? "#FF0000" : "#FF8C00"}
            />
            <Text
              style={[
                styles.unsafeTurningText,
                {
                  color: turningSeverity === "HIGH" ? "#FF0000" : "#FF8C00",
                  fontWeight: "bold",
                },
              ]}
            >
              ⚠️ UNSAFE TURNING DETECTED - {turningSeverity} SEVERITY
            </Text>
          </View>
        )}
        
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Speed: {obd2Data?.speed?.toFixed(2)} mph, RPM:{" "}
          {obd2Data?.rpm?.toFixed(2)}, Throttle:{" "}
          {obd2Data?.throttle?.toFixed(2)}%
        </Text>
        {acceleration !== null && acceleration !== undefined && (
          <Text style={[styles.logText, { color: theme.textSecondary }]}>
            Acceleration: {acceleration > 0 ? "+" : ""}
            {acceleration?.toFixed(2)} mph/s
            {acceleration > 0
              ? " (accelerating)"
              : acceleration < 0
              ? " (braking)"
              : " (steady)"}
          </Text>
        )}
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Location: {location?.latitude?.toFixed(4)},{" "}
          {location?.longitude?.toFixed(4)}
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Street: {streetName || "N/A"}
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Speed Limit: {speedLimit ? `${speedLimit.toFixed(2)} mph` : "N/A"}
          {isSpeeding &&
            ` (${Math.abs(obd2Data.speed - speedLimit).toFixed(1)} mph over)`}
        </Text>
        
        {/* Enhanced Device Motion Display with G-Force Analysis */}
        {entry.deviceMotion && (
          <>
            <Text style={[styles.logText, { color: theme.textSecondary }]}>
              Device Motion - Accel: x:
              {entry.deviceMotion.acceleration?.x?.toFixed(3)}, y:
              {entry.deviceMotion.acceleration?.y?.toFixed(3)}, z:
              {entry.deviceMotion.acceleration?.z?.toFixed(3)} | Max G-Force: 
              {entry.deviceMotion.maxGForce?.toFixed(3)}g
            </Text>
            <Text style={[styles.logText, { color: theme.textSecondary }]}>
              Rotation: α:{entry.deviceMotion.rotation?.alpha?.toFixed(3)}, β:
              {entry.deviceMotion.rotation?.beta?.toFixed(3)}, γ:
              {entry.deviceMotion.rotation?.gamma?.toFixed(3)}
            </Text>
          </>
        )}
        
        {/* Turning Analysis Display */}
        {turningAnalysis && (
          <Text 
            style={[
              styles.logText, 
              { 
                color: hasUnsafeTurning 
                  ? (turningSeverity === "HIGH" ? "#FF0000" : "#FF8C00")
                  : theme.textSecondary 
              }
            ]}
          >
            Turning Safety: {turningAnalysis.severity} 
            {hasUnsafeTurning && 
              ` (${turningAnalysis.exceedsThreshold.toFixed(3)}g over ${turningAnalysis.threshold}g threshold)`
            }
          </Text>
        )}
      </View>
    );
  };

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
              Session Logs
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {logs && logs.length > 0 ? (
              logs.map(renderLogEntry).reverse()
            ) : (
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No logs available.
              </Text>
            )}
          </ScrollView>
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
    transform: [{ translateY: screenHeight }],
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
  logEntryContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  connectionMarkerContainer: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.2)",
  },
  connectionMarkerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  connectionMarkerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  connectionMarkerMessage: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 5,
  },
  logTimestamp: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  logText: {
    fontSize: 14,
  },
  unsafeTurningAlert: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  unsafeTurningText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
});

export default LogViewerModal;
