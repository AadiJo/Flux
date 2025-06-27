// Quick test to verify the acceleration calculation fix
const mockTrips = [
  {
    logs: [
      { acceleration: 2.5 }, // Positive acceleration
      { acceleration: -1.2 }, // Braking (should be ignored)
      { acceleration: 4.0 }, // Positive acceleration
      { acceleration: 8.5 }, // Harsh acceleration
      { acceleration: -3.0 }, // Braking (should be ignored)
      { acceleration: 1.8 }, // Gentle acceleration
    ],
  },
];

// Simulate the new acceleration calculation
const calculateAccelerationMetrics = (trips) => {
  let totalAccelerationEvents = 0;
  let totalAcceleration = 0;
  let maxAcceleration = 0;
  let minAcceleration = 0;
  let harshAccelerationEvents = 0;
  let dataPointsWithAcceleration = 0;

  for (const trip of trips) {
    if (!trip.logs || trip.logs.length === 0) continue;

    // Use the acceleration field already calculated and stored in logs
    for (const log of trip.logs) {
      const acceleration = log.acceleration;

      // Only process positive acceleration values (ignore braking/negative values)
      if (
        acceleration !== null &&
        acceleration !== undefined &&
        acceleration > 0
      ) {
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
        }
      }
    }
  }

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

console.log("Testing Acceleration Metrics Calculation:");
console.log(
  "Mock data: 6 log entries with 4 positive and 2 negative acceleration values"
);
console.log("=".repeat(60));

const metrics = calculateAccelerationMetrics(mockTrips);
console.log("Results:");
console.log("- Total Acceleration Events:", metrics.totalAccelerationEvents);
console.log(
  "- Average Acceleration:",
  metrics.averageAcceleration.toFixed(2),
  "mph/s"
);
console.log("- Max Acceleration:", metrics.maxAcceleration, "mph/s");
console.log("- Min Acceleration:", metrics.minAcceleration, "mph/s");
console.log("- Harsh Acceleration Events:", metrics.harshAccelerationEvents);
console.log(
  "- Harsh Acceleration %:",
  metrics.harshAccelerationPercentage.toFixed(1) + "%"
);
console.log(
  "- Data Points with Acceleration:",
  metrics.dataPointsWithAcceleration
);

console.log(
  "\nExpected: 4 positive acceleration events, ignoring the 2 negative ones"
);
console.log(
  "Average should be: (2.5 + 4.0 + 8.5 + 1.8) / 4 =",
  (2.5 + 4.0 + 8.5 + 1.8) / 4
);
