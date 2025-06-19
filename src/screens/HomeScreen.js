import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CircularProgress } from "../components/CircularProgress";
import { UserSelectionMenu } from "../components/UserSelectionMenu";
import { SettingsMenu } from "../components/SettingsMenu";
import { PidScanModal } from "../components/PidScanModal";
import { useTheme } from "../contexts/ThemeContext";
import { useUser } from "../contexts/UserContext";
import { useSettings } from "../contexts/SettingsContext";
import { getAllTrips } from "../services/loggingService";
import { getSpeedingPinsForTrip } from "../services/speedingService";

export const HomeScreen = ({
  updateSpeedingPinsFromLogs,
  navigation,
  setSelectedMode,
  setHomeSelectedTrip,
}) => {
  const { theme } = useTheme();
  const { userType } = useUser();
  const { speedingThreshold } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPidScan, setShowPidScan] = useState(false);
  const [recentTrips, setRecentTrips] = useState([]);
  const [badEventsCounts, setBadEventsCounts] = useState([]);

  const safetyScore = 86;
  const scoreBreakdown = [
    {
      title: "Speed Control",
      score: 92,
      icon: "speedometer",
      color: theme.primary,
    },
    {
      title: "Braking",
      score: 80,
      icon: "car-brake-hold",
      color: theme.warning,
    },
    { title: "Steering", score: 89, icon: "steering", color: theme.success },
    {
      title: "Aggression",
      score: 75,
      icon: "car-emergency",
      color: theme.error,
    },
  ];

  useEffect(() => {
    // Load the two most recent trips
    (async () => {
      const trips = await getAllTrips();
      const topTrips = trips.slice(0, 2);
      setRecentTrips(topTrips);
      // Count bad events for each trip
      const counts = await Promise.all(
        topTrips.map(async (trip) => {
          const pins = await getSpeedingPinsForTrip(speedingThreshold, trip);
          return pins.length;
        })
      );
      setBadEventsCounts(counts);
    })();
  }, [speedingThreshold]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
      }}
      edges={["top"]}
    >
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.scrollViewContent]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => window.handleResetSplash()}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowPidScan(true)}
            >
              <MaterialCommunityIcons
                name="tune"
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.userSection}>
            {userType && (
              <TouchableOpacity
                onPress={() => setShowUserMenu(true)}
                style={[
                  styles.userTypeBox,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.primary,
                    shadowColor: theme.primary,
                    minWidth: 90,
                    ...(theme.dark && {
                      shadowOpacity: 0.7,
                      shadowRadius: 10,
                      elevation: 10,
                    }),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.userTypeText,
                    {
                      color: theme.text,
                      textAlign: "center",
                      ...(theme.dark && {
                        textShadowColor: theme.primary,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 8,
                      }),
                    },
                  ]}
                >
                  {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSettingsMenu(true)}
            >
              <MaterialCommunityIcons
                name="cog"
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <UserSelectionMenu
          visible={showUserMenu}
          onClose={() => setShowUserMenu(false)}
        />
        <SettingsMenu
          visible={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          updateSpeedingPinsFromLogs={updateSpeedingPinsFromLogs}
        />
        <PidScanModal
          visible={showPidScan}
          onClose={() => setShowPidScan(false)}
        />

        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.scoreCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <CircularProgress
              size={200}
              strokeWidth={12}
              progress={safetyScore}
              score={safetyScore}
              gradientColors={[theme.primary, theme.success]}
            />
            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Your Safety Score
            </Text>
            <Text style={[styles.scoreMessage, { color: theme.text }]}>
              Good driving! Keep it up.
            </Text>
          </View>

          <View style={styles.breakdownGrid}>
            {scoreBreakdown.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.breakdownItem,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  console.log(`Pressed ${item.title} score breakdown`)
                }
                activeOpacity={0.8}
                underlayColor={theme.background}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={24}
                    color={item.color}
                  />
                </View>
                <Text style={[styles.breakdownScore, { color: theme.text }]}>
                  {item.score}
                </Text>
                <Text
                  style={[
                    styles.breakdownTitle,
                    { color: theme.textSecondary },
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Trips Section */}
          {recentTrips.length > 0 && (
            <View style={styles.eventsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent Trips
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (setSelectedMode) setSelectedMode("maps");
                    if (setHomeSelectedTrip) setHomeSelectedTrip(null); // Show trip list
                  }}
                >
                  <Text
                    style={[styles.viewAllButton, { color: theme.primary }]}
                  >
                    View All
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentTripsGroup}>
                {recentTrips.map((trip, index) => (
                  <TouchableOpacity
                    key={trip.id || index}
                    style={[
                      styles.eventItem,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      if (setSelectedMode) setSelectedMode("maps");
                      if (setHomeSelectedTrip) setHomeSelectedTrip(trip);
                    }}
                  >
                    <View style={styles.eventLocation}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={20}
                        color={theme.primary}
                      />
                      <View style={styles.eventDetails}>
                        <Text
                          style={[styles.locationText, { color: theme.text }]}
                        >
                          {trip.roadName || "Unknown Road"}
                        </Text>
                        <Text
                          style={[
                            styles.durationText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {(() => {
                            if (!trip.endTime) return "Ongoing";
                            const start = new Date(trip.startTime);
                            const end = new Date(trip.endTime);
                            const diffMs = end - start;
                            if (
                              isNaN(start.getTime()) ||
                              isNaN(end.getTime()) ||
                              diffMs < 0
                            )
                              return "Unknown";
                            const diffMins = Math.floor(diffMs / (1000 * 60));
                            if (diffMins < 1)
                              return `${Math.floor(diffMs / 1000)} sec`;
                            if (diffMins < 60) return `${diffMins} min`;
                            const hours = Math.floor(diffMins / 60);
                            const mins = diffMins % 60;
                            return `${hours}h ${mins}m`;
                          })()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.eventStatus}>
                      <MaterialCommunityIcons
                        name={
                          badEventsCounts[index] > 0
                            ? "alert-circle"
                            : "check-circle"
                        }
                        size={16}
                        color={
                          badEventsCounts[index] > 0
                            ? theme.error
                            : theme.success
                        }
                      />
                      <Text
                        style={[
                          styles.eventStatusText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {badEventsCounts[index] > 0
                          ? badEventsCounts[index] === 1
                            ? "1 bad event"
                            : `${badEventsCounts[index]} bad events`
                          : "No issues"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      <UserSelectionMenu
        visible={showUserMenu}
        onClose={() => setShowUserMenu(false)}
      />
      <SettingsMenu
        visible={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  container: {
    width: "100%",
    alignItems: "center",
    padding: 16,
    paddingTop: 0,
  },
  scoreCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
    marginTop: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginTop: 8,
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  breakdownItem: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  breakdownScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  breakdownTitle: {
    fontSize: 14,
    color: "#666",
  },
  eventsSection: {
    width: "100%",
    marginBottom: -70,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  viewAllButton: {
    color: "#007AFF",
    fontSize: 16,
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventDetails: {
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  durationText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  eventStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventStatusText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  improvementContent: {
    flex: 1,
    marginRight: 16,
  },
  improvementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  improvementSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userTypeBox: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  recentTripsGroup: {
    width: "100%",
    paddingBottom: 24,
  },
});
