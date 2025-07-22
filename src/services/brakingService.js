import { getLogs } from "./loggingService";

// Distance calculation helper (copied from accelerationService)
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
 * Gets braking pins based on the logs and braking threshold
 * @param {number} brakingThreshold - The braking threshold (default -8 mph/s for harsh braking, more tolerance than acceleration)
 * @returns {Promise<Array>} - Array of braking event pins
 */
export const getBrakingPins = async (brakingThreshold = -8) => {
  console.log("Getting braking pins with threshold:", brakingThreshold);
  const simLogs = await getLogs("sim");
  const realLogs = await getLogs("real");
  const allLogs = [...simLogs, ...realLogs];

  const allBrakingEvents = allLogs
    .filter((log) => {
      const acceleration = log.acceleration;
      return (
        acceleration &&
        acceleration < brakingThreshold && // Negative acceleration for braking
        log.location
      );
    })
    .map((log) => ({
      latitude: log.location.latitude,
      longitude: log.location.longitude,
      acceleration: log.acceleration,
      braking: Math.abs(log.acceleration), // Show as positive for display
      speed: log.obd2Data?.speed || 0,
      timestamp: log.timestamp,
    }));

  // Group events that are close together AND have similar braking values
  const groups = [];
  for (const event of allBrakingEvents) {
    let foundGroup = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const distance = getDistanceInFeet(event, lastEventInGroup);
      const brakingDifference = Math.abs(event.braking - lastEventInGroup.braking);

      // Use larger distance tolerance (75ft vs 50ft) and braking difference (3 vs 2) for more tolerance
      if (distance <= 75 && brakingDifference <= 3) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // For each group, find the event with the highest braking intensity (most negative acceleration)
  const representativePins = groups.map((group) => {
    return group.reduce((max, current) =>
      current.braking > max.braking ? current : max
    );
  });

  console.log("Returning braking pins:", representativePins.length);
  return representativePins;
};

/**
 * Gets braking pins for a specific trip
 * @param {number} brakingThreshold - The current braking threshold (negative value)
 * @param {Object} trip - The trip object containing logs
 * @returns {Promise<Array>} - Array of braking event pins for this trip
 */
export const getBrakingPinsForTrip = async (brakingThreshold, trip) => {
  console.log("Getting braking pins for trip:", trip.roadName);
  console.log("Trip has logs:", trip.logs ? trip.logs.length : 0);

  if (!trip || !trip.logs) {
    console.log("No trip or no logs, returning empty array");
    return [];
  }

  const allBrakingEvents = trip.logs
    .filter((log) => {
      const acceleration = log.acceleration;
      return (
        acceleration &&
        acceleration < brakingThreshold && // Negative acceleration for braking
        log.location
      );
    })
    .map((log) => ({
      latitude: log.location.latitude,
      longitude: log.location.longitude,
      acceleration: log.acceleration,
      braking: Math.abs(log.acceleration), // Show as positive for display
      speed: log.obd2Data?.speed || 0,
      timestamp: log.timestamp,
    }));

  console.log("Found braking events:", allBrakingEvents.length);

  // Group events that are close together AND have similar braking values
  const groups = [];
  for (const event of allBrakingEvents) {
    let foundGroup = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const distance = getDistanceInFeet(event, lastEventInGroup);
      const brakingDifference = Math.abs(event.braking - lastEventInGroup.braking);

      // Use larger distance tolerance (75ft vs 50ft) and braking difference (3 vs 2) for more tolerance
      if (distance <= 75 && brakingDifference <= 3) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // For each group, find the event with the highest braking intensity (most negative acceleration)
  const representativePins = groups.map((group) => {
    return group.reduce((max, current) =>
      current.braking > max.braking ? current : max
    );
  });
  
  // console.log("Returning braking pins for trip:", representativePins.length);
  return representativePins;
};
