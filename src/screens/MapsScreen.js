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
  console.log("MapsScreen rendering"); // Debug log
  const { theme, isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState("Getting location...");
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);
  const isMounted = useRef(true); // Use useRef for isMounted
  const [roadStartCoords, setRoadStartCoords] = useState(null); // For the first pin
  const [roadEndCoords, setRoadEndCoords] = useState(null); // For the second pin
  const [mapStatusMessage, setMapStatusMessage] = useState(""); // To inform user

  useEffect(() => {
    let locationSubscription;
    // let isMounted = true; // Removed, using useRef now

    const setupLocationAndRoads = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (isMounted.current) setStreetName("Location permission denied");
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        if (!isMounted.current) return;
        setLocation(initialLocation);

        const address = await Location.reverseGeocodeAsync({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        });

        let currentStreetName = "Street name not available";
        if (address[0] && address[0].street) {
          currentStreetName = address[0].street;
        }
        if (isMounted.current) setStreetName(currentStreetName);

        // Fetch road endpoints if we have a valid street name
        if (
          currentStreetName &&
          currentStreetName !== "Street name not available" &&
          currentStreetName !== "Unnamed Road"
        ) {
          if (isMounted.current) setMapStatusMessage("Finding road ends...");
          const roadEndpoints = await getRoadEndpointsFromOSM(
            initialLocation.coords.latitude,
            initialLocation.coords.longitude,
            currentStreetName
          );
          if (isMounted.current) {
            if (roadEndpoints) {
              setRoadStartCoords(roadEndpoints.start);
              setRoadEndCoords(roadEndpoints.end);
              setMapStatusMessage(""); // Clear status
            } else {
              setMapStatusMessage("Could not determine road ends.");
              // Fallback or keep pins null
              setRoadStartCoords(null);
              setRoadEndCoords(null);
            }
          }
        } else {
          if (isMounted.current)
            setMapStatusMessage(
              "Current road not identified for pinning ends."
            );
          setRoadStartCoords(null);
          setRoadEndCoords(null);
        }

        // Watch location changes (simplified for now, road end updates on move would be complex)
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 100, // Update less frequently for now
            timeInterval: 10000,
          },
          async (newLocation) => {
            if (!isMounted.current) return;
            setLocation(newLocation);
            // For simplicity, we are not re-fetching road ends on every move yet.
            // This would require careful management to avoid excessive API calls.
            // We could update the street name display if desired.
            const newAddress = await Location.reverseGeocodeAsync({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            if (isMounted.current && newAddress[0]) {
              setStreetName(
                newAddress[0].street || "Street name not available"
              );
            }
          }
        );
      } catch (error) {
        console.error("Location or Road Fetch error:", error);
        if (isMounted.current) setStreetName("Error getting location");
        if (isMounted.current)
          setMapStatusMessage("Error processing location data.");
      }
    };

    setupLocationAndRoads();

    return () => {
      isMounted.current = false; // Set current to false on unmount
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []); // Dependencies for useEffect: theme, isDark (if used in effect, but they are not)

  const onMapReady = useCallback(() => {
    if (isMounted.current) setIsMapReady(true);
  }, []); // isMounted.current will be correctly accessed, no need to add isMounted ref itself to deps

  if (!location) {
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
          showsUserLocation
          showsMyLocationButton
          showsCompass={false}
          onMapReady={onMapReady}
          mapPadding={{ bottom: -60, top: 0, right: 0, left: 0 }}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01, // Wider initial view
            longitudeDelta: 0.01, // Wider initial view
          }}
        >
          {roadStartCoords && (
            <Marker
              coordinate={roadStartCoords}
              pinColor="red"
              title="Road Start"
              tracksViewChanges={!isMapReady}
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
              coordinate={roadEndCoords}
              pinColor="green"
              title="Road End"
              tracksViewChanges={!isMapReady}
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
