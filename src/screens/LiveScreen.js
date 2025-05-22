import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

export const LiveScreen = ({
  onOpenWifiModal,
  selectedNetwork,
  onResetSplash,
}) => {
  const { theme } = useTheme();

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
        <Text style={[styles.heading, { color: theme.text }]}>Live Data</Text>
        <TouchableOpacity
          style={[
            styles.wifiButton,
            {
              backgroundColor: theme.isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.08)",
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            },
          ]}
          onPress={onOpenWifiModal}
        >
          <Ionicons name="wifi" size={24} color={theme.primary} />
          <Text style={[styles.wifiButtonText, { color: theme.primary }]}>
            {selectedNetwork
              ? `Connected to ${selectedNetwork.ssid}`
              : "Retrieve Data"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          Real time data
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
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
  },
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  wifiButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
});
