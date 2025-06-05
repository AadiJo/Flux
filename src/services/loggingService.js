import * as FileSystem from "expo-file-system";

const logFileUri = FileSystem.documentDirectory + "session_logs.jsonl";

let isLoggingActive = false;

// Function to start a new logging session
export const startLogging = async () => {
  try {
    // Optional: Clear previous logs by deleting the file
    await FileSystem.deleteAsync(logFileUri, { idempotent: true });
    console.log("Log file cleared for new session.");
    // Create an empty file to start with
    await FileSystem.writeAsStringAsync(logFileUri, "", {
      encoding: FileSystem.EncodingType.UTF8,
    });
    isLoggingActive = true;
    console.log("Logging started.");
  } catch (error) {
    console.error("Failed to start logging:", error);
    isLoggingActive = false;
  }
};

// Function to stop the logging session
export const stopLogging = () => {
  if (isLoggingActive) {
    isLoggingActive = false;
    console.log("Logging stopped.");
  }
};

// Function to log data
export const logData = async (data) => {
  if (!isLoggingActive) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data,
  };

  try {
    // Read existing content
    let existingContent = "";
    const fileInfo = await FileSystem.getInfoAsync(logFileUri);
    if (fileInfo.exists) {
      existingContent = await FileSystem.readAsStringAsync(logFileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    // Append new log entry
    const newContent = existingContent + JSON.stringify(logEntry) + "\n";

    // Write the updated content back to the file
    await FileSystem.writeAsStringAsync(logFileUri, newContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
};

/**
 * Deletes the log file from the device.
 */
export const clearLogs = async () => {
  try {
    await FileSystem.deleteAsync(logFileUri, { idempotent: true });
    console.log("Log file deleted.");
  } catch (error) {
    console.error("Failed to delete log file:", error);
  }
};

// Function to retrieve all logs
export const getLogs = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(logFileUri);
    if (!fileInfo.exists) {
      console.log("Log file does not exist yet.");
      return [];
    }

    const fileContent = await FileSystem.readAsStringAsync(logFileUri, {
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
    console.error("Failed to read log file:", error);
    return [];
  }
};
