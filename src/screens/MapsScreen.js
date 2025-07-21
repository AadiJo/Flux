import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  StatusBar,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import MapView, { PROVIDER_DEFAULT, Marker, Callout } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { initializeLogging } from "../services/loggingService";
import { getSpeedingPinsForTrip } from "../services/speedingService";
import { getAccelerationPinsForTrip } from "../services/accelerationService";
import { getBrakingPinsForTrip } from "../services/brakingService";
import { TripSelectionModal } from "../components/TripSelectionModal";

export const MapsScreen = ({
  appLocation,
  appStreetName,
  speedingPins,
  updateSpeedingPinsFromLogs,
  homeSelectedTrip,
  setHomeSelectedTrip,
}) => {
  const { theme, isDark } = useTheme();
  const { speedingThreshold } = useSettings();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [showTripSelection, setShowTripSelection] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripSpeedingPins, setTripSpeedingPins] = useState([]);
  const [tripAccelerationPins, setTripAccelerationPins] = useState([]);
  const [tripBrakingPins, setTripBrakingPins] = useState([]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load trip data when a trip is selected
  const loadTripData = async (trip) => {
    try {
      console.log("Loading trip data for:", trip.roadName);
      // Load speeding pins
      const speedingPins = await getSpeedingPinsForTrip(speedingThreshold, trip);
      setTripSpeedingPins(speedingPins);
      
      // Load acceleration pins (using 6 mph/s as threshold for harsh acceleration)
      const accelerationPins = await getAccelerationPinsForTrip(6, trip);
      setTripAccelerationPins(accelerationPins);
      
      // Load braking pins (using -8 mph/s as threshold for harsh braking, more tolerant)
      const brakingPins = await getBrakingPinsForTrip(-8, trip);
      setTripBrakingPins(brakingPins);
      
      // Set initial map region based on pins or logs
      const allPins = [...speedingPins, ...accelerationPins, ...brakingPins];
      if (allPins && allPins.length > 0) {
        updateMapRegion(allPins[0].latitude, allPins[0].longitude);
      } else if (trip.logs && trip.logs.length > 0) {
        const firstLogWithLocation = trip.logs.find((log) => log.location);
        if (firstLogWithLocation) {
          updateMapRegion(
            firstLogWithLocation.location.latitude,
            firstLogWithLocation.location.longitude
          );
        }
      }
      setSelectedTrip(trip);
      setShowTripSelection(false);
      // Small delay to ensure state updates are applied
      setTimeout(() => {
        slideAnim.setValue(0);
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, 50);
    } catch (error) {
      console.error("Failed to load trip data:", error);
    }
  };

  useEffect(() => {
    if (homeSelectedTrip) {
      loadTripData(homeSelectedTrip);
    } else if (homeSelectedTrip === null && showTripSelection === false) {
      // If explicitly set to null, show trip selection
      setShowTripSelection(true);
      setSelectedTrip(null);
      setTripSpeedingPins([]);
      setTripAccelerationPins([]);
      setTripBrakingPins([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeSelectedTrip]);

  const handleBackToTripSelection = () => {
    setTripSpeedingPins([]);
    setTripAccelerationPins([]);
    setTripBrakingPins([]);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSelectedTrip(null);
      setShowTripSelection(true);
      if (setHomeSelectedTrip) setHomeSelectedTrip(null);
    });
  };

  // Update map region state
  const updateMapRegion = useCallback((latitude, longitude) => {
    if (!latitude || !longitude) return;

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  // Animate map when region changes
  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [region]);

  // Respond to updates in location or street name for current location (when no trip selected)
  useEffect(() => {
    if (!selectedTrip && appLocation?.coords) {
      const { latitude, longitude } = appLocation.coords;
      updateMapRegion(latitude, longitude);
    }
  }, [appLocation, updateMapRegion, selectedTrip]);

  // Show trip selection modal
  if (showTripSelection) {
    return <TripSelectionModal onSelectTrip={loadTripData} />;
  }

  // Show loading if no trip selected and no region set
  if (!selectedTrip && !region) {
    return (
      <SafeAreaView
        style={[styles.mapWrapper, { backgroundColor: theme.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.streetName, { color: theme.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View
      style={[
        { flex: 1 },
        {
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [Dimensions.get("window").width, 0],
              }),
            },
          ],
          opacity: slideAnim,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          region={region}
          showsUserLocation={!selectedTrip}
          showsMyLocationButton={!selectedTrip}
          showsCompass={false}
        >
          {/* Show speeding pins for the selected trip */}
          {tripSpeedingPins?.map((pin, index) => {
            const speedDifference = Math.round(pin.speed - pin.speedLimit);

            return (
              <Marker
                key={`speeding-${index}`}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                pinColor="red"
              >
                <Callout tooltip>
                  <View
                    style={[
                      styles.calloutContainer,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text
                      style={[styles.speedingHeader, { color: theme.text }]}
                    >
                      Speeding Details
                    </Text>
                    <Text style={[styles.speedingInfo, { color: theme.text }]}>
                      Speed: {Math.round(pin.speed)} mph | Limit:{" "}
                      {Math.round(pin.speedLimit)} mph
                    </Text>
                    <Text
                      style={[
                        styles.speedingInfo,
                        { color: theme.text, fontWeight: "bold" },
                      ]}
                    >
                      {speedDifference >= 0
                        ? `Over by: ${speedDifference} mph`
                        : `Under by: ${Math.abs(speedDifference)} mph`}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}

          {/* Show acceleration pins for the selected trip */}
          {tripAccelerationPins?.map((pin, index) => {
            const accelerationOver = pin.acceleration - 6; // 6 mph/s is recommended max

            return (
              <Marker
                key={`acceleration-${index}`}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                pinColor="orange"
              >
                <Callout tooltip>
                  <View
                    style={[
                      styles.calloutContainer,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text
                      style={[styles.speedingHeader, { color: theme.text }]}
                    >
                      Harsh Acceleration
                    </Text>
                    <Text style={[styles.speedingInfo, { color: theme.text }]}>
                      Acceleration: {pin.acceleration.toFixed(1)} mph/s
                    </Text>
                    <Text style={[styles.speedingInfo, { color: theme.text }]}>
                      Speed: {Math.round(pin.speed)} mph
                    </Text>
                    <Text
                      style={[
                        styles.speedingInfo,
                        { color: theme.text, fontWeight: "bold" },
                      ]}
                    >
                      {accelerationOver > 0
                        ? `${accelerationOver.toFixed(1)} mph/s over recommended`
                        : "Within safe range"}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}

          {/* Show braking pins for the selected trip */}
          {tripBrakingPins?.map((pin, index) => {
            const brakingOver = pin.braking - 8; // 8 mph/s is recommended max braking (more tolerant)

            return (
              <Marker
                key={`braking-${index}`}
                coordinate={{
                  latitude: pin.latitude,
                  longitude: pin.longitude,
                }}
                pinColor="yellow"
              >
                <Callout tooltip>
                  <View
                    style={[
                      styles.calloutContainer,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <Text
                      style={[styles.speedingHeader, { color: theme.text }]}
                    >
                      Harsh Braking
                    </Text>
                    <Text style={[styles.speedingInfo, { color: theme.text }]}>
                      Braking: {pin.braking.toFixed(1)} mph/s
                    </Text>
                    <Text style={[styles.speedingInfo, { color: theme.text }]}>
                      Speed: {Math.round(pin.speed)} mph
                    </Text>
                    <Text
                      style={[
                        styles.speedingInfo,
                        { color: theme.text, fontWeight: "bold" },
                      ]}
                    >
                      {brakingOver > 0
                        ? `${brakingOver.toFixed(1)} mph/s over recommended`
                        : "Within safe range"}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Header with trip info and back button */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: theme.card,
              marginTop:
                (Platform.OS === "ios" ? 60 : StatusBar.currentHeight + 10) +
                60,
            },
          ]}
        >
          <View style={styles.bannerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToTripSelection}
            >
              <Text
                style={[
                  styles.backButtonText,
                  { color: theme.primary || "#007AFF" },
                ]}
              >
                ←
              </Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text
                style={[styles.streetName, { color: theme.text }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedTrip?.roadName || "Trip Route"}
              </Text>
            </View>
            <View style={styles.spacer} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    position: "absolute",
    top: -60,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  map: {
    width: "100%",
    height: "100%",
    marginTop: 60,
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
    shadowOffset: { width: 0, height: 2 },
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
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  spacer: {
    width: 40,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
  },
  calloutContainer: {
    borderRadius: 12,
    padding: 12,
  },
  speedingHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  speedingInfo: {
    fontSize: 14,
  },
});
