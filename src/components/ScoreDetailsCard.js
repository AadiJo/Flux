import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafetyScore } from "../hooks/useSafetyScore";

/**
 * Component for displaying detailed safety score information
 * Can be used in modals or dedicated screens
 */
export const ScoreDetailsCard = ({ onClose, style }) => {
  const { theme } = useTheme();
  const {
    overallScore,
    breakdown,
    metrics,
    loading,
    error,
    hasData,
    getScoreGrade,
    getScoreMessage,
    formattedLastUpdated,
    forceRefresh,
  } = useSafetyScore();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Calculating safety score...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        <Text style={[styles.errorText, { color: theme.error }]}>
          Error loading safety score: {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={forceRefresh}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        <MaterialCommunityIcons
          name="car-info"
          size={48}
          color={theme.textSecondary}
          style={styles.noDataIcon}
        />
        <Text style={[styles.noDataTitle, { color: theme.text }]}>
          No Driving Data Yet
        </Text>
        <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
          Start a trip to begin tracking your safety score
        </Text>
      </View>
    );
  }

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }, style]}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      )}

      <View style={styles.scoreHeader}>
        <Text style={[styles.scoreValue, { color: theme.text }]}>
          {overallScore}
        </Text>
        <Text style={[styles.scoreGrade, { color: theme.primary }]}>
          Grade: {getScoreGrade(overallScore)}
        </Text>
        <Text style={[styles.scoreMessage, { color: theme.textSecondary }]}>
          {getScoreMessage(overallScore)}
        </Text>
      </View>

      <View style={styles.breakdownSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Score Breakdown
        </Text>

        {Object.entries(breakdown).map(([key, score]) => {
          const icons = {
            speedControl: "speedometer",
            braking: "car-brake-hold",
            steering: "steering",
            aggression: "car-emergency",
          };

          const labels = {
            speedControl: "Speed Control",
            braking: "Braking",
            steering: "Steering",
            aggression: "Aggression",
          };

          return (
            <View key={key} style={styles.breakdownItem}>
              <View style={styles.breakdownLeft}>
                <MaterialCommunityIcons
                  name={icons[key]}
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.breakdownLabel, { color: theme.text }]}>
                  {labels[key]}
                </Text>
              </View>
              <Text style={[styles.breakdownScore, { color: theme.text }]}>
                {score}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.metricsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Driving Statistics
        </Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {metrics.speedingEvents}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Speeding Events
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {metrics.speedingPercentage.toFixed(1)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Time Speeding
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {metrics.averageSpeedDeviation.toFixed(1)} mph
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Avg Speed Over
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {formatDuration(metrics.speedingDuration)}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Total Duration
            </Text>
          </View>
        </View>
      </View>

      {formattedLastUpdated && (
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          Last updated: {formattedLastUpdated}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 8,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    padding: 20,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "center",
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  noDataIcon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
  },
  scoreHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  breakdownSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  breakdownScore: {
    fontSize: 16,
    fontWeight: "600",
  },
  metricsSection: {
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  lastUpdated: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});
