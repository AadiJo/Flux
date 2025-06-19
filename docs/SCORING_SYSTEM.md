# Safety Score System

This document describes the safety scoring system implemented in Flux.

## Overview

The safety scoring system calculates a driver's safety score based on their driving behavior, with a primary focus on speed control. The system analyzes trip data collected from OBD-II devices and calculates scores using mathematical formulas based on driving research.

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

## Scoring Formula

The primary scoring formula is based on speed deviation and time spent speeding:

```javascript
Score(d, p) = 100 × exp(-k × d/M) × (1 - c×p)
```

Where:

- `d` = average speed deviation (in mph) beyond ±5mph threshold
- `p` = proportion of time spent speeding (0.0 to 1.0)
- `k` = 0.7 (exponential decay rate)
- `M` = 20 (expected max penalty speed in mph)
- `c` = 0.4 (scaling factor for time penalty impact)

### Example Scores

- **0 mph over, 0% time speeding**: 100 points (Perfect)
- **2 mph over, 5% time speeding**: 84 points (Excellent)
- **5 mph over, 10% time speeding**: 65 points (Good)
- **10 mph over, 20% time speeding**: 37 points (Fair)
- **15 mph over, 30% time speeding**: 18 points (Poor)
- **20+ mph over, 40%+ time speeding**: <10 points (Dangerous)

## Data Storage

### Score Cache File

- **Location**: `FileSystem.documentDirectory + "safety_score.json"`
- **Backup**: AsyncStorage with key `"safety_score_data"`
- **Format**: JSON object containing:
  ```json
  {
    "overallScore": 85,
    "speedScore": 85,
    "lastUpdated": "2025-06-19T10:30:00.000Z",
    "metrics": {
      "totalDataPoints": 1500,
      "speedingEvents": 45,
      "averageSpeedDeviation": 3.2,
      "maxSpeedDeviation": 15.8,
      "speedingDuration": 120,
      "speedingPercentage": 3.0
    },
    "breakdown": {
      "speedControl": 85,
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
- Score caching and automatic updates
- UI components for score display
- Integration with trip data from OBD-II devices

**Placeholder Values (Not Yet Implemented):**

- Braking score: Fixed at 75
- Steering score: Fixed at 80
- Aggression score: Fixed at 72

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
