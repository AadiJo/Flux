const {
  calculateSpeedScore,
  calculateAccelerationScore,
} = require("./src/utils/scoringTest.js");

console.log("Quick Integration Test:");
console.log("=".repeat(40));

// Test the speed scoring
const speedScore = calculateSpeedScore(5); // 5 mph over threshold
console.log("Speed Score (5 mph over):", speedScore);

// Test the acceleration scoring
const accelScore = calculateAccelerationScore(4); // 4 mph/s (ideal)
console.log("Acceleration Score (4 mph/s):", accelScore);

// Test overall score
const overall = Math.round((speedScore + accelScore) / 2);
console.log("Overall Score:", overall);

console.log("=".repeat(40));
console.log("Integration test complete!");
