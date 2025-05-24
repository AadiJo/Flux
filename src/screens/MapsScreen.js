import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from "react-native";
import MapView, { PROVIDER_DEFAULT, Marker, Callout } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext";
import * as Location from "expo-location";
import { getRoadEndpointsFromOSM } from "../services/mapService";

// const LATITUDE_OFFSET_300_FT = 300 / 364000; // No longer using fixed offset

// Helper function to style bulleted text
const renderBulletedText = (text, highlightColor, theme) => {
  const parts = text.split(" "); // e.g., "•", "Bullet", "1"
  if (parts.length >= 2) {
    // parts[0] is "•"
    // parts[1] is the first actual word, e.g., "Bullet"
    return (
      <Text style={[styles.calloutText, { color: theme.text }]}>
        {parts[0]} <Text style={{ color: highlightColor }}>{parts[1]}</Text>
        {parts.length > 2 ? " " + parts.slice(2).join(" ") : ""}
      </Text>
    );
  }
  // Fallback for unexpected format
  return (
    <Text style={[styles.calloutText, { color: highlightColor }]}>{text}</Text>
  );
};

export const MapsScreen = () => {
  const { theme, isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState("Getting location...");
  const mapRef = useRef(null);
  const isMounted = useRef(true);
  const [roadStartCoords, setRoadStartCoords] = useState(null);
  const [roadEndCoords, setRoadEndCoords] = useState(null);
  const [mapStatusMessage, setMapStatusMessage] = useState("");
  const [region, setRegion] = useState(null);

  // Function to update map region
  const updateMapRegion = useCallback((latitude, longitude) => {
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  // Handle location and road endpoints
  const handleLocationAndRoads = useCallback(async (initialLocation) => {
    try {
      if (!isMounted.current) return;

      setLocation(initialLocation);
      updateMapRegion(
        initialLocation.coords.latitude,
        initialLocation.coords.longitude
      );

      const address = await Location.reverseGeocodeAsync({
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      });

      let currentStreetName = "Street name not available";
      if (address[0]?.street) {
        currentStreetName = address[0].street;
      }
      if (!isMounted.current) return;
      setStreetName(currentStreetName);

      if (
        currentStreetName &&
        currentStreetName !== "Street name not available" &&
        currentStreetName !== "Unnamed Road"
      ) {
        setMapStatusMessage("Finding road ends...");

        const roadEndpoints = await getRoadEndpointsFromOSM(
          initialLocation.coords.latitude,
          initialLocation.coords.longitude,
          currentStreetName
        );

        if (!isMounted.current) return;

        if (roadEndpoints) {
          setRoadStartCoords(roadEndpoints.start);
          setRoadEndCoords(roadEndpoints.end);
          setMapStatusMessage("");
        } else {
          setMapStatusMessage("Could not determine road ends.");
          setRoadStartCoords(null);
          setRoadEndCoords(null);
        }
      } else {
        setMapStatusMessage("Current road not identified for pinning ends.");
        setRoadStartCoords(null);
        setRoadEndCoords(null);
      }
    } catch (error) {
      console.error("Error in handleLocationAndRoads:", error);
      if (isMounted.current) {
        setMapStatusMessage("Error processing location data.");
      }
    }
  }, []);

  // Initial setup
  useEffect(() => {
    let locationSubscription;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted.current) {
            setStreetName("Location permission denied");
            setMapStatusMessage("Location permission required");
          }
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        await handleLocationAndRoads(initialLocation);

        // Watch location changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 100,
            timeInterval: 10000,
          },
          async (newLocation) => {
            if (!isMounted.current) return;
            await handleLocationAndRoads(newLocation);
          }
        );
      } catch (error) {
        console.error("Location setup error:", error);
        if (isMounted.current) {
          setStreetName("Error getting location");
          setMapStatusMessage("Error accessing location services");
        }
      }
    };

    setupLocation();

    return () => {
      isMounted.current = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [handleLocationAndRoads]);

  if (!location || !region) {
    return (
      <SafeAreaView
        style={[styles.mapWrapper, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.streetName, { color: theme.text }]}>
            Getting location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={region}
          showsUserLocation
          showsMyLocationButton
          showsCompass={false}
          mapPadding={{ bottom: -60, top: 0, right: 0, left: 0 }}
          onRegionChangeComplete={(newRegion) => {
            setRegion(newRegion);
          }}
        >
          {roadStartCoords && (
            <Marker
              identifier="start"
              coordinate={roadStartCoords}
              pinColor="red"
              tracksViewChanges={false}
              calloutOffset={{ x: 0, y: 30 }}
            >
              <Callout tooltip style={styles.calloutContainer}>
                <View
                  style={[styles.calloutView, { backgroundColor: theme.card }]}
                >
                  {renderBulletedText("• Start Point 1", "red", theme)}
                  {renderBulletedText("• Start Point 2", "red", theme)}
                  {renderBulletedText("• Start Point 3", "red", theme)}
                </View>
              </Callout>
            </Marker>
          )}
          {roadEndCoords && (
            <Marker
              identifier="end"
              coordinate={roadEndCoords}
              pinColor="green"
              tracksViewChanges={false}
              calloutOffset={{ x: 0, y: 30 }}
            >
              <Callout tooltip style={styles.calloutContainer}>
                <View
                  style={[styles.calloutView, { backgroundColor: theme.card }]}
                >
                  {renderBulletedText("• End Point 1", "green", theme)}
                  {renderBulletedText("• End Point 2", "green", theme)}
                  {renderBulletedText("• End Point 3", "green", theme)}
                </View>
              </Callout>
            </Marker>
          )}
        </MapView>
      </View>

      <View
        style={[
          styles.banner,
          {
            backgroundColor: theme.card,
            marginTop:
              Platform.OS === "ios" ? 60 : StatusBar.currentHeight + 10,
          },
        ]}
      >
        <Text
          style={[styles.streetName, { color: theme.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {streetName}
        </Text>
        {mapStatusMessage ? (
          <Text
            style={[
              styles.statusMessage,
              { color: theme.textMuted || theme.text },
            ]}
          >
            {mapStatusMessage}
          </Text>
        ) : null}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    zIndex: 0,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 2,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    margin: 8,
  },
  streetName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
  },
  calloutContainer: {
    width: 150, // Adjust as needed
  },
  calloutView: {
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: "center",
  },
  statusMessage: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
