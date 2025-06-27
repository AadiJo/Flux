/**
 * Simple tests for the scoring system
 * Run this in a JavaScript environment to verify the scoring formula
 */

// Test the scoring formula directly
const calculateSpeedScore = (
  averageSpeedDeviation,
  decayRate = 1.5,
  maxPenalty = 20
) => {
  if (averageSpeedDeviation <= 0) {
    return 100; // Perfect score if no deviation
  }

  const score =
    100 * Math.exp((-decayRate * averageSpeedDeviation) / maxPenalty);
  return Math.max(1, Math.min(100, Math.round(score)));
};

// Test cases
const testCases = [
  { deviation: 0, expected: 100, description: "No deviation" },
  { deviation: 1, expected: 93, description: "1 mph over threshold" },
  { deviation: 5, expected: 74, description: "5 mph over threshold" },
  { deviation: 10, expected: 47, description: "10 mph over threshold" },
  { deviation: 15, expected: 24, description: "15 mph over threshold" },
  { deviation: 20, expected: 11, description: "20 mph over threshold" },
  { deviation: 30, expected: 2, description: "30 mph over threshold" },
  {
    deviation: 50,
    expected: 1,
    description: "50 mph over threshold (should be minimum)",
  },
];

console.log("Testing Safety Score Formula:");
console.log("Score(d) = max(1, 100 × e^(-1.5 × d / 20))");
console.log("Where d is average speed deviation beyond ±5 mph threshold");
console.log("=".repeat(60));

let allTestsPassed = true;

testCases.forEach(({ deviation, expected, description }) => {
  const actual = calculateSpeedScore(deviation);
  const tolerance = 2; // Allow 2 point difference due to rounding
  const passed = Math.abs(actual - expected) <= tolerance;

  console.log(
    `${description}: ${actual} (expected ~${expected}) ${passed ? "✓" : "✗"}`
  );

  if (!passed) {
    allTestsPassed = false;
  }
});

console.log("=".repeat(60));
console.log(`All tests passed: ${allTestsPassed ? "✓" : "✗"}`);

// Test with realistic driving data
console.log("\nRealistic Driving Scenarios:");
console.log("-".repeat(40));

const scenarios = [
  {
    avgDeviation: 0,
    description: "Perfect driver (never exceeds limit by more than 5mph)",
  },
  {
    avgDeviation: 2,
    description: "Good driver (averages 7mph over limit in speeding zones)",
  },
  {
    avgDeviation: 5,
    description: "Average driver (averages 10mph over limit in speeding zones)",
  },
  {
    avgDeviation: 8,
    description:
      "Aggressive driver (averages 13mph over limit in speeding zones)",
  },
  {
    avgDeviation: 12,
    description:
      "Reckless driver (averages 17mph over limit in speeding zones)",
  },
];

scenarios.forEach(({ avgDeviation, description }) => {
  const score = calculateSpeedScore(avgDeviation);
  let grade;
  if (score >= 95) grade = "A+";
  else if (score >= 90) grade = "A";
  else if (score >= 85) grade = "B+";
  else if (score >= 80) grade = "B";
  else if (score >= 75) grade = "C+";
  else if (score >= 70) grade = "C";
  else if (score >= 65) grade = "D+";
  else if (score >= 60) grade = "D";
  else grade = "F";

  console.log(`${description}: Score ${score} (Grade: ${grade})`);
});

// Test the acceleration scoring formula
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

// Acceleration test cases
const accelerationTestCases = [
  { acceleration: 0, expected: 1, description: "0 mph/s (too gentle)" },
  { acceleration: 1, expected: 50, description: "1 mph/s (gentle)" },
  {
    acceleration: 2,
    expected: 100,
    description: "2 mph/s (ideal lower bound)",
  },
  { acceleration: 4, expected: 100, description: "4 mph/s (ideal mid-range)" },
  {
    acceleration: 6,
    expected: 100,
    description: "6 mph/s (ideal upper bound)",
  },
  {
    acceleration: 8,
    expected: 67,
    description: "8 mph/s (moderate aggression)",
  },
  { acceleration: 9, expected: 50, description: "9 mph/s (aggressive)" },
  { acceleration: 10, expected: 34, description: "10 mph/s (very aggressive)" },
  { acceleration: 12, expected: 1, description: "12 mph/s (dangerous)" },
  {
    acceleration: 15,
    expected: 1,
    description: "15 mph/s (extremely dangerous)",
  },
];

console.log("\n" + "=".repeat(60));
console.log("Testing Acceleration Score Formula:");
console.log("Piecewise Linear Function with ideal range 2-6 mph/s");
console.log("=".repeat(60));

let allAccelerationTestsPassed = true;

accelerationTestCases.forEach(({ acceleration, expected, description }) => {
  const actual = calculateAccelerationScore(acceleration);
  const tolerance = 5; // Allow 5 point difference due to rounding
  const passed = Math.abs(actual - expected) <= tolerance;

  console.log(
    `${description}: ${actual} (expected ~${expected}) ${passed ? "✓" : "✗"}`
  );

  if (!passed) {
    allAccelerationTestsPassed = false;
  }
});

console.log("\n" + "=".repeat(60));
console.log(
  allAccelerationTestsPassed
    ? "All acceleration tests passed! ✓"
    : "Some acceleration tests failed! ✗"
);
console.log("=".repeat(60));

// Test overall score calculation
console.log("\nTesting Overall Score Calculation:");
console.log("Overall Score = (Speed Score + Acceleration Score) / 2");
console.log("=".repeat(60));

const overallTestCases = [
  {
    speed: 100,
    acceleration: 100,
    expected: 100,
    description: "Perfect driving",
  },
  {
    speed: 85,
    acceleration: 92,
    expected: 89,
    description: "Excellent driving",
  },
  { speed: 70, acceleration: 80, expected: 75, description: "Good driving" },
  { speed: 50, acceleration: 60, expected: 55, description: "Fair driving" },
  { speed: 30, acceleration: 40, expected: 35, description: "Poor driving" },
];

overallTestCases.forEach(({ speed, acceleration, expected, description }) => {
  const actual = Math.round((speed + acceleration) / 2);
  const passed = actual === expected;

  console.log(
    `${description}: Speed ${speed}, Acceleration ${acceleration} → Overall ${actual} (expected ${expected}) ${
      passed ? "✓" : "✗"
    }`
  );
});

module.exports = { calculateSpeedScore, calculateAccelerationScore };
