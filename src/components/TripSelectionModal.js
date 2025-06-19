import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { getAllTrips } from "../services/loggingService";

export const TripSelectionModal = ({ onSelectTrip }) => {
  const { theme, isDark } = useTheme();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    loadTrips();

    // Brief delay before showing any content (prevents flash)
    const delayTimer = setTimeout(() => {
      setShowContent(true);
    }, 20);

    return () => clearTimeout(delayTimer);
  }, []);
  const loadTrips = async () => {
    setLoading(true);
    try {
      const allTrips = await getAllTrips();
      setTrips(allTrips);
    } catch (error) {
      console.error("Failed to load trips:", error);
      Alert.alert("Error", "Failed to load trips from logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };
  const getTripDuration = (startTime, endTime) => {
    if (!endTime) return "Ongoing";

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Unknown";
    }

    const diffMs = end - start;

    // If negative time difference, return unknown
    if (diffMs < 0) {
      return "Unknown";
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) {
      const diffSecs = Math.floor(diffMs / 1000);
      return `${diffSecs} sec`;
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const renderTripItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.tripItem, { backgroundColor: theme.card }]}
      onPress={() => onSelectTrip(item)}
    >
      <View style={styles.tripHeader}>
        <Text style={[styles.roadName, { color: theme.text }]}>
          {item.roadName}
        </Text>
        <Text style={[styles.duration, { color: theme.textSecondary }]}>
          {getTripDuration(item.startTime, item.endTime)}
        </Text>
      </View>
      <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
        {formatDate(item.startTime)}
      </Text>
      <Text style={[styles.logCount, { color: theme.textSecondary }]}>
        {item.logs.length} data points
      </Text>
    </TouchableOpacity>
  );
  if (!showContent) {
    // Show nothing for 20ms to prevent flash
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Trips</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading trips...
          </Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No trips found. Start recording some data to see your trips here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) =>
            `trip-${item.id}-${item.startTime || "unknown"}`
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    paddingTop:
      Platform.OS === "android" ? 20 + (StatusBar.currentHeight || 0) : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
  },
  tripItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  roadName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 14,
    marginBottom: 4,
  },
  logCount: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
