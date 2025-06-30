const fs = require("fs");

// Mock the app's trip creation logic based on the loggingService
const createTripsFromLogs = (logs) => {
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
    console.log("No connection markers found, treating as single trip");
    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];

    // Filter out connection markers and get only driving data
    const drivingLogs = logs.filter((log) => log.type !== "CONNECTION_MARKER");

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
};

// App's acceleration metrics calculation
const calculateAccelerationMetrics = (trips) => {
  let totalAccelerationEvents = 0;
  let totalAcceleration = 0;
  let maxAcceleration = 0;
  let minAcceleration = 0;
  let harshAccelerationEvents = 0;
  let dataPointsWithAcceleration = 0;

  console.log(`calculateAccelerationMetrics: Processing ${trips.length} trips`);

  for (const trip of trips) {
    if (!trip.logs || trip.logs.length === 0) {
      console.log(`Trip ${trip.id || "unknown"} has no logs for acceleration`);
      continue;
    }

    console.log(
      `Processing acceleration for trip ${trip.id || "unknown"} with ${
        trip.logs.length
      } logs`
    );
    let logsSampled = 0;
    let nullAccelerationCount = 0;
    let zeroAccelerationCount = 0;
    let negativeAccelerationCount = 0;
    let positiveAccelerationCount = 0;

    // Use the acceleration field already calculated and stored in logs
    for (const log of trip.logs) {
      const acceleration = log.acceleration;
      logsSampled++;

      if (acceleration === null || acceleration === undefined) {
        nullAccelerationCount++;
      } else if (acceleration === 0) {
        zeroAccelerationCount++;
      } else if (acceleration < 0) {
        negativeAccelerationCount++;
      } else if (acceleration > 0) {
        positiveAccelerationCount++;
        totalAcceleration += acceleration;
        totalAccelerationEvents++;
        dataPointsWithAcceleration++;

        maxAcceleration = Math.max(maxAcceleration, acceleration);
        minAcceleration =
          minAcceleration === 0
            ? acceleration
            : Math.min(minAcceleration, acceleration);

        // Count harsh acceleration events (> 8 mph/s as example threshold)
        if (acceleration > 8) {
          harshAccelerationEvents++;
          console.log(
            `Harsh acceleration event: ${acceleration.toFixed(2)} mph/s`
          );
        }

        // Log first few positive acceleration values for debugging
        if (positiveAccelerationCount <= 5) {
          console.log(`Positive acceleration found: ${acceleration} mph/s`);
        }
      }
    }

    console.log(`Trip ${trip.id || "unknown"} acceleration summary:`);
    console.log(`  - Total logs: ${logsSampled}`);
    console.log(`  - Null/undefined acceleration: ${nullAccelerationCount}`);
    console.log(`  - Zero acceleration: ${zeroAccelerationCount}`);
    console.log(`  - Negative acceleration: ${negativeAccelerationCount}`);
    console.log(`  - Positive acceleration: ${positiveAccelerationCount}`);
  }

  console.log(
    `calculateAccelerationMetrics: Final results - totalAccelerationEvents: ${totalAccelerationEvents}, averageAcceleration: ${
      totalAccelerationEvents > 0
        ? (totalAcceleration / totalAccelerationEvents).toFixed(2)
        : 0
    } mph/s, harshEvents: ${harshAccelerationEvents}`
  );

  return {
    totalAccelerationEvents,
    averageAcceleration:
      totalAccelerationEvents > 0
        ? totalAcceleration / totalAccelerationEvents
        : 0,
    maxAcceleration,
    minAcceleration,
    harshAccelerationEvents,
    harshAccelerationPercentage:
      dataPointsWithAcceleration > 0
        ? (harshAccelerationEvents / dataPointsWithAcceleration) * 100
        : 0,
    dataPointsWithAcceleration,
  };
};

// Main execution
console.log("=== DEBUGGING APP PROCESSING VS TEST ===");

// Read the log file
const logPath = "real_session_logs(1).jsonl";
try {
  const logContent = fs.readFileSync(logPath, "utf8");
  const lines = logContent.trim().split("\n");

  console.log("Log file:", logPath);
  console.log("Total lines:", lines.length);

  // Convert logs
  const logs = [];
  for (const line of lines) {
    try {
      const log = JSON.parse(line);
      logs.push(log);
    } catch (error) {
      console.error("Error parsing line:", error);
    }
  }

  console.log("Parsed logs:", logs.length);

  // Check for connection markers
  const connectionMarkers = logs.filter(
    (log) => log.type === "CONNECTION_MARKER"
  );
  console.log("Connection markers found:", connectionMarkers.length);

  // Create trips using app logic
  const trips = createTripsFromLogs(logs);
  console.log("\n=== APP-STYLE TRIP CREATION ===");
  console.log("Trips created:", trips.length);

  trips.forEach((trip, index) => {
    console.log(`Trip ${index + 1}:`, {
      id: trip.id,
      logsCount: trip.logs?.length || 0,
      startTime: trip.startTime,
      endTime: trip.endTime,
      roadName: trip.roadName,
    });
  });

  // Run acceleration calculation
  console.log("\n=== RUNNING APP-STYLE ACCELERATION CALCULATION ===");
  const metrics = calculateAccelerationMetrics(trips);

  console.log("\n=== COMPARISON ===");
  console.log("App-style processing results:");
  console.log(`- Acceleration Events: ${metrics.totalAccelerationEvents}`);
  console.log(
    `- Average Acceleration: ${metrics.averageAcceleration.toFixed(2)} mph/s`
  );
  console.log(`- Harsh Events: ${metrics.harshAccelerationEvents}`);

  console.log("\nTest file results (from earlier):");
  console.log("- Acceleration Events: 48");
  console.log("- Average Acceleration: 7.28 mph/s");
  console.log("- Harsh Events: 3");

  console.log("\nUser's app results:");
  console.log("- Acceleration Events: 14");
  console.log("- Average Acceleration: 5.5 mph/s");
} catch (error) {
  console.error("Error reading log file:", error);
  console.log("Make sure the log file exists at the specified path");
}
