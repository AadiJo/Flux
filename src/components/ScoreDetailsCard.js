import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSafetyScore } from "../hooks/useSafetyScore";

/**
 * Component for displaying detailed safety score information in a carousel format
 * Can be used in modals or dedicated screens
 */
export const ScoreDetailsCard = ({ onClose, style, initialPage = 0 }) => {
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
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef(null);

  const pages = [
    { title: "Overview", icon: "chart-line" },
    { title: "Speed", icon: "speedometer" },
    { title: "Aggression", icon: "speedometer-medium" },
    { title: "Braking", icon: "car-brake-hold" },
    { title: "Steering", icon: "steering" },
  ];

  const formatDuration = (seconds) => {
    if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handlePageChange = (pageIndex) => {
    setCurrentPage(pageIndex);
    scrollViewRef.current?.scrollTo({
      x: pageIndex * containerWidth,
      animated: true,
    });
  };

  const onScroll = (event) => {
    if (containerWidth > 0) {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / containerWidth
      );
      if (pageIndex !== currentPage) {
        setCurrentPage(pageIndex);
      }
    }
  };

  const onScrollEnd = (event) => {
    if (containerWidth > 0) {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / containerWidth
      );
      setCurrentPage(pageIndex);
    }
  };

  const onContainerLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  // Effect to handle initial page navigation
  useEffect(() => {
    if (containerWidth > 0) {
      setCurrentPage(initialPage);
      scrollViewRef.current?.scrollTo({
        x: initialPage * containerWidth,
        animated: false,
      });
    }
  }, [containerWidth, initialPage]);

  // Additional effect to ensure page is set when initialPage changes
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        {/* Header with close button */}
        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Calculating safety score...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        {/* Header with close button */}
        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }, style]}>
        {/* Header with close button */}
        <View style={styles.header}>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
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
      </View>
    );
  }

  // Overview Page Component
  const OverviewPage = () => (
    <View style={[styles.pageContainer, { width: containerWidth }]}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.scoreValue, { color: theme.text }]}>
            {overallScore || 0}
          </Text>
          <Text style={[styles.scoreGrade, { color: theme.primary }]}>
            {`Grade: ${getScoreGrade ? getScoreGrade(overallScore) : "N/A"}`}
          </Text>
          <Text style={[styles.scoreMessage, { color: theme.textSecondary }]}>
            {getScoreMessage
              ? getScoreMessage(overallScore)
              : "No message available"}
          </Text>
        </View>

        <View style={styles.breakdownSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Score Breakdown
          </Text>

          {breakdown &&
            Object.entries(breakdown).map(([key, score]) => {
              const icons = {
                speedControl: "speedometer",
                acceleration: "speedometer-medium",
                braking: "car-brake-hold",
                steering: "steering",
                aggression: "car-emergency",
              };

              const labels = {
                speedControl: "Speed Control",
                acceleration: "Acceleration",
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
                    <Text
                      style={[styles.breakdownLabel, { color: theme.text }]}
                    >
                      {labels[key]}
                    </Text>
                  </View>
                  <Text style={[styles.breakdownScore, { color: theme.text }]}>
                    {score || 0}
                  </Text>
                </View>
              );
            })}
        </View>

        {formattedLastUpdated && (
          <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
            {`Last updated: ${formattedLastUpdated}`}
          </Text>
        )}
      </ScrollView>
    </View>
  );

  // Speed Control Page Component
  const SpeedControlPage = () => (
    <View style={[styles.pageContainer, { width: containerWidth }]}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <MaterialCommunityIcons
            name="speedometer"
            size={48}
            color={theme.primary}
            style={styles.pageIcon}
          />
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Speed Control
          </Text>
          <Text style={[styles.pageScore, { color: theme.primary }]}>
            {`Score: ${breakdown?.speedControl || 0}`}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Speed Statistics
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.speedingEvents || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Speeding Events
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.speedingPercentage || 0).toFixed(1)}%`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Time Speeding
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.averageSpeedDeviation || 0).toFixed(1)} mph`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Avg Speed Over
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {formatDuration(metrics?.speedingDuration)}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Total Duration
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
          Detailed speed control analysis coming soon...
        </Text>
      </ScrollView>
    </View>
  );

  // Acceleration Page Component
  const AccelerationPage = () => (
    <View style={[styles.pageContainer, { width: containerWidth }]}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <MaterialCommunityIcons
            name="speedometer-medium"
            size={48}
            color={theme.primary}
            style={styles.pageIcon}
          />
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Aggression Analysis
          </Text>
          <Text style={[styles.pageScore, { color: theme.primary }]}>
            {`Score: ${breakdown?.acceleration || 0}`}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Aggression Statistics
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.totalAccelerationEvents || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Aggression Events
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.averageAcceleration || 0).toFixed(1)} mph/s`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Average Aggression
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.maxAcceleration || 0).toFixed(1)} mph/s`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Max Aggression
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.harshAccelerationEvents || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Harsh Events
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.harshAccelerationPercentage || 0).toFixed(1)}%`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Harsh Event Rate
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.dataPointsWithAcceleration || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Data Points
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Score Formula
          </Text>
          <Text
            style={[styles.placeholderText, { color: theme.textSecondary }]}
          >
            Aggression scores are calculated using a piecewise linear function
            based on your average aggression patterns:
            {"\n\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>Ideal Range (2-6 mph/s):</Text>{" "}
            100 points
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>
              Too Gentle (&lt;2 mph/s):
            </Text>{" "}
            Linear penalty down to 1 point
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>
              Too Aggressive (&gt;6 mph/s):
            </Text>{" "}
            Linear penalty down to 1 point
            {"\n\n"}
            Your current average:{" "}
            {(metrics?.averageAcceleration || 0).toFixed(1)} mph/s
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  // Braking Page Component
  const BrakingPage = () => (
    <View style={[styles.pageContainer, { width: containerWidth }]}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <MaterialCommunityIcons
            name="car-brake-hold"
            size={48}
            color={theme.primary}
            style={styles.pageIcon}
          />
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Braking Analysis
          </Text>
          <Text style={[styles.pageScore, { color: theme.primary }]}>
            {`Score: ${breakdown?.braking || 0}`}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Braking Statistics
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.totalBrakingEvents || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Braking Events
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.averageBraking || 0).toFixed(1)} mph/s`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Average Braking
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.maxBraking || 0).toFixed(1)} mph/s`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Max Braking
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.harshBrakingEvents || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Harsh Events
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {`${(metrics?.harshBrakingPercentage || 0).toFixed(1)}%`}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Harsh Event Rate
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {metrics?.dataPointsWithBraking || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Data Points
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Score Formula
          </Text>
          <Text
            style={[styles.placeholderText, { color: theme.textSecondary }]}
          >
            Braking scores are calculated using a piecewise linear function
            based on your average braking patterns (with more tolerance than acceleration):
            {"\n\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>Ideal Range (3-8 mph/s):</Text>{" "}
            100 points
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>
              Too Gentle (&lt;3 mph/s):
            </Text>{" "}
            Linear penalty down to 1 point
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>
              Too Harsh (&gt;8 mph/s):
            </Text>{" "}
            Linear penalty down to 1 point
            {"\n\n"}
            Your current average:{" "}
            {(metrics?.averageBraking || 0).toFixed(1)} mph/s
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  // Steering Page Component
  const SteeringPage = () => (
    <View style={[styles.pageContainer, { width: containerWidth }]}>
      <ScrollView style={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <MaterialCommunityIcons
            name="steering"
            size={48}
            color={theme.primary}
            style={styles.pageIcon}
          />
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Steering Analysis
          </Text>
          <Text style={[styles.pageScore, { color: theme.primary }]}>
            {`Score: ${breakdown?.steering || 0}`}
          </Text>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Steering Statistics
          </Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: theme.primary }]}>
                {breakdown?.steering || 0}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                Steering Score
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Score Formula
          </Text>
          <Text
            style={[styles.placeholderText, { color: theme.textSecondary }]}
          >
            Steering scores are calculated based on steering smoothness, 
            cornering behavior, and lane keeping stability.
            {"\n\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>Smooth Steering:</Text>{" "}
            Higher scores for gradual steering inputs
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>Erratic Steering:</Text>{" "}
            Lower scores for jerky or abrupt steering changes
            {"\n"}•{" "}
            <Text style={{ fontWeight: "bold" }}>Lane Stability:</Text>{" "}
            Consistent lane keeping improves score
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.card }, style]}
      onLayout={onContainerLayout}
    >
      {/* Header with close button and page indicators */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Page Tabs */}
        <View style={styles.tabContainer}>
          {pages.map((page, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    currentPage === index ? theme.primary : "transparent",
                  borderColor: theme.border,
                },
              ]}
              onPress={() => handlePageChange(index)}
            >
              <MaterialCommunityIcons
                name={page.icon}
                size={20}
                color={currentPage === index ? "white" : theme.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scrollable Content */}
      {containerWidth > 0 && (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}
          snapToInterval={containerWidth}
          decelerationRate="fast"
        >
          <OverviewPage />
          <SpeedControlPage />
          <AccelerationPage />
          <BrakingPage />
          <SteeringPage />
        </ScrollView>
      )}

      {/* Page Indicator Dots */}
      <View style={styles.pageIndicators}>
        {pages.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageIndicator,
              {
                backgroundColor:
                  currentPage === index ? theme.primary : theme.border,
              },
            ]}
            onPress={() => handlePageChange(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 2,
    minHeight: 48,
    justifyContent: "center",
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pageHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  pageIcon: {
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pageScore: {
    fontSize: 18,
    fontWeight: "600",
  },
  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingVertical: 20,
    fontStyle: "italic",
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
