import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOGGING_ACTIVE_KEY = "logging_active_";

const loggers = {
  sim: {
    uri: FileSystem.documentDirectory + "sim_session_logs.jsonl",
    isLoggingActive: false,
  },
  real: {
    uri: FileSystem.documentDirectory + "real_session_logs.jsonl",
    isLoggingActive: false,
    lastSpeed: null,
  },
};

// Initialize logging state from AsyncStorage
export const initializeLogging = async () => {
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

  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
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
    const newContent = existingContent + JSON.stringify(logEntry) + "\n";

    // Write the updated content back to the file
    await FileSystem.writeAsStringAsync(logger.uri, newContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Update last logged speed
    if (logType === "real" && data.obd2Data) {
      logger.lastSpeed = data.obd2Data.speed;
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
    if (logType === "real") {
      logger.lastSpeed = null;
    }
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
 */
export const getTripsFromLogs = async (logType) => {
  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return [];
  }

  try {
    const logs = await getLogs(logType);
    const trips = [];
    let currentTrip = null;

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
