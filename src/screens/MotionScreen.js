import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { DeviceMotion } from "expo-sensors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

export const MotionScreen = ({ onResetSplash }) => {
  const { theme } = useTheme();
  const [motionData, setMotionData] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
  });

  useEffect(() => {
    DeviceMotion.setUpdateInterval(100);
    const subscription = DeviceMotion.addListener((data) =>
      setMotionData(data)
    );
    return () => subscription.remove();
  }, []);

  const { acceleration, rotation } = motionData;

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
        </View>
      </View>
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
        <Text style={[styles.heading, { color: theme.text }]}>
          📱Device Motion
        </Text>
        <Text style={[styles.label, { color: theme.text }]}>
          Acceleration (w/o gravity):
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          x: {acceleration?.x?.toFixed(2)}
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          y: {acceleration?.y?.toFixed(2)}
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          z: {acceleration?.z?.toFixed(2)}
        </Text>
        <Text style={[styles.label, { color: theme.text }]}>
          Rotation (radians):
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          α: {rotation?.alpha?.toFixed(2)}
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          β: {rotation?.beta?.toFixed(2)}
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          γ: {rotation?.gamma?.toFixed(2)}
        </Text>
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
    paddingTop: 30,
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
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
  },
});
