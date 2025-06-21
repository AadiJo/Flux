import * as FileSystem from "expo-file-system";

/**
 * Utility function to add acceleration data to existing log files
 * This function processes log files and calculates acceleration based on speed changes
 */
export const addAccelerationToLogs = async (logType) => {
  const loggers = {
    sim: {
      uri: FileSystem.documentDirectory + "sim_session_logs.jsonl",
    },
    real: {
      uri: FileSystem.documentDirectory + "real_session_logs.jsonl",
    },
  };

  if (!loggers[logType]) {
    console.error("Invalid log type:", logType);
    return false;
  }

  const logger = loggers[logType];

  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(logger.uri);
    if (!fileInfo.exists) {
      console.log(`Log file for ${logType} does not exist.`);
      return false;
    }

    // Read existing content
    const fileContent = await FileSystem.readAsStringAsync(logger.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!fileContent) {
      console.log(`Log file for ${logType} is empty.`);
      return false;
    }

    // Parse existing logs
    const logEntries = fileContent
      .trim()
      .split("\n")
      .filter((line) => line)
      .map((line) => JSON.parse(line));

    console.log(
      `Processing ${logEntries.length} log entries for ${logType}...`
    );

    // Process logs and add acceleration
    let lastSpeed = null;
    let lastTimestamp = null;
    let processedCount = 0;

    const updatedLogs = logEntries.map((entry, index) => {
      // Skip connection markers
      if (entry.type === "CONNECTION_MARKER") {
        // Reset tracking when we encounter connection markers
        lastSpeed = null;
        lastTimestamp = null;
        return entry;
      }

      // If acceleration already exists, skip
      if (entry.acceleration !== null && entry.acceleration !== undefined) {
        // Update tracking variables for next calculation
        if (
          entry.obd2Data?.speed !== null &&
          entry.obd2Data?.speed !== undefined
        ) {
          lastSpeed = entry.obd2Data.speed;
          lastTimestamp = new Date(entry.timestamp);
        }
        return entry;
      }

      // Calculate acceleration
      let acceleration = null;
      const currentSpeed = entry.obd2Data?.speed;
      const currentTimestamp = new Date(entry.timestamp);

      if (
        currentSpeed !== null &&
        currentSpeed !== undefined &&
        lastSpeed !== null &&
        lastTimestamp !== null
      ) {
        const timeDifference = (currentTimestamp - lastTimestamp) / 1000; // Convert to seconds
        if (timeDifference > 0) {
          // Acceleration in mph/s
          acceleration = (currentSpeed - lastSpeed) / timeDifference;
          // Round to 2 decimal places for cleaner data
          acceleration = Math.round(acceleration * 100) / 100;
        }
      }

      // Update tracking variables
      if (currentSpeed !== null && currentSpeed !== undefined) {
        lastSpeed = currentSpeed;
        lastTimestamp = currentTimestamp;
      }

      processedCount++;
      return {
        ...entry,
        acceleration: acceleration,
      };
    });

    // Write updated logs back to file
    const updatedContent =
      updatedLogs.map((entry) => JSON.stringify(entry)).join("\n") + "\n";

    await FileSystem.writeAsStringAsync(logger.uri, updatedContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log(
      `Successfully updated ${processedCount} log entries with acceleration data for ${logType}.`
    );
    return true;
  } catch (error) {
    console.error(`Failed to add acceleration to ${logType} logs:`, error);
    return false;
  }
};

/**
 * Migrate all log files (both sim and real) to include acceleration data
 */
export const migrateAllLogs = async () => {
  console.log("Starting log migration to add acceleration data...");

  const simResult = await addAccelerationToLogs("sim");
  const realResult = await addAccelerationToLogs("real");

  if (simResult && realResult) {
    console.log("All log files successfully migrated!");
  } else if (simResult || realResult) {
    console.log("Some log files were migrated successfully.");
  } else {
    console.log(
      "No log files were migrated (they may not exist or already have acceleration data)."
    );
  }

  return { sim: simResult, real: realResult };
};
