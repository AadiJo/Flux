import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafetyScore } from "../hooks/useSafetyScore";
import { ScoreDetailsCard } from "../components/ScoreDetailsCard";
import { getAllTrips, clearLogs } from "../services/loggingService";
import { clearCachedScore } from "../services/scoringService";

/**
 * Debug screen for testing the scoring system
 * This can be accessed from the settings menu or during development
 */
export const ScoreDebugScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { scoreData, loading, error, forceRefresh, resetScore } =
    useSafetyScore();
  const [debugInfo, setDebugInfo] = useState(null);

  const handleGetTripsInfo = async () => {
    try {
      const trips = await getAllTrips();
      const info = {
        totalTrips: trips.length,
        tripsWithLogs: trips.filter((t) => t.logs && t.logs.length > 0).length,
        totalLogEntries: trips.reduce(
          (sum, trip) => sum + (trip.logs ? trip.logs.length : 0),
          0
        ),
        recentTrips: trips.slice(0, 3).map((trip) => ({
          id: trip.id,
          roadName: trip.roadName,
          logCount: trip.logs ? trip.logs.length : 0,
          startTime: trip.startTime,
          endTime: trip.endTime,
        })),
      };
      setDebugInfo(info);
    } catch (error) {
      Alert.alert("Error", `Failed to get trips info: ${error.message}`);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will clear all logs and cached scores. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearLogs("sim");
              await clearLogs("real");
              await clearCachedScore();
              setDebugInfo(null);
              Alert.alert("Success", "All data cleared successfully");
            } catch (error) {
              Alert.alert("Error", `Failed to clear data: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Score Debug
        </Text>
      </View>

      {/* Score Display */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Current Score
        </Text>
        <ScoreDetailsCard style={{ marginBottom: 16 }} />
      </View>

      {/* Debug Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Debug Actions
        </Text>

        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: theme.primary }]}
          onPress={forceRefresh}
          disabled={loading}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="white" />
          <Text style={styles.debugButtonText}>Force Refresh Score</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: theme.warning }]}
          onPress={handleGetTripsInfo}
        >
          <MaterialCommunityIcons name="information" size={20} color="white" />
          <Text style={styles.debugButtonText}>Get Trips Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.debugButton, { backgroundColor: theme.error }]}
          onPress={handleClearAllData}
        >
          <MaterialCommunityIcons name="delete" size={20} color="white" />
          <Text style={styles.debugButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info Display */}
      {debugInfo && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Trips Information
          </Text>
          <View style={[styles.debugInfoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.debugInfoText, { color: theme.text }]}>
              Total Trips: {debugInfo.totalTrips}
            </Text>
            <Text style={[styles.debugInfoText, { color: theme.text }]}>
              Trips with Logs: {debugInfo.tripsWithLogs}
            </Text>
            <Text style={[styles.debugInfoText, { color: theme.text }]}>
              Total Log Entries: {debugInfo.totalLogEntries}
            </Text>

            {debugInfo.recentTrips.length > 0 && (
              <>
                <Text
                  style={[styles.debugInfoSubtitle, { color: theme.primary }]}
                >
                  Recent Trips:
                </Text>
                {debugInfo.recentTrips.map((trip, index) => (
                  <View key={index} style={styles.tripInfo}>
                    <Text style={[styles.debugInfoText, { color: theme.text }]}>
                      {trip.roadName || "Unknown"} - {trip.logCount} logs
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      )}

      {/* Raw Score Data */}
      {scoreData && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Raw Score Data
          </Text>
          <View style={[styles.debugInfoCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.debugInfoText, { color: theme.text }]}>
              {JSON.stringify(scoreData, null, 2)}
            </Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>
            Error
          </Text>
          <Text style={[styles.debugInfoText, { color: theme.error }]}>
            {error}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  debugButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  debugInfoCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  debugInfoText: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "monospace",
  },
  debugInfoSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  tripInfo: {
    marginLeft: 16,
    marginBottom: 2,
  },
});
