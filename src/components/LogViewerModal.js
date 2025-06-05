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
import { getLogs } from "../services/loggingService";

const screenHeight = Dimensions.get("window").height;

const LogViewerModal = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    let interval;
    if (visible) {
      const fetchLogs = async () => {
        const fetchedLogs = await getLogs();
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

    const { timestamp, obd2Data, location, streetName, speedLimit } = entry;
    return (
      <View key={index} style={styles.logEntryContainer}>
        <Text style={[styles.logTimestamp, { color: theme.text }]}>
          {new Date(timestamp).toLocaleString()}
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Speed: {obd2Data?.speed?.toFixed(2)} mph, RPM:{" "}
          {obd2Data?.rpm?.toFixed(2)}, Throttle:{" "}
          {obd2Data?.throttle?.toFixed(2)}%
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Location: {location?.latitude?.toFixed(4)},{" "}
          {location?.longitude?.toFixed(4)}
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Street: {streetName}
        </Text>
        <Text style={[styles.logText, { color: theme.textSecondary }]}>
          Speed Limit: {speedLimit ? `${speedLimit.toFixed(2)} mph` : "N/A"}
        </Text>
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
              <Text style={{ color: theme.text }}>No logs available.</Text>
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
  logTimestamp: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  logText: {
    fontSize: 14,
  },
});

export default LogViewerModal;
