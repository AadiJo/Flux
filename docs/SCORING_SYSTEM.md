# Safety Score System

This document describes the safety scoring system implemented in Flux.

## Overview

The safety scoring system calculates a driver's safety score based on their driving behavior, with a focus on speed control and acceleration patterns. The system analyzes trip data collected from OBD-II devices and calculates scores using mathematical formulas based on driving research.

**Automatic Score Updates:**

- Scores are automatically recalculated when new trip data is detected
- Uses timestamp comparison to determine if updates are needed (same logic as speeding detection)
- Both speed control and acceleration scores contribute to the overall safety score
- Score updates happen asynchronously to avoid blocking the UI

## File Structure

```
src/
├── services/
│   └── scoringService.js          // Core scoring calculations and caching
├── hooks/
│   └── useSafetyScore.js          // React hook for components
├── components/
│   └── ScoreDetailsCard.js        // UI component for detailed score display
├── utils/
│   ├── scoreManager.js            // Score update management across the app
│   └── scoringTest.js             // Test file for scoring formula validation
└── screens/
    └── ScoreDebugScreen.js        // Debug screen for testing (development)
```

## Scoring Formulas

### Speed Control Formula

The speed scoring formula is based on speed deviation and time spent speeding:

```javascript
Score(d, p) = 100 × exp(-k × d/M) × (1 - c×p)
```

Where:

- `d` = average speed deviation (in mph) beyond ±5mph threshold
- `p` = proportion of time spent speeding (0.0 to 1.0)
- `k` = 0.7 (exponential decay rate)
- `M` = 20 (expected max penalty speed in mph)
- `c` = 0.4 (scaling factor for time penalty impact)

### Acceleration Formula

The acceleration scoring formula uses a piecewise linear function:

```javascript
S(a) = {
  1 + (a - alow_limit) / (amin_ideal - alow_limit) × 99,     if a < amin_ideal
  100,                                                       if amin_ideal ≤ a ≤ amax_ideal
  100 - (a - amax_ideal) / (ahigh_limit - amax_ideal) × 99,  if a > amax_ideal
}
```

Where:

- `a` = Average positive acceleration (mph/s) from trip logs
- `alow_limit` = 0 (lower end of the range, too low)
- `amin_ideal` = 2 (lower bound of the ideal range)
- `amax_ideal` = 6 (upper bound of the ideal range)
- `ahigh_limit` = 12 (upper end of the range, too high)

**Data Source:** Uses pre-calculated acceleration values stored in trip logs. Only positive acceleration values are considered for this score; negative values (braking) are reserved for future braking score implementation.

**Example Acceleration Scores:**

- **0 mph/s average**: 1 point (Too gentle)
- **2 mph/s average**: 100 points (Perfect - lower ideal bound)
- **4 mph/s average**: 100 points (Perfect - within ideal range)
- **6 mph/s average**: 100 points (Perfect - upper ideal bound)
- **9 mph/s average**: 50 points (Aggressive)
- **12+ mph/s average**: 1 point (Dangerous)

### Example Overall Scores

- **0 mph over, 0% time speeding, 4 mph/s acceleration**: 100 points (Perfect)
- **2 mph over, 5% time speeding, 3 mph/s acceleration**: 84 points (Excellent)
- **5 mph over, 10% time speeding, 5 mph/s acceleration**: 65 points (Good)
- **10 mph over, 20% time speeding, 8 mph/s acceleration**: 30 points (Fair)
- **15 mph over, 30% time speeding, 10 mph/s acceleration**: 15 points (Poor)
- **20+ mph over, 40%+ time speeding, 12+ mph/s acceleration**: <5 points (Dangerous)

## Data Storage

### Score Cache File

- **Location**: `FileSystem.documentDirectory + "safety_score.json"`
- **Backup**: AsyncStorage with key `"safety_score_data"`
- **Format**: JSON object containing:
  ```json
  {
    "overallScore": 85,
    "speedScore": 85,
    "accelerationScore": 92,
    "lastUpdated": "2025-06-19T10:30:00.000Z",
    "metrics": {
      "totalDataPoints": 1500,
      "speedingEvents": 45,
      "averageSpeedDeviation": 3.2,
      "maxSpeedDeviation": 15.8,
      "speedingDuration": 120,
      "speedingPercentage": 3.0,
      "totalAccelerationEvents": 1200,
      "averageAcceleration": 4.2,
      "maxAcceleration": 11.5,
      "minAcceleration": 0.8,
      "harshAccelerationEvents": 8,
      "harshAccelerationPercentage": 0.7,
      "dataPointsWithAcceleration": 1200
    },
    "breakdown": {
      "speedControl": 85,
      "acceleration": 92,
      "braking": 85,
      "steering": 90,
      "aggression": 80
    },
    "tripsAnalyzed": 12
  }
  ```

## Integration Points

### HomeScreen

- Displays overall score in circular progress component
- Shows breakdown scores in grid layout (only speed control is actively calculated)
- Provides access to detailed score modal
- Automatically refreshes when trips are loaded

### Current Implementation Status

**Implemented:**

- Speed control scoring based on deviation and time spent speeding
- Acceleration scoring based on piecewise linear function analyzing positive acceleration patterns only
- Score caching and automatic updates with timestamp-based refresh logic
- UI components for score display including detailed acceleration analysis
- Integration with trip data from OBD-II devices
- Comprehensive acceleration metrics tracking (positive values only - negative values reserved for future braking score)

**Placeholder Values (Not Yet Implemented):**

- Braking score: Fixed at 85
- Steering score: Fixed at 90

These placeholder scores are displayed in the UI but are not calculated from actual driving data.

### Logging Service

- Triggers score updates when logging sessions end
- Provides trip data for score calculations

### Settings Context

- Score recalculates when speeding threshold changes
- Threshold affects what constitutes a "speeding event"

## Performance Considerations

- Scores are cached and only recalculated when needed
- Large trip datasets are processed efficiently
- Score updates happen asynchronously to avoid blocking UI
- File-based storage provides reliable persistence

## Automatic Update Logic

The scoring system uses intelligent caching to minimize unnecessary calculations:

1. **Timestamp Comparison**: Compares the last score update timestamp with the latest trip data timestamp
2. **Conditional Updates**: Only recalculates scores when new trip data is detected
3. **Cache Management**: Uses both file-based storage and in-memory caching for optimal performance
4. **Background Processing**: Score calculations happen in the background without blocking the UI

This approach ensures that:

- Acceleration scores are always up-to-date with the latest driving data
- Battery life is preserved by avoiding unnecessary calculations
- The user experience remains smooth during score updates
