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

module.exports = { calculateSpeedScore };
