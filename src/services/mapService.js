const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

const getMphFromKph = (kph) => kph * 0.621371;

const getDefaultSpeedLimit = (highwayTag) => {
  switch (highwayTag) {
    case "motorway":
      return getMphFromKph(110); // ~68 mph
    case "trunk":
      return getMphFromKph(90); // ~56 mph
    case "primary":
      return getMphFromKph(80); // ~50 mph
    case "secondary":
      return getMphFromKph(70); // ~43 mph
    case "tertiary":
      return getMphFromKph(50); // ~31 mph
    case "residential":
    case "living_street":
      return getMphFromKph(30); // ~19 mph
    case "unclassified":
      return getMphFromKph(40); // ~25 mph
    default:
      return null;
  }
};

/**
 * Fetches the speed limit for a given location using the Overpass API.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<number|null>} The speed limit in MPH, or null if not found.
 */
export const getSpeedLimit = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    console.log("getSpeedLimit: Invalid coordinates provided");
    return null;
  }

  const query = `
    [out:json];
    way(around:100,${latitude},${longitude})[highway];
    out tags;
  `;

  const url = `${OVERPASS_API_URL}?data=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    console.log(`Fetching speed limit for coordinates: ${latitude}, ${longitude}`);
    
    const response = await fetch(url, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      console.log(`Found ${data.elements.length} road elements`);
      
      // First, check for an explicit maxspeed tag
      for (const element of data.elements) {
        if (element.tags && element.tags.maxspeed) {
          const maxspeed = element.tags.maxspeed;
          console.log(`Found explicit speed limit: ${maxspeed}`);
          
          if (maxspeed.toLowerCase().includes("mph")) {
            const speed = parseInt(maxspeed, 10);
            console.log(`Returning speed limit: ${speed} mph`);
            return speed;
          }
          const speedKph = parseInt(maxspeed, 10);
          if (!isNaN(speedKph)) {
            const speedMph = getMphFromKph(speedKph);
            console.log(`Converted ${speedKph} kph to ${speedMph} mph`);
            return speedMph;
          }
        }
      }

      // If no explicit maxspeed, fallback to highway type
      for (const element of data.elements) {
        if (element.tags && element.tags.highway) {
          const fallbackSpeed = getDefaultSpeedLimit(element.tags.highway);
          if (fallbackSpeed) {
            console.log(`Using fallback speed for highway type ${element.tags.highway}: ${fallbackSpeed} mph`);
            return fallbackSpeed;
          }
        }
      }
    } else {
      console.log("No road elements found for location");
    }
    
    console.log("No speed limit found for location");
    return null; // No road with a speed limit or fallback found
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("Speed limit fetch timed out");
    } else {
      console.error("Error fetching speed limit from Overpass:", error);
    }
    return null;
  }
};

/**
 * Fetches the start and end coordinates of a road segment from OpenStreetMap
 * based on the user's current location and the road's name.
 *
 * @param {number} latitude User's current latitude
 * @param {number} longitude User's current longitude
 * @param {string} streetName The name of the street the user is on
 * @returns {Promise<{start: {latitude: number, longitude: number}, end: {latitude: number, longitude: number}} | null>}
 */
export const getRoadEndpointsFromOSM = async (
  latitude,
  longitude,
  streetName
) => {
  if (
    !streetName ||
    streetName === "Street name not available" ||
    streetName === "Unnamed Road"
  ) {
    console.log("Street name is not suitable for OSM query:", streetName);
    return null;
  }

  // Escape special characters in street name for the query
  const escapedStreetName = streetName
    .replace(/[()\[\]?.^${}|]/g, "\\$&")
    .replace(/"/g, '\\"');

  // Overpass QL query:
  // - [out:json][timeout:25]: Output format and timeout.
  // - ( ... );: Union of statements.
  // - way["name"="${escapedStreetName}"](around:100,${latitude},${longitude});: Find ways (roads)
  //   with the given name within 100 meters of the user's location.
  // - ._;: Keep the found ways.
  // - >; : Recurse down to get all nodes of these ways.
  // - out geom;: Output the geometry (including coordinates of nodes).
  const query = `
    [out:json][timeout:10];
    (
      way["name"~"${escapedStreetName}",i](around:150,${latitude},${longitude});
    );
    out body;
    >;
    out skel geom;
  `;
  // The `i` in `~"${escapedStreetName}",i` makes the regex case-insensitive.
  // `around:150` increases search radius slightly.
  // `out skel geom;` is often better for getting coordinates of nodes in ways.

  console.log("Overpass Query:", query);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      body: query,
    });

    if (!response.ok) {
      console.error(
        "Overpass API request failed:",
        response.status,
        await response.text()
      );
      return null;
    }

    const data = await response.json();
    console.log("Overpass API Response:", JSON.stringify(data, null, 2));

    if (data.elements && data.elements.length > 0) {
      const ways = data.elements.filter(
        (el) => el.type === "way" && el.nodes && el.nodes.length >= 2
      );

      if (ways.length === 0) {
        console.log("No ways found in Overpass response for:", streetName);
        return null;
      }

      // For simplicity, let's pick the first way found.
      // More complex logic could be added here to select the most relevant way
      // if multiple are returned (e.g., the longest, or closest to user).
      const targetWay = ways[0];

      const nodeIds = targetWay.nodes;
      const nodes = data.elements.filter(
        (el) => el.type === "node" && nodeIds.includes(el.id)
      );

      // Ensure nodes are sorted in the order they appear in the way
      const sortedNodes = nodeIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter(Boolean);

      if (sortedNodes.length >= 2) {
        const firstNode = sortedNodes[0];
        const lastNode = sortedNodes[sortedNodes.length - 1];

        const roadEndpoints = {
          start: { latitude: firstNode.lat, longitude: firstNode.lon },
          end: { latitude: lastNode.lat, longitude: lastNode.lon },
        };
        console.log("Road endpoints found:", roadEndpoints);
        return roadEndpoints;
      } else {
        console.log(
          "Could not find enough nodes for the way:",
          streetName,
          sortedNodes
        );
      }
    } else {
      console.log("No elements found in Overpass response for:", streetName);
    }
  } catch (error) {
    console.error("Error fetching or parsing Overpass data:", error);
  }

  return null;
};
