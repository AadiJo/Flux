import { getSpeedingPinsForTrip } from "./speedingService";
import { getAccelerationPinsForTrip } from "./accelerationService";
import { getBrakingPinsForTrip } from "./brakingService";
import { getUnsafeTurningPinsForTrip } from "./unsafeTurningService";

// Distance calculation helper
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

/**
 * Gets combined event pins for a specific trip, merging nearby events into single pins
 * @param {Object} trip - The trip object containing logs
 * @param {number} speedingThreshold - The speeding threshold
 * @param {number} accelerationThreshold - The acceleration threshold (default 6 mph/s)
 * @param {number} brakingThreshold - The braking threshold (default -8 mph/s)
 * @param {number} gForceThreshold - The g-force threshold for unsafe turning (default 0.85)
 * @returns {Promise<Array>} - Array of combined event pins
 */
export const getCombinedEventPinsForTrip = async (
  trip,
  speedingThreshold = 5,
  accelerationThreshold = 6,
  brakingThreshold = -8,
  gForceThreshold = 0.85
) => {
  console.log("Getting combined event pins for trip:", trip.roadName);

  if (!trip || !trip.logs) {
    console.log("No trip or no logs, returning empty array");
    return [];
  }

  // Get individual event pins
  const [speedingPins, accelerationPins, brakingPins, unsafeTurningPins] = await Promise.all([
    getSpeedingPinsForTrip(speedingThreshold, trip),
    getAccelerationPinsForTrip(accelerationThreshold, trip),
    getBrakingPinsForTrip(brakingThreshold, trip),
    getUnsafeTurningPinsForTrip(gForceThreshold, trip),
  ]);

  console.log("Individual pins:", {
    speeding: speedingPins.length,
    acceleration: accelerationPins.length,
    braking: brakingPins.length,
    unsafeTurning: unsafeTurningPins.length,
  });

  // Create combined events array with type information
  const allEvents = [
    ...speedingPins.map(pin => ({ ...pin, type: 'speeding', color: 'red' })),
    ...accelerationPins.map(pin => ({ ...pin, type: 'acceleration', color: 'orange' })),
    ...brakingPins.map(pin => ({ ...pin, type: 'braking', color: 'yellow' })),
    ...unsafeTurningPins.map(pin => ({ ...pin, type: 'unsafeTurning', color: 'blue' })),
  ];

  // Group events by proximity (within 100 feet)
  // BUT prevent acceleration and braking events from being merged together
  const groups = [];
  const mergeDistance = 100; // feet

  for (const event of allEvents) {
    let foundGroup = false;
    
    for (const group of groups) {
      // Check if this event is close to any event in the group
      const isCloseToGroup = group.events.some(existingEvent => {
        const distance = getDistanceInFeet(event, existingEvent);
        return distance <= mergeDistance;
      });

      if (isCloseToGroup) {
        const groupHasAcceleration = group.events.some(e => e.type === 'acceleration');
        const groupHasBraking = group.events.some(e => e.type === 'braking');
        const eventIsAcceleration = event.type === 'acceleration';
        const eventIsBraking = event.type === 'braking';
        
        // Prevent merging if:
        // - Group has acceleration and current event is braking, OR
        // - Group has braking and current event is acceleration
        const wouldCreateIncompatibleMerge = 
          (groupHasAcceleration && eventIsBraking) || 
          (groupHasBraking && eventIsAcceleration);
        
        if (!wouldCreateIncompatibleMerge) {
          group.events.push(event);
          foundGroup = true;
          break;
        }
      }
    }

    if (!foundGroup) {
      groups.push({
        events: [event],
      });
    }
  }

  // Create representative pins for each group
  const combinedPins = groups.map(group => {
    const events = group.events;
    
    // Calculate average position
    const avgLatitude = events.reduce((sum, event) => sum + event.latitude, 0) / events.length;
    const avgLongitude = events.reduce((sum, event) => sum + event.longitude, 0) / events.length;
    
    // Determine pin color based on event priority: speeding > unsafe turning > braking > acceleration
    let pinColor = 'orange'; // default to acceleration
    let primaryEvent = events.find(e => e.type === 'acceleration') || events[0];
    
    if (events.some(e => e.type === 'speeding')) {
      pinColor = 'red';
      primaryEvent = events.find(e => e.type === 'speeding');
    } else if (events.some(e => e.type === 'unsafeTurning')) {
      pinColor = 'blue';
      primaryEvent = events.find(e => e.type === 'unsafeTurning');
    } else if (events.some(e => e.type === 'braking')) {
      pinColor = 'yellow';
      primaryEvent = events.find(e => e.type === 'braking');
    }

    // Group events by type for display
    const eventsByType = {
      speeding: events.filter(e => e.type === 'speeding'),
      acceleration: events.filter(e => e.type === 'acceleration'),
      braking: events.filter(e => e.type === 'braking'),
      unsafeTurning: events.filter(e => e.type === 'unsafeTurning'),
    };

    return {
      latitude: avgLatitude,
      longitude: avgLongitude,
      pinColor,
      primaryEvent,
      eventsByType,
      eventCount: events.length,
      hasMultipleTypes: new Set(events.map(e => e.type)).size > 1,
      // Include primary event data for backwards compatibility
      speed: primaryEvent.speed,
      timestamp: primaryEvent.timestamp,
      // Add specific data based on primary event type
      ...(primaryEvent.type === 'speeding' && {
        speedLimit: primaryEvent.speedLimit,
        speedExcess: primaryEvent.speed - primaryEvent.speedLimit,
      }),
      ...(primaryEvent.type === 'acceleration' && {
        acceleration: primaryEvent.acceleration,
      }),
      ...(primaryEvent.type === 'braking' && {
        braking: primaryEvent.braking,
      }),
      ...(primaryEvent.type === 'unsafeTurning' && {
        gForce: primaryEvent.gForce,
        severity: primaryEvent.severity,
        exceedsThreshold: primaryEvent.exceedsThreshold,
      }),
    };
  });

  // console.log(`Returning ${combinedPins.length} combined pins (${combinedPins.filter(p => p.hasMultipleTypes).length} with multiple event types)`);
  return combinedPins;
};
