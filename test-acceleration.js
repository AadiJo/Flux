const fs = require("fs");

// Acceleration scoring function from the app
const calculateAccelerationScore = (
  avgAcceleration,
  aLowLimit = 0,
  aMinIdeal = 2,
  aMaxIdeal = 6,
  aHighLimit = 12
) => {
  if (avgAcceleration < aMinIdeal) {
    // Below ideal range
    const score =
      1 + ((avgAcceleration - aLowLimit) / (aMinIdeal - aLowLimit)) * 99;
    return Math.max(1, Math.min(100, Math.round(score)));
  } else if (avgAcceleration >= aMinIdeal && avgAcceleration <= aMaxIdeal) {
    // Within ideal range
    return 100;
  } else {
    // Above ideal range
    const score =
      100 - ((avgAcceleration - aMaxIdeal) / (aHighLimit - aMaxIdeal)) * 99;
    return Math.max(1, Math.min(100, Math.round(score)));
  }
};

// Acceleration metrics calculation from the app
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

// Read the log file
const logPath = "real_session_logs(1).jsonl";
const logContent = fs.readFileSync(logPath, "utf8");
const lines = logContent.trim().split("\n");

console.log("=== ACCELERATION SCORE TEST ===");
console.log("Log file:", logPath);
console.log("Total lines:", lines.length);

// Convert logs to trip format like the app does
const logs = [];
for (const line of lines) {
  try {
    const log = JSON.parse(line);
    logs.push(log);
  } catch (error) {
    console.error("Error parsing line:", error);
  }
}

// Create a single trip with all logs (mimicking the app's behavior for logs without connection markers)
const trip = {
  id: 1,
  startTime: logs[0]?.timestamp,
  endTime: logs[logs.length - 1]?.timestamp,
  logs: logs,
};

const trips = [trip];

console.log("\n=== RUNNING ACCELERATION ANALYSIS ===");

// Run the acceleration metrics calculation
const accelerationMetrics = calculateAccelerationMetrics(trips);

// Calculate the acceleration score
const accelerationScore = calculateAccelerationScore(
  accelerationMetrics.averageAcceleration
);

console.log("\n=== FINAL RESULTS ===");
console.log(
  "Acceleration Metrics:",
  JSON.stringify(accelerationMetrics, null, 2)
);
console.log("Acceleration Score:", accelerationScore);

// Compare with manual analysis
console.log("\n=== MANUAL VERIFICATION ===");
let manualPositiveCount = 0;
let manualTotalAcceleration = 0;
let manualHarshCount = 0;

for (const log of logs) {
  const acceleration = log.acceleration;
  if (acceleration !== null && acceleration !== undefined && acceleration > 0) {
    manualPositiveCount++;
    manualTotalAcceleration += acceleration;
    if (acceleration > 8) {
      manualHarshCount++;
    }
  }
}

const manualAverage =
  manualPositiveCount > 0 ? manualTotalAcceleration / manualPositiveCount : 0;

console.log(
  "Manual count - Positive acceleration events:",
  manualPositiveCount
);
console.log(
  "Manual count - Average acceleration:",
  manualAverage.toFixed(2),
  "mph/s"
);
console.log("Manual count - Harsh acceleration events:", manualHarshCount);

console.log("\n=== VERIFICATION ===");
console.log(
  "App calculation matches manual:",
  accelerationMetrics.totalAccelerationEvents === manualPositiveCount
);
console.log(
  "Average acceleration matches:",
  Math.abs(accelerationMetrics.averageAcceleration - manualAverage) < 0.01
);
console.log(
  "Harsh events match:",
  accelerationMetrics.harshAccelerationEvents === manualHarshCount
);
