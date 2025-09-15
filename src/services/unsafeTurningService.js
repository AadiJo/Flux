/**
 * Service for processing unsafe turning events and creating map pins
 */

/**
 * Gets unsafe turning pins for a specific trip based on g-force threshold
 * @param {number} gForceThreshold - The g-force threshold (default 1.1)
 * @param {Object} trip - The trip object containing logs
 * @returns {Promise<Array>} - Array of unsafe turning pins
 */
export const getUnsafeTurningPinsForTrip = async (
  gForceThreshold = 1.1,
  trip
) => {
  console.log("Getting unsafe turning pins for trip:", trip?.roadName);

  if (!trip || !trip.logs) {
    console.log("No trip or no logs, returning empty array");
    return [];
  }

  const unsafeTurningPins = [];

  for (const log of trip.logs) {
    // Skip entries without proper data
    if (!log.location || !log.turningAnalysis) {
      continue;
    }

    // Check if this log entry represents unsafe turning
    if (log.turningAnalysis.isUnsafeTurning && log.turningAnalysis.maxGForce > gForceThreshold) {
      const pin = {
        latitude: log.location.latitude,
        longitude: log.location.longitude,
        timestamp: log.timestamp,
        type: 'unsafeTurning',
        color: 'blue',
        gForce: log.turningAnalysis.maxGForce,
        threshold: gForceThreshold,
        severity: log.turningAnalysis.severity,
        exceedsThreshold: log.turningAnalysis.exceedsThreshold,
        deviceMotion: log.deviceMotion,
        speed: log.obd2Data?.speed || 0,
        streetName: log.streetName,
      };

      unsafeTurningPins.push(pin);
    }
  }

  // Also check for standalone UNSAFE_TURNING events
  const unsafeTurningEvents = trip.logs.filter(log => log.type === "UNSAFE_TURNING");
  
  for (const event of unsafeTurningEvents) {
    // Try to find a nearby regular log entry with location data
    const nearbyLogWithLocation = trip.logs.find(log => {
      if (!log.location || log.type === "UNSAFE_TURNING" || log.type === "CONNECTION_MARKER") {
        return false;
      }
      
      // Check if timestamps are close (within 2 seconds)
      const timeDiff = Math.abs(new Date(event.timestamp) - new Date(log.timestamp));
      return timeDiff <= 2000; // 2 seconds
    });

    if (nearbyLogWithLocation) {
      const pin = {
        latitude: nearbyLogWithLocation.location.latitude,
        longitude: nearbyLogWithLocation.location.longitude,
        timestamp: event.timestamp,
        type: 'unsafeTurning',
        color: 'blue',
        gForce: event.gForce.max,
        threshold: event.threshold,
        severity: event.severity,
        exceedsThreshold: event.gForce.max - event.threshold,
        gForceValues: event.gForce,
        speed: nearbyLogWithLocation.obd2Data?.speed || 0,
        streetName: event.streetName || nearbyLogWithLocation.streetName,
        isStandaloneEvent: true,
      };

      unsafeTurningPins.push(pin);
    }
  }

  // Remove duplicate pins that are very close to each other (within 30 feet)
  const filteredPins = [];
  const mergeDistance = 30; // feet

  for (const pin of unsafeTurningPins) {
    let shouldAdd = true;
    
    for (const existingPin of filteredPins) {
      const distance = getDistanceInFeet(pin, existingPin);
      if (distance <= mergeDistance) {
        // Keep the pin with higher g-force
        if (pin.gForce > existingPin.gForce) {
          // Replace existing pin with this one
          const index = filteredPins.indexOf(existingPin);
          filteredPins[index] = pin;
        }
        shouldAdd = false;
        break;
      }
    }
    
    if (shouldAdd) {
      filteredPins.push(pin);
    }
  }

  console.log(`Found ${filteredPins.length} unsafe turning pins for trip`);
  return filteredPins;
};

// Distance calculation helper (same as in combinedEventService)
const getDistanceInFeet = (coord1, coord2) => {
  const R = 6371e3; // metres
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInMeters = R * c;
  return distanceInMeters * 3.28084; // Convert to feet
};
