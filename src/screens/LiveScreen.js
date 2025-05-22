import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const LiveScreen = ({
  onOpenWifiModal,
  selectedNetwork,
  onResetSplash,
}) => {
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
        <Text style={styles.heading}>Live Data</Text>
        <TouchableOpacity style={styles.wifiButton} onPress={onOpenWifiModal}>
          <Ionicons name="wifi" size={24} color="#007aff" />
          <Text style={styles.wifiButtonText}>
            {selectedNetwork
              ? `Connected to ${selectedNetwork.ssid}`
              : "Retrieve Data"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.value}>Real time data</Text>
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
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
    color: "#666",
  },
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  wifiButtonText: {
    marginLeft: 8,
    color: "#007aff",
    fontSize: 16,
    fontWeight: "500",
  },
});
