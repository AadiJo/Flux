import { useState, useEffect, useCallback } from "react";
import {
  getSafetyScore,
  clearCachedScore,
  shouldUpdateScore as checkShouldUpdate,
} from "../services/scoringService";
import { useSettings } from "../contexts/SettingsContext";
import { scoreManager } from "../utils/scoreManager";

/**
 * Custom hook for managing safety score data
 * Automatically updates when speeding threshold changes
 */
export const useSafetyScore = () => {
  const { speedingThreshold } = useSettings();
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Function to load/refresh the safety score
  const refreshScore = useCallback(
    async (forceUpdate = false) => {
      try {
        setLoading(true);
        setError(null);

        const data = await getSafetyScore(speedingThreshold, forceUpdate);
        setScoreData(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Error loading safety score:", err);
        setError(err.message || "Failed to load safety score");
      } finally {
        setLoading(false);
      }
    },
    [speedingThreshold]
  );
  // Function to force refresh the score
  const forceRefresh = useCallback(() => {
    return refreshScore(true);
  }, [refreshScore]);

  // Function to check if score should be updated
  const shouldUpdateScore = useCallback(async () => {
    try {
      return await checkShouldUpdate();
    } catch (error) {
      console.error("Error checking if score should update:", error);
      return true; // Default to updating if we can't determine
    }
  }, []);

  // Function to clear cached score and refresh
  const resetScore = useCallback(async () => {
    try {
      setLoading(true);
      await clearCachedScore();
      await refreshScore(true);
    } catch (err) {
      console.error("Error resetting safety score:", err);
      setError(err.message || "Failed to reset safety score");
    }
  }, [refreshScore]);

  // Load cached score immediately on mount to prevent flickering
  useEffect(() => {
    const loadCachedScore = async () => {
      try {
        const { loadCachedSafetyScore } = await import(
          "../services/scoringService"
        );
        const cachedScore = await loadCachedSafetyScore();
        if (cachedScore) {
          setScoreData(cachedScore);
          setLastUpdated(new Date(cachedScore.lastUpdated));
        }
      } catch (err) {
        console.error("Error loading cached score:", err);
      }
    };

    loadCachedScore();
  }, []);

  // Load score on mount and when speeding threshold changes
  useEffect(() => {
    refreshScore();
  }, [refreshScore]);

  // Listen for score updates from scoreManager
  useEffect(() => {
    const unsubscribe = scoreManager.addListener((newScoreData) => {
      console.log("useSafetyScore: Received score update from scoreManager");
      setScoreData(newScoreData);
      setLastUpdated(new Date());
    });

    return unsubscribe;
  }, []);
  // Return the hook interface
  return {
    // Score data
    scoreData,
    overallScore: loading ? null : scoreData?.overallScore ?? 100,
    speedScore: loading ? null : scoreData?.speedScore ?? 100,
    breakdown: loading
      ? null
      : scoreData?.breakdown || {
          speedControl: 100,
          braking: 100,
          steering: 100,
          aggression: 100,
        },
    metrics: scoreData?.metrics || {
      totalDataPoints: 0,
      speedingEvents: 0,
      averageSpeedDeviation: 0,
      maxSpeedDeviation: 0,
      speedingDuration: 0,
      speedingPercentage: 0,
    },

    // State
    loading,
    error,
    lastUpdated,
    // Actions
    refreshScore: () => refreshScore(false),
    forceRefresh,
    resetScore,
    shouldUpdateScore,

    // Computed values
    hasData: !!scoreData && scoreData.tripsAnalyzed > 0,
    formattedLastUpdated: scoreData?.lastUpdated
      ? new Date(scoreData.lastUpdated).toLocaleString()
      : null,

    // Helper functions for display
    getScoreColor: (score) => {
      if (score >= 90) return "#4CAF50"; // Green
      if (score >= 75) return "#FF9800"; // Orange
      if (score >= 60) return "#F44336"; // Red
      return "#9E9E9E"; // Gray
    },

    getScoreGrade: (score) => {
      if (score >= 95) return "A+";
      if (score >= 90) return "A";
      if (score >= 85) return "B+";
      if (score >= 80) return "B";
      if (score >= 75) return "C+";
      if (score >= 70) return "C";
      if (score >= 65) return "D+";
      if (score >= 60) return "D";
      return "F";
    },
    getScoreMessage: (score) => {
      if (typeof score !== "number" || isNaN(score))
        return "Loading your safety score...";
      if (score >= 95)
        return "Excellent driving! You're a road safety champion.";
      if (score >= 90) return "Great driving! Keep up the excellent work.";
      if (score >= 85)
        return "Good driving! Minor improvements can make you even better.";
      if (score >= 80)
        return "Decent driving. Focus on speed control for better scores.";
      if (score >= 75)
        return "Room for improvement. Watch your speed more carefully.";
      if (score >= 70)
        return "Needs attention. Consider reviewing your driving habits.";
      if (score >= 60)
        return "Significant improvement needed. Focus on safe driving practices.";
      return "Drive more carefully. Safety should be your top priority.";
    },
  };
};
