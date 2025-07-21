import { getLogs } from "./loggingService";

// Distance calculation helper (copied from speedingService)
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
 * Gets acceleration pins based on the logs and acceleration threshold
 * @param {number} accelerationThreshold - The acceleration threshold (default 6 mph/s for harsh acceleration)
 * @returns {Promise<Array>} - Array of acceleration event pins
 */
export const getAccelerationPins = async (accelerationThreshold = 6) => {
  console.log("Getting acceleration pins with threshold:", accelerationThreshold);
  const simLogs = await getLogs("sim");
  const realLogs = await getLogs("real");
  const allLogs = [...simLogs, ...realLogs];

  const allAccelerationEvents = allLogs
    .filter((log) => {
      const acceleration = log.acceleration;
      return (
        acceleration &&
        acceleration > accelerationThreshold &&
        log.location
      );
    })
    .map((log) => ({
      latitude: log.location.latitude,
      longitude: log.location.longitude,
      acceleration: log.acceleration,
      speed: log.obd2Data?.speed || 0,
      timestamp: log.timestamp,
    }));

  // Group events that are close together AND have similar acceleration values
  const groups = [];
  for (const event of allAccelerationEvents) {
    let foundGroup = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const distance = getDistanceInFeet(event, lastEventInGroup);
      const accelerationDifference = Math.abs(event.acceleration - lastEventInGroup.acceleration);

      if (distance <= 50 && accelerationDifference <= 2) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // For each group, find the event with the highest acceleration
  const representativePins = groups.map((group) => {
    return group.reduce((max, current) =>
      current.acceleration > max.acceleration ? current : max
    );
  });

  console.log("Returning acceleration pins:", representativePins.length);
  return representativePins;
};

/**
 * Gets acceleration pins for a specific trip
 * @param {number} accelerationThreshold - The current acceleration threshold
 * @param {Object} trip - The trip object containing logs
 * @returns {Promise<Array>} - Array of acceleration event pins for this trip
 */
export const getAccelerationPinsForTrip = async (accelerationThreshold, trip) => {
  console.log("Getting acceleration pins for trip:", trip.roadName);
  console.log("Trip has logs:", trip.logs ? trip.logs.length : 0);

  if (!trip || !trip.logs) {
    console.log("No trip or no logs, returning empty array");
    return [];
  }

  const allAccelerationEvents = trip.logs
    .filter((log) => {
      const acceleration = log.acceleration;
      return (
        acceleration &&
        acceleration > accelerationThreshold &&
        log.location
      );
    })
    .map((log) => ({
      latitude: log.location.latitude,
      longitude: log.location.longitude,
      acceleration: log.acceleration,
      speed: log.obd2Data?.speed || 0,
      timestamp: log.timestamp,
    }));

  console.log("Found acceleration events:", allAccelerationEvents.length);

  // Group events that are close together AND have similar acceleration values
  const groups = [];
  for (const event of allAccelerationEvents) {
    let foundGroup = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const distance = getDistanceInFeet(event, lastEventInGroup);
      const accelerationDifference = Math.abs(event.acceleration - lastEventInGroup.acceleration);

      if (distance <= 50 && accelerationDifference <= 2) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // For each group, find the event with the highest acceleration
  const representativePins = groups.map((group) => {
    return group.reduce((max, current) =>
      current.acceleration > max.acceleration ? current : max
    );
  });
  console.log("Returning acceleration pins for trip:", representativePins.length);
  return representativePins;
};
