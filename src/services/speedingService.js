import { getLogs } from "./loggingService";

// Helper function to calculate distance between two points in feet
const getDistanceInFeet = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;
  const R = 6371e3; // Earth's radius in meters
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
 * Updates the speeding pins based on the logs and current speeding threshold
 * @param {number} speedingThreshold - The current speeding threshold from settings
 * @returns {Promise<Array>} - Array of speeding event pins
 */
export const getSpeedingPins = async (speedingThreshold) => {
  console.log("Getting speeding pins with threshold:", speedingThreshold);
  const simLogs = await getLogs("sim");
  const realLogs = await getLogs("real");
  const allLogs = [...simLogs, ...realLogs];

  const allSpeedingEvents = allLogs
    .filter((log) => {
      const speed = log.obd2Data?.speed;
      const limit = log.speedLimit;
      return (
        speed &&
        limit &&
        log.location &&
        Math.abs(speed - limit) > speedingThreshold
      );
    })
    .map((log) => ({
      latitude: log.location.latitude,
      longitude: log.location.longitude,
      speed: log.obd2Data.speed,
      speedLimit: log.speedLimit,
      timestamp: log.timestamp,
    }));

  // Group events that are close together AND have similar speeds
  const groups = [];
  for (const event of allSpeedingEvents) {
    let foundGroup = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const distance = getDistanceInFeet(event, lastEventInGroup);
      const speedDifference = Math.abs(event.speed - lastEventInGroup.speed);

      if (distance <= 50 && speedDifference <= 10) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push([event]);
    }
  }

  // For each group, find the event with the highest speed
  const representativePins = groups.map((group) => {
    return group.reduce((max, current) =>
      current.speed > max.speed ? current : max
    );
  });

  console.log("Returning speeding pins:", representativePins.length);
  return representativePins;
};
