import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CircularProgress } from "../components/CircularProgress";
import { UserSelectionMenu } from "../components/UserSelectionMenu";
import { useTheme } from "../contexts/ThemeContext";
import { useUser } from "../contexts/UserContext";

export const HomeScreen = () => {
  const { theme } = useTheme();
  const { userType } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Mock data - would come from your actual data source
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

  const recentEvents = [
    { location: "Downtown Loop", duration: "14 min", events: 2, status: "bad" },
    { location: "Lake Drive", duration: "31 min", events: 0, status: "good" },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
    >
      {/* Header Section */}
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
        </View>
        <View style={styles.userSection}>
          {userType && (
            <View
              style={[
                styles.userTypeBox,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.primary,
                  shadowColor: theme.primary,
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
            </View>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowUserMenu(true)}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={28}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <UserSelectionMenu
        visible={showUserMenu}
        onClose={() => setShowUserMenu(false)}
      />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Main Score Card */}
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

        {/* Score Breakdown Grid */}
        <View style={styles.breakdownGrid}>
          {scoreBreakdown.map((item, index) => (
            <View
              key={index}
              style={[
                styles.breakdownItem,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
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
                style={[styles.breakdownTitle, { color: theme.textSecondary }]}
              >
                {item.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Trips
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllButton, { color: theme.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {recentEvents.map((event, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.eventItem,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.eventLocation}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={theme.primary}
                />
                <View style={styles.eventDetails}>
                  <Text style={[styles.locationText, { color: theme.text }]}>
                    {event.location}
                  </Text>
                  <Text
                    style={[
                      styles.durationText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {event.duration}
                  </Text>
                </View>
              </View>
              {event.events > 0 ? (
                <View style={styles.eventStatus}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={16}
                    color={theme.error}
                  />
                  <Text
                    style={[
                      styles.eventStatusText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {event.events} bad events
                  </Text>
                </View>
              ) : (
                <View style={styles.eventStatus}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={16}
                    color={theme.success}
                  />
                  <Text
                    style={[
                      styles.eventStatusText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    No issues
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Improvement Section */}
          <TouchableOpacity
            style={[styles.improvementCard, { backgroundColor: theme.primary }]}
          >
            <View style={styles.improvementContent}>
              <Text style={styles.improvementTitle}>
                See where you can improve
              </Text>
              <Text style={styles.improvementSubtitle}>
                Tap to view map of roads with bad driving events.
              </Text>
            </View>
            <MaterialCommunityIcons name="map" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
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
  container: {
    flex: 1,
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
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
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
  improvementCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#007AFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
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
});
