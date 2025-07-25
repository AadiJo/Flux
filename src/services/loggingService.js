import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceMotion } from "expo-sensors";

// Import scoreManager to trigger updates when trips complete
let scoreManager = null;
try {
  scoreManager = require("../utils/scoreManager").scoreManager;
} catch (error) {
  // scoreManager not available, that's okay
}

const LOGGING_ACTIVE_KEY = "logging_active_";

// Store current device motion data
let currentDeviceMotion = {
  acceleration: { x: 0, y: 0, z: 0 },
  rotation: { alpha: 0, beta: 0, gamma: 0 },
};

// Motion subscription reference
let motionSubscription = null;

// G-force threshold for unsafe turning detection (in g units)
const UNSAFE_TURNING_THRESHOLD = 0.85;

const loggers = {
  sim: {
    uri: FileSystem.documentDirectory + "sim_session_logs.jsonl",
    isLoggingActive: false,
    lastSpeed: null,
    lastTimestamp: null,
  },
  real: {
    uri: FileSystem.documentDirectory + "real_session_logs.jsonl",
    isLoggingActive: false,
    lastSpeed: null,
    lastTimestamp: null,
  },
};

// Initialize motion sensor
const initializeMotionSensor = () => {
  if (motionSubscription) {
    return; // Already initialized
  }

  try {
    DeviceMotion.setUpdateInterval(100); // Update every 100ms
    motionSubscription = DeviceMotion.addListener((data) => {
      if (data && data.acceleration && data.rotation) {
        currentDeviceMotion = {
          acceleration: {
            x: data.acceleration.x || 0,
            y: data.acceleration.y || 0,
            z: data.acceleration.z || 0,
          },
          rotation: {
            alpha: data.rotation.alpha || 0,
            beta: data.rotation.beta || 0,
            gamma: data.rotation.gamma || 0,
          },
        };

        // Check for unsafe turning in both log types if they are active
        if (loggers.real.isLoggingActive) {
          checkAndLogUnsafeTurning("real", currentDeviceMotion.acceleration).catch(
            (error) => console.error("Error checking unsafe turning for real logs:", error)
          );
        }
        if (loggers.sim.isLoggingActive) {
          checkAndLogUnsafeTurning("sim", currentDeviceMotion.acceleration).catch(
            (error) => console.error("Error checking unsafe turning for sim logs:", error)
          );
        }
      }
    });
    console.log("Device motion sensor initialized for logging");
  } catch (error) {
    console.error("Failed to initialize device motion sensor:", error);
  }
};

// Cleanup motion sensor
const cleanupMotionSensor = () => {
  if (motionSubscription) {
    motionSubscription.remove();
    motionSubscription = null;
    console.log("Device motion sensor cleaned up");
  }
};

// Initialize logging state from AsyncStorage
export const initializeLogging = async () => {
  // Initialize motion sensor
  initializeMotionSensor();

  for (const logType in loggers) {
    try {
      const storedState = await AsyncStorage.getItem(
        `${LOGGING_ACTIVE_KEY}${logType}`
      );
      if (storedState !== null) {
        loggers[logType].isLoggingActive = JSON.parse(storedState);
        console.log(
          `Logging state for ${logType} restored to: ${loggers[logType].isLoggingActive}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to initialize logging state for ${logType}:`,
        error
      );
    }
  }
};

// Function to log connection state markers
const logConnectionMarker = async (logType, state, additionalData = {}) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return;
  }

  const logger = loggers[logType];
  const markerEntry = {
    timestamp: new Date().toISOString(),
    type: "CONNECTION_MARKER",
    state: state, // "CONNECTED" or "DISCONNECTED"
    message: `Scanning ${state.toLowerCase()} - ${
      state === "CONNECTED" ? "started" : "stopped"
    } logging session`,
    ...additionalData,
  };

  // Add street name from additional data
  if (additionalData.streetName) {
    markerEntry.streetName = additionalData.streetName;
  } else if (additionalData.lastStreetName) {
    markerEntry.streetName = additionalData.lastStreetName;
  }

  try {
    // Read existing content
    let existingContent = "";
    const fileInfo = await FileSystem.getInfoAsync(logger.uri);
    if (fileInfo.exists) {
      existingContent = await FileSystem.readAsStringAsync(logger.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Append new marker entry
    const newContent = existingContent + JSON.stringify(markerEntry) + "\n";

    // Write the updated content back to the file
    await FileSystem.writeAsStringAsync(logger.uri, newContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(`Connection marker logged for ${logType}: ${state}`);
  } catch (error) {
    console.error(`Failed to write connection marker for ${logType}:`, error);
  }
};

// Function to check for unsafe turning and log the event
const checkAndLogUnsafeTurning = async (logType, acceleration, additionalData = {}) => {
  if (!loggers[logType] || !loggers[logType].isLoggingActive) {
    return;
  }

  // Check if any axis exceeds the threshold
  const maxGForce = Math.max(
    Math.abs(acceleration.x),
    Math.abs(acceleration.y),
    Math.abs(acceleration.z)
  );

  if (maxGForce > UNSAFE_TURNING_THRESHOLD) {
    const unsafeTurningEntry = {
      timestamp: new Date().toISOString(),
      type: "UNSAFE_TURNING",
      gForce: {
        x: Math.round(acceleration.x * 1000) / 1000,
        y: Math.round(acceleration.y * 1000) / 1000,
        z: Math.round(acceleration.z * 1000) / 1000,
        max: Math.round(maxGForce * 1000) / 1000,
      },
      threshold: UNSAFE_TURNING_THRESHOLD,
      message: `Unsafe turning detected - G-force exceeded ${UNSAFE_TURNING_THRESHOLD}g (max: ${Math.round(maxGForce * 1000) / 1000}g)`,
      severity: maxGForce > 1.0 ? "HIGH" : "MEDIUM",
      ...additionalData,
    };

    try {
      const logger = loggers[logType];
      // Read existing content
      let existingContent = "";
      const fileInfo = await FileSystem.getInfoAsync(logger.uri);
      if (fileInfo.exists) {
        existingContent = await FileSystem.readAsStringAsync(logger.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      // Append new unsafe turning entry
      const newContent = existingContent + JSON.stringify(unsafeTurningEntry) + "\n";

      // Write the updated content back to the file
      await FileSystem.writeAsStringAsync(logger.uri, newContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log(`Unsafe turning event logged for ${logType}: ${maxGForce}g`);
    } catch (error) {
      console.error(`Failed to write unsafe turning event for ${logType}:`, error);
    }
  }
};

// Function to start a new logging session
export const startLogging = async (logType, additionalData = {}) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return;
  }
  const logger = loggers[logType];
  logger.isLoggingActive = true;
  try {
    await AsyncStorage.setItem(
      `${LOGGING_ACTIVE_KEY}${logType}`,
      JSON.stringify(true)
    );
    console.log(`Logging started and state saved for ${logType}.`);

    // Log connection start marker
    await logConnectionMarker(logType, "CONNECTED", additionalData);
  } catch (error) {
    console.error(`Failed to save logging state for ${logType}:`, error);
  }
};

// Function to stop the logging session
export const stopLogging = async (logType, additionalData = {}) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return;
  }
  const logger = loggers[logType];

  // Log disconnection marker before stopping
  if (logger.isLoggingActive) {
    await logConnectionMarker(logType, "DISCONNECTED", additionalData);
  }

  logger.isLoggingActive = false;
  try {
    await AsyncStorage.setItem(
      `${LOGGING_ACTIVE_KEY}${logType}`,
      JSON.stringify(false)
    );
    console.log(`Logging stopped and state saved for ${logType}.`);

    // Trigger score update when logging stops (trip completed)
    if (scoreManager) {
      try {
        // Use setTimeout to avoid blocking the logging stop process
        setTimeout(() => {
          scoreManager.refreshScores(5, false).catch(console.error);
        }, 1000);
      } catch (error) {
        console.error("Error triggering score update:", error);
      }
    }
  } catch (error) {
    console.error(`Failed to save logging state for ${logType}:`, error);
  }
};

// Function to log data
export const logData = async (logType, data) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return;
  }
  const logger = loggers[logType];

  if (!logger.isLoggingActive) {
    return;
  }

  // Don't log if speed is 0 and the last logged speed was also 0
  if (
    logType === "real" &&
    data.obd2Data?.speed === 0 &&
    logger.lastSpeed === 0
  ) {
    return;
  }

  // Calculate acceleration
  let acceleration = null;
  const currentTimestamp = new Date();
  const currentSpeed = data.obd2Data?.speed;

  if (
    currentSpeed !== null &&
    currentSpeed !== undefined &&
    logger.lastSpeed !== null &&
    logger.lastTimestamp !== null
  ) {
    const timeDifference = (currentTimestamp - logger.lastTimestamp) / 1000; // Convert to seconds
    if (timeDifference > 0) {
      // Acceleration in mph/s
      acceleration = (currentSpeed - logger.lastSpeed) / timeDifference;
      // Round to 2 decimal places for cleaner data
      acceleration = Math.round(acceleration * 100) / 100;
    }
  }

  // Calculate current g-force for unsafe turning detection
  const maxGForce = Math.max(
    Math.abs(currentDeviceMotion.acceleration.x),
    Math.abs(currentDeviceMotion.acceleration.y),
    Math.abs(currentDeviceMotion.acceleration.z)
  );

  // Determine if this snapshot represents unsafe turning
  const isUnsafeTurning = maxGForce > UNSAFE_TURNING_THRESHOLD;
  const turningSeverity = isUnsafeTurning 
    ? (maxGForce > 1.0 ? "HIGH" : "MEDIUM") 
    : "SAFE";

  const logEntry = {
    timestamp: currentTimestamp.toISOString(),
    ...data,
    acceleration: acceleration, // Add speed-based acceleration to log entry
    deviceMotion: {
      acceleration: {
        x: Math.round(currentDeviceMotion.acceleration.x * 1000) / 1000,
        y: Math.round(currentDeviceMotion.acceleration.y * 1000) / 1000,
        z: Math.round(currentDeviceMotion.acceleration.z * 1000) / 1000,
      },
      rotation: {
        alpha: Math.round(currentDeviceMotion.rotation.alpha * 1000) / 1000,
        beta: Math.round(currentDeviceMotion.rotation.beta * 1000) / 1000,
        gamma: Math.round(currentDeviceMotion.rotation.gamma * 1000) / 1000,
      },
      maxGForce: Math.round(maxGForce * 1000) / 1000,
    },
    turningAnalysis: {
      isUnsafeTurning: isUnsafeTurning,
      severity: turningSeverity,
      threshold: UNSAFE_TURNING_THRESHOLD,
      maxGForce: Math.round(maxGForce * 1000) / 1000,
      exceedsThreshold: isUnsafeTurning ? Math.round((maxGForce - UNSAFE_TURNING_THRESHOLD) * 1000) / 1000 : 0,
    },
  };

  try {
    // Read existing content
    let existingContent = "";
    const fileInfo = await FileSystem.getInfoAsync(logger.uri);
    if (fileInfo.exists) {
      existingContent = await FileSystem.readAsStringAsync(logger.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Append new log entry
    const newContent = existingContent + JSON.stringify(logEntry) + "\n"; // Write the updated content back to the file
    await FileSystem.writeAsStringAsync(logger.uri, newContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Update last logged speed and timestamp for acceleration calculation
    if (data.obd2Data && currentSpeed !== null && currentSpeed !== undefined) {
      logger.lastSpeed = currentSpeed;
      logger.lastTimestamp = currentTimestamp;
    }
  } catch (error) {
    console.error(`Failed to write to log file for ${logType}:`, error);
  }
};

/**
 * Deletes the log file from the device.
 */
export const clearLogs = async (logType) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return;
  }
  const logger = loggers[logType];
  try {
    await FileSystem.deleteAsync(logger.uri, { idempotent: true });
    console.log(`Log file for ${logType} deleted.`);
    // Reset tracking data when clearing logs
    logger.lastSpeed = null;
    logger.lastTimestamp = null;
  } catch (error) {
    console.error(`Failed to delete log file for ${logType}:`, error);
  }
};

// Function to retrieve all logs
export const getLogs = async (logType) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return [];
  }
  const logger = loggers[logType];

  try {
    const fileInfo = await FileSystem.getInfoAsync(logger.uri);
    if (!fileInfo.exists) {
      console.log(`Log file for ${logType} does not exist yet.`);
      return [];
    }

    const fileContent = await FileSystem.readAsStringAsync(logger.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!fileContent) {
      return [];
    }

    // Split by newline and parse each line as JSON
    const logEntries = fileContent
      .trim()
      .split("\n")
      .filter((line) => line)
      .map((line) => JSON.parse(line));

    return logEntries;
  } catch (error) {
    console.error(`Failed to read log file for ${logType}:`, error);
    return [];
  }
};

/**
 * Extracts trips from logs based on connection markers
 * A trip is defined as the period between a CONNECTED and DISCONNECTED marker
 * If no connection markers are found, treats all logs as one continuous trip
 */
export const getTripsFromLogs = async (logType) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return [];
  }

  try {
    const logs = await getLogs(logType);
    if (!logs || logs.length === 0) {
      return [];
    }

    const trips = [];
    let currentTrip = null;
    let hasConnectionMarkers = false;

    // First pass: check if we have connection markers
    for (const log of logs) {
      if (log.type === "CONNECTION_MARKER") {
        hasConnectionMarkers = true;
        break;
      }
    }

    if (!hasConnectionMarkers) {
      // No connection markers found, treat all logs as one trip
      console.log(
        `No connection markers found in ${logType} logs, treating as single trip`
      );
      const firstLog = logs[0];
      const lastLog = logs[logs.length - 1];

      // Filter out connection markers and get only driving data
      const drivingLogs = logs.filter(
        (log) => log.type !== "CONNECTION_MARKER"
      );

      if (drivingLogs.length > 0) {
        const trip = {
          id: 1,
          startTime: firstLog.timestamp,
          startMessage: "Auto-detected trip start",
          endTime: lastLog.timestamp,
          endMessage: "Auto-detected trip end",
          roadName: "Mixed Routes",
          logs: drivingLogs,
        };

        // Try to get a meaningful road name from the logs
        const logWithStreet = drivingLogs.find((log) => log.streetName);
        if (logWithStreet) {
          trip.roadName = logWithStreet.streetName;
        }

        trips.push(trip);
      }

      return trips;
    }

    // Original logic for when connection markers exist
    for (const log of logs) {
      if (log.type === "CONNECTION_MARKER") {
        if (log.state === "CONNECTED") {
          // Start a new trip
          currentTrip = {
            id: trips.length + 1,
            startTime: log.timestamp,
            startMessage: log.message,
            endTime: null,
            endMessage: null,
            roadName: null,
            logs: [],
          };
        } else if (log.state === "DISCONNECTED" && currentTrip) {
          // End the current trip
          currentTrip.endTime = log.timestamp;
          currentTrip.endMessage = log.message;

          // Extract road name from disconnect marker if available
          if (log.streetName) {
            currentTrip.roadName = log.streetName;
          } else {
            // Try to get road name from the last log entry with street name
            const lastLogWithStreet = currentTrip.logs
              .slice()
              .reverse()
              .find((logEntry) => logEntry.streetName);
            if (lastLogWithStreet) {
              currentTrip.roadName = lastLogWithStreet.streetName;
            } else {
              currentTrip.roadName = "Unknown Road";
            }
          }

          trips.push(currentTrip);
          currentTrip = null;
        }
      } else if (currentTrip) {
        // Add regular log entries to the current trip
        currentTrip.logs.push(log);
      }
    }

    // If there's an ongoing trip (no disconnect marker yet), add it
    if (currentTrip) {
      currentTrip.roadName = "Current Trip";
      trips.push(currentTrip);
    }

    return trips;
  } catch (error) {
    console.error(`Failed to extract trips from ${logType} logs:`, error);
    return [];
  }
};

/**
 * Gets all trips from both sim and real logs
 */
export const getAllTrips = async () => {
  try {
    const simTrips = await getTripsFromLogs("sim");
    const realTrips = await getTripsFromLogs("real");

    // Combine and sort by start time (newest first)
    const allTrips = [...simTrips, ...realTrips].sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    );

    return allTrips;
  } catch (error) {
    console.error("Failed to get all trips:", error);
    return [];
  }
};

/**
 * Cleanup function to properly dispose of motion sensor and other resources
 * Call this when the app is being closed or logging service is no longer needed
 */
export const cleanup = () => {
  cleanupMotionSensor();
};

/**
 * Get current device motion data
 * Useful for debugging or displaying current motion state
 */
export const getCurrentDeviceMotion = () => {
  return { ...currentDeviceMotion };
};

/**
 * Get unsafe turning events from logs
 * Returns only the log entries that are marked as UNSAFE_TURNING
 */
export const getUnsafeTurningEvents = async (logType) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return [];
  }

  try {
    const logs = await getLogs(logType);
    return logs.filter(log => log.type === "UNSAFE_TURNING");
  } catch (error) {
    console.error(`Failed to get unsafe turning events for ${logType}:`, error);
    return [];
  }
};

/**
 * Get all unsafe turning events from both sim and real logs
 */
export const getAllUnsafeTurningEvents = async () => {
  try {
    const simEvents = await getUnsafeTurningEvents("sim");
    const realEvents = await getUnsafeTurningEvents("real");

    // Combine and sort by timestamp (newest first)
    const allEvents = [...simEvents, ...realEvents].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return allEvents;
  } catch (error) {
    console.error("Failed to get all unsafe turning events:", error);
    return [];
  }
};
