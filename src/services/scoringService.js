import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllTrips } from "./loggingService";

const SAFETY_SCORE_KEY = "safety_score_data";
const SCORE_FILE_URI = FileSystem.documentDirectory + "safety_score.json";

// Cache for expensive operations
let latestTripTimestampCache = null;
let latestTripTimestampCacheTime = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Calculate safety score based on speed deviation and time spent speeding using the formula:
 * Score(d, p) = 100 × exp(-k × d/M) × (1 - c×p)
 *
 * Where:
 * - d = average speed deviation (in mph) beyond ±5mph
 * - p = proportion of time spent speeding (0.0 to 1.0)
 * - M = expected max penalty speed (e.g. 20mph)
 * - k = exponential decay rate (e.g. 0.7)
 * - c = scaling factor for time penalty impact (e.g. 0.4)
 *
 * Recommended values: k = 0.7, M = 20, c = 0.4
 */
const calculateSpeedScore = (
  averageSpeedDeviation,
  proportionSpeeding,
  k = 0.7,
  M = 20,
  c = 0.4
) => {
  if (averageSpeedDeviation <= 0 && proportionSpeeding <= 0) {
    return 100; // Perfect score if no deviation and no speeding
  }

  const speedPenalty = Math.exp((-k * averageSpeedDeviation) / M);
  const timePenalty = 1 - c * proportionSpeeding;
  const score = 100 * speedPenalty * timePenalty;

  return Math.max(1, Math.min(100, Math.round(score)));
};

/**
 * Calculate average speed deviation from trips
 * Only considers speeds that exceed the threshold (default 5 mph over limit)
 */
const calculateAverageSpeedDeviation = (trips, speedingThreshold = 5) => {
  let totalDeviation = 0;
  let deviationCount = 0;

  for (const trip of trips) {
    if (!trip.logs || trip.logs.length === 0) continue;

    for (const log of trip.logs) {
      const speed = log.obd2Data?.speed;
      const speedLimit = log.speedLimit;

      if (speed && speedLimit) {
        const deviation = speed - speedLimit;
        // Only count deviations beyond the threshold
        if (deviation > speedingThreshold) {
          totalDeviation += deviation - speedingThreshold;
          deviationCount++;
        }
      }
    }
  }

  return deviationCount > 0 ? totalDeviation / deviationCount : 0;
};

/**
 * Calculate detailed speed metrics for breakdown display
 */
const calculateSpeedMetrics = (trips, speedingThreshold = 5) => {
  let totalDataPoints = 0;
  let speedingEvents = 0;
  let totalSpeedDeviation = 0;
  let maxSpeedDeviation = 0;
  let speedingDuration = 0; // in seconds

  for (const trip of trips) {
    if (!trip.logs || trip.logs.length === 0) continue;

    let previousTimestamp = null;

    for (const log of trip.logs) {
      const speed = log.obd2Data?.speed;
      const speedLimit = log.speedLimit;

      if (speed && speedLimit) {
        totalDataPoints++;
        const deviation = speed - speedLimit;

        if (deviation > speedingThreshold) {
          speedingEvents++;
          const actualDeviation = deviation - speedingThreshold;
          totalSpeedDeviation += actualDeviation;
          maxSpeedDeviation = Math.max(maxSpeedDeviation, actualDeviation);

          // Calculate duration if we have timestamp data
          if (previousTimestamp) {
            const timeDiff =
              new Date(log.timestamp) - new Date(previousTimestamp);
            speedingDuration += Math.min(timeDiff / 1000, 10); // Cap at 10 seconds per log
          }
        }
      }

      previousTimestamp = log.timestamp;
    }
  }

  return {
    totalDataPoints,
    speedingEvents,
    averageSpeedDeviation:
      speedingEvents > 0 ? totalSpeedDeviation / speedingEvents : 0,
    maxSpeedDeviation,
    speedingDuration,
    speedingPercentage:
      totalDataPoints > 0 ? (speedingEvents / totalDataPoints) * 100 : 0,
  };
};

/**
 * Calculate the overall safety score and breakdown
 */
export const calculateSafetyScore = async (speedingThreshold = 5) => {
  try {
    const trips = await getAllTrips();

    if (!trips || trips.length === 0) {
      return {
        overallScore: 100,
        speedScore: 100,
        lastUpdated: new Date().toISOString(),
        metrics: {
          totalDataPoints: 0,
          speedingEvents: 0,
          averageSpeedDeviation: 0,
          maxSpeedDeviation: 0,
          speedingDuration: 0,
          speedingPercentage: 0,
        },
        breakdown: {
          speedControl: 100,
          braking: 100, // Placeholder for future implementation
          steering: 100, // Placeholder for future implementation
          aggression: 100, // Placeholder for future implementation
        },
      };
    }

    // Calculate speed metrics
    const metrics = calculateSpeedMetrics(trips, speedingThreshold);
    const averageSpeedDeviation = metrics.averageSpeedDeviation; // Calculate speed control score using the new formula
    const proportionSpeeding = metrics.speedingPercentage / 100; // Convert percentage to proportion
    const speedScore = calculateSpeedScore(
      averageSpeedDeviation,
      proportionSpeeding
    );

    // For now, overall score is just the speed score
    // In the future, this would incorporate other factors
    const overallScore = speedScore; // Calculate breakdown scores (only speed control is implemented)
    const breakdown = {
      speedControl: speedScore,
      braking: 85, // Placeholder - not implemented
      steering: 90, // Placeholder - not implemented
      aggression: 80, // Placeholder - not implemented
    };

    const scoreData = {
      overallScore,
      speedScore,
      lastUpdated: new Date().toISOString(),
      metrics,
      breakdown,
      tripsAnalyzed: trips.length,
    };

    return scoreData;
  } catch (error) {
    console.error("Error calculating safety score:", error);
    return {
      overallScore: 100,
      speedScore: 100,
      lastUpdated: new Date().toISOString(),
      metrics: {
        totalDataPoints: 0,
        speedingEvents: 0,
        averageSpeedDeviation: 0,
        maxSpeedDeviation: 0,
        speedingDuration: 0,
        speedingPercentage: 0,
      },
      breakdown: {
        speedControl: 100,
        braking: 100,
        steering: 100,
        aggression: 100,
      },
    };
  }
};

/**
 * Get the latest timestamp from all trips to determine if score needs updating
 * Uses caching to avoid repeated expensive operations
 */
const getLatestTripTimestamp = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      latestTripTimestampCache &&
      latestTripTimestampCacheTime &&
      now - latestTripTimestampCacheTime < CACHE_DURATION
    ) {
      console.log("getLatestTripTimestamp: Using cached result");
      return latestTripTimestampCache;
    }

    console.log("getLatestTripTimestamp: Fetching fresh data");
    const trips = await getAllTrips();
    if (!trips || trips.length === 0) {
      latestTripTimestampCache = null;
      latestTripTimestampCacheTime = now;
      return null;
    }

    let latestTimestamp = null;

    for (const trip of trips) {
      // Check trip end time or start time
      const tripTimestamp = trip.endTime || trip.startTime;
      if (tripTimestamp) {
        const timestamp = new Date(tripTimestamp);
        if (!latestTimestamp || timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
        }
      }

      // Also check the last log entry timestamp
      if (trip.logs && trip.logs.length > 0) {
        const lastLog = trip.logs[trip.logs.length - 1];
        if (lastLog.timestamp) {
          const logTimestamp = new Date(lastLog.timestamp);
          if (!latestTimestamp || logTimestamp > latestTimestamp) {
            latestTimestamp = logTimestamp;
          }
        }
      }
    }

    // Cache the result
    latestTripTimestampCache = latestTimestamp;
    latestTripTimestampCacheTime = now;

    return latestTimestamp;
  } catch (error) {
    console.error("Error getting latest trip timestamp:", error);
    return null;
  }
};

/**
 * Load cached safety score from local storage
 */
export const loadCachedSafetyScore = async () => {
  try {
    // Try to load from file first
    const fileInfo = await FileSystem.getInfoAsync(SCORE_FILE_URI);
    if (fileInfo.exists) {
      const fileContent = await FileSystem.readAsStringAsync(SCORE_FILE_URI);
      const scoreData = JSON.parse(fileContent);

      // Also cache in AsyncStorage for backward compatibility
      await AsyncStorage.setItem(SAFETY_SCORE_KEY, JSON.stringify(scoreData));

      return scoreData;
    }

    // Fallback to AsyncStorage
    const storedScore = await AsyncStorage.getItem(SAFETY_SCORE_KEY);
    if (storedScore) {
      return JSON.parse(storedScore);
    }

    return null;
  } catch (error) {
    console.error("Error loading cached safety score:", error);
    return null;
  }
};

/**
 * Save safety score to local storage
 */
export const saveSafetyScore = async (scoreData) => {
  try {
    const scoreJson = JSON.stringify(scoreData, null, 2);

    // Save to file (primary storage)
    await FileSystem.writeAsStringAsync(SCORE_FILE_URI, scoreJson);

    // Also save to AsyncStorage for backward compatibility
    await AsyncStorage.setItem(SAFETY_SCORE_KEY, scoreJson);

    console.log("Safety score saved successfully");
  } catch (error) {
    console.error("Error saving safety score:", error);
  }
};

/**
 * Check if the safety score needs to be updated
 * Returns true if the score should be recalculated
 */
export const shouldUpdateScore = async () => {
  try {
    const cachedScore = await loadCachedSafetyScore();
    if (!cachedScore) {
      console.log("shouldUpdateScore: No cached score found, needs update");
      return true;
    }

    const latestTripTimestamp = await getLatestTripTimestamp();
    if (!latestTripTimestamp) {
      console.log("shouldUpdateScore: No trips found, score is current");
      return false;
    }

    const lastUpdated = new Date(cachedScore.lastUpdated);
    const needsUpdate = latestTripTimestamp > lastUpdated;

    console.log("shouldUpdateScore: Last updated:", lastUpdated.toISOString());
    console.log(
      "shouldUpdateScore: Latest trip:",
      latestTripTimestamp.toISOString()
    );
    console.log("shouldUpdateScore: Needs update:", needsUpdate);

    return needsUpdate;
  } catch (error) {
    console.error("Error checking if score should update:", error);
    return true; // Default to updating if we can't determine
  }
};

/**
 * Get the current safety score, calculating if needed
 */
export const getSafetyScore = async (
  speedingThreshold = 5,
  forceUpdate = false
) => {
  try {
    // Check if we need to update
    const needsUpdate = forceUpdate || (await shouldUpdateScore());

    if (!needsUpdate) {
      const cachedScore = await loadCachedSafetyScore();
      if (cachedScore) {
        console.log("Using cached safety score");
        return cachedScore;
      }
    }

    console.log("Calculating new safety score");
    const scoreData = await calculateSafetyScore(speedingThreshold);
    await saveSafetyScore(scoreData);

    return scoreData;
  } catch (error) {
    console.error("Error getting safety score:", error);

    // Return a default score if everything fails
    return {
      overallScore: 100,
      speedScore: 100,
      lastUpdated: new Date().toISOString(),
      metrics: {
        totalDataPoints: 0,
        speedingEvents: 0,
        averageSpeedDeviation: 0,
        maxSpeedDeviation: 0,
        speedingDuration: 0,
        speedingPercentage: 0,
      },
      breakdown: {
        speedControl: 100,
        braking: 100,
        steering: 100,
        aggression: 100,
      },
    };
  }
};

/**
 * Clear cached safety score (useful for testing or reset)
 */
export const clearCachedScore = async () => {
  try {
    await FileSystem.deleteAsync(SCORE_FILE_URI, { idempotent: true });
    await AsyncStorage.removeItem(SAFETY_SCORE_KEY);

    // Clear timestamp cache as well
    latestTripTimestampCache = null;
    latestTripTimestampCacheTime = null;

    console.log("Cached safety score cleared");
  } catch (error) {
    console.error("Error clearing cached score:", error);
  }
};
