import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { DeviceMotion } from "expo-sensors";
import { Ionicons } from "@expo/vector-icons";

export const MotionScreen = ({ onResetSplash }) => {
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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onResetSplash}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="refresh" size={24} color="#007aff" />
      </TouchableOpacity>
      <View style={styles.dataContainer}>
        <Text style={styles.heading}>📱Device Motion</Text>
        <Text style={styles.label}>Acceleration (w/o gravity):</Text>
        <Text style={styles.value}>x: {acceleration?.x?.toFixed(2)}</Text>
        <Text style={styles.value}>y: {acceleration?.y?.toFixed(2)}</Text>
        <Text style={styles.value}>z: {acceleration?.z?.toFixed(2)}</Text>
        <Text style={styles.label}>Rotation (radians):</Text>
        <Text style={styles.value}>α: {rotation?.alpha?.toFixed(2)}</Text>
        <Text style={styles.value}>β: {rotation?.beta?.toFixed(2)}</Text>
        <Text style={styles.value}>γ: {rotation?.gamma?.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 1,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
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
    marginTop: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
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
});
