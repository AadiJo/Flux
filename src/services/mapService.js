const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

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
