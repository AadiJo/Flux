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

export const MapsScreen = ({ appLocation, appStreetName, speedingPins }) => {
  const { theme, isDark } = useTheme();
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);

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

  // Respond to updates in location or street name
  useEffect(() => {
    if (!appLocation?.coords) {
      return;
    }

    const { latitude, longitude } = appLocation.coords;
    updateMapRegion(latitude, longitude);
  }, [appLocation, updateMapRegion]);

  if (!appLocation?.coords) {
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
        translucent
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
        >
          {speedingPins?.map((pin, index) => {
            const speedDifference = Math.round(pin.speed - pin.speedLimit);

            return (
              <Marker
                key={index}
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
        </MapView>

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
          <Text
            style={[styles.streetName, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {appStreetName || "Street unavailable"}
          </Text>
        </View>
      </View>
    </>
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
  streetName: { fontSize: 16, fontWeight: "600", textAlign: "center" },
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
