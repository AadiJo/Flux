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
import { getCombinedEventPinsForTrip } from "../services/combinedEventService";
import { getUnsafeTurningPinsForTrip } from "../services/unsafeTurningService";
import { TripSelectionModal } from "../components/TripSelectionModal";

export const MapsScreen = ({
  appLocation,
  appStreetName,
  speedingPins,
  updateSpeedingPinsFromLogs,
  homeSelectedTrip,
  setHomeSelectedTrip,
  openTripSelectorKey, // new: signal from navbar to open selector
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
  const [combinedEventPins, setCombinedEventPins] = useState([]);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Track first-run to avoid reacting to initial prop value when mounting
  const navPressFirstRender = useRef(true);

  // Load trip data when a trip is selected
  const loadTripData = async (trip, { animate = true } = {}) => {
    try {
      console.log("Loading trip data for:", trip.roadName);
      
      // Load combined event pins that merge nearby events (including unsafe turning)
      const combinedPins = await getCombinedEventPinsForTrip(trip, speedingThreshold, 6, -8, 0.85);
      setCombinedEventPins(combinedPins);
      
      // Set initial map region based on pins or logs
      if (combinedPins && combinedPins.length > 0) {
        updateMapRegion(combinedPins[0].latitude, combinedPins[0].longitude);
      } else if (trip.logs && trip.logs.length > 0) {
        const firstLogWithLocation = trip.logs.find((log) => log.location);
        if (firstLogWithLocation) {
          updateMapRegion(
            firstLogWithLocation.location.latitude,
            firstLogWithLocation.location.longitude
          );
        }
      }

      // Persist the selected trip to parent so it survives tab switches
      if (setHomeSelectedTrip) setHomeSelectedTrip(trip);

      setSelectedTrip(trip);
      setShowTripSelection(false);

      if (animate) {
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
      } else {
        // Instantly show without animation when restoring
        slideAnim.setValue(1);
      }
    } catch (error) {
      console.error("Failed to load trip data:", error);
    }
  };

  useEffect(() => {
    if (homeSelectedTrip) {
      // Restore trip without enter animation
      loadTripData(homeSelectedTrip, { animate: false });
    } else if (homeSelectedTrip === null && showTripSelection === false) {
      // If explicitly set to null, show trip selection
      setShowTripSelection(true);
      setSelectedTrip(null);
      setTripSpeedingPins([]);
      setTripAccelerationPins([]);
      setTripBrakingPins([]);
      setCombinedEventPins([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeSelectedTrip]);

  // React when Maps tab is tapped again while already on Maps
  useEffect(() => {
    if (navPressFirstRender.current) {
      navPressFirstRender.current = false;
      return;
    }
    if (!openTripSelectorKey) return;
    // Open selector without clearing parent's selected trip
    if (showTripSelection === false) {
      setTripSpeedingPins([]);
      setTripAccelerationPins([]);
      setTripBrakingPins([]);
      setCombinedEventPins([]);
      setSelectedTrip(null);
      setShowTripSelection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTripSelectorKey]);

  const handleBackToTripSelection = () => {
    setTripSpeedingPins([]);
    setTripAccelerationPins([]);
    setTripBrakingPins([]);
    setCombinedEventPins([]);
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

  // Helper function to render callout content for combined events
  const renderCombinedCallout = (pin) => {
    const { eventsByType, hasMultipleTypes } = pin;
    
    return (
      <View style={[styles.calloutContainer, { backgroundColor: theme.card }]}>
        {hasMultipleTypes ? (
          <>
            <Text style={[styles.speedingHeader, { color: theme.text }]}>
              Multiple Events
            </Text>
            <Text style={[styles.eventCount, { color: theme.textSecondary, marginBottom: 8 }]}>
              {pin.eventCount} event{pin.eventCount > 1 ? 's' : ''} at this location
            </Text>
          </>
        ) : (
          <Text style={[styles.speedingHeader, { color: theme.text }]}>
            {pin.primaryEvent.type === 'speeding' ? 'Speeding Details' :
             pin.primaryEvent.type === 'acceleration' ? 'Harsh Acceleration' :
             pin.primaryEvent.type === 'unsafeTurning' ? 'Unsafe Turning' :
             'Harsh Braking'}
          </Text>
        )}
        
        {/* Speeding Events */}
        {eventsByType.speeding.length > 0 && eventsByType.speeding.map((event, idx) => (
          <View key={`speeding-${idx}`} style={styles.eventSection}>
            {hasMultipleTypes && <Text style={[styles.eventType, { color: '#ff4444' }]}>🔴 Speeding</Text>}
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Speed: {Math.round(event.speed)} mph | Limit: {Math.round(event.speedLimit)} mph
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text, fontWeight: "bold" }]}>
              Over by: {Math.round(event.speed - event.speedLimit)} mph
            </Text>
          </View>
        ))}
        
        {/* Acceleration Events */}
        {eventsByType.acceleration.length > 0 && eventsByType.acceleration.map((event, idx) => (
          <View key={`acceleration-${idx}`} style={styles.eventSection}>
            {hasMultipleTypes && <Text style={[styles.eventType, { color: '#ff8800' }]}>🟠 Acceleration</Text>}
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Acceleration: {event.acceleration.toFixed(1)} mph/s
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Speed: {Math.round(event.speed)} mph
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text, fontWeight: "bold" }]}>
              {event.acceleration > 6 ? `${(event.acceleration - 6).toFixed(1)} mph/s over recommended` : 'Within safe range'}
            </Text>
          </View>
        ))}
        
        {/* Braking Events */}
        {eventsByType.braking.length > 0 && eventsByType.braking.map((event, idx) => (
          <View key={`braking-${idx}`} style={styles.eventSection}>
            {hasMultipleTypes && <Text style={[styles.eventType, { color: '#ffaa00' }]}>🟡 Braking</Text>}
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Braking: {event.braking.toFixed(1)} mph/s
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Speed: {Math.round(event.speed)} mph
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text, fontWeight: "bold" }]}>
              {event.braking > 8 ? `${(event.braking - 8).toFixed(1)} mph/s over recommended` : 'Within safe range'}
            </Text>
          </View>
        ))}
        
        {/* Unsafe Turning Events */}
        {eventsByType.unsafeTurning.length > 0 && eventsByType.unsafeTurning.map((event, idx) => (
          <View key={`unsafeTurning-${idx}`} style={styles.eventSection}>
            {hasMultipleTypes && <Text style={[styles.eventType, { color: '#0066ff' }]}>🔵 Unsafe Turning</Text>}
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Max G-Force: {event.gForce.toFixed(2)}g
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Severity: {event.severity}
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text }]}>
              Speed: {Math.round(event.speed)} mph
            </Text>
            <Text style={[styles.speedingInfo, { color: theme.text, fontWeight: "bold" }]}>
              {event.exceedsThreshold.toFixed(2)}g over {event.threshold || 0.85}g threshold
            </Text>
            {event.gForceValues && (
              <Text style={[styles.speedingInfo, { color: theme.textSecondary, fontSize: 12 }]}>
                G-Forces: X:{event.gForceValues.x.toFixed(2)} Y:{event.gForceValues.y.toFixed(2)} Z:{event.gForceValues.z.toFixed(2)}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Show trip selection modal
  if (showTripSelection) {
    return <TripSelectionModal onSelectTrip={(trip) => loadTripData(trip, { animate: true })} />;
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
          {/* Show combined event pins for the selected trip */}
          {combinedEventPins?.map((pin, index) => (
            <Marker
              key={`combined-${index}`}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              pinColor={pin.pinColor}
            >
              <Callout tooltip>
                {renderCombinedCallout(pin)}
              </Callout>
            </Marker>
          ))}
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
    minWidth: 200,
  },
  speedingHeader: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  speedingInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  eventCount: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  eventSection: {
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  eventType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
  },
});
