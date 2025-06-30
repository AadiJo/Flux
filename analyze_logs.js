const fs = require("fs");

// Read the log file
const logPath = "real_session_logs(1).jsonl";
const logContent = fs.readFileSync(logPath, "utf8");
const lines = logContent.trim().split("\n");

let totalLogs = 0;
let speedingEvents = 0;
let accelerationEvents = 0;
let totalAcceleration = 0;
let positiveAccelerationCount = 0;
let speedingThreshold = 5; // mph over limit

console.log("Analyzing log file...");
console.log("Total lines:", lines.length);

for (const line of lines) {
  try {
    const log = JSON.parse(line);
    totalLogs++;

    const speed = log.obd2Data?.speed;
    const speedLimit = log.speedLimit;
    const acceleration = log.acceleration;

    // Check for speeding events
    if (speed && speedLimit) {
      const deviation = speed - speedLimit;
      if (deviation > speedingThreshold) {
        speedingEvents++;
        console.log(
          `Speeding event: ${speed.toFixed(2)} mph (limit: ${speedLimit.toFixed(
            2
          )} mph, over by: ${deviation.toFixed(2)} mph)`
        );
      }
    }

    // Check for acceleration events
    if (acceleration !== null && acceleration !== undefined) {
      if (acceleration > 0) {
        accelerationEvents++;
        totalAcceleration += acceleration;
        positiveAccelerationCount++;
      }
    }
  } catch (error) {
    console.error("Error parsing line:", error);
  }
}

console.log("\n=== ANALYSIS RESULTS ===");
console.log("Total log entries:", totalLogs);
console.log(
  "Speeding events (>" + speedingThreshold + " mph over limit):",
  speedingEvents
);
console.log("Positive acceleration events:", accelerationEvents);
console.log(
  "Average positive acceleration:",
  positiveAccelerationCount > 0
    ? (totalAcceleration / positiveAccelerationCount).toFixed(2)
    : 0,
  "mph/s"
);
console.log(
  "Percentage speeding:",
  totalLogs > 0 ? ((speedingEvents / totalLogs) * 100).toFixed(2) + "%" : "0%"
);
