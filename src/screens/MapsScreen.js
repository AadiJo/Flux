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
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext";
import * as Location from "expo-location";

export const MapsScreen = () => {
  console.log("MapsScreen rendering"); // Debug log
  const { theme, isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [streetName, setStreetName] = useState("Getting location...");
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    let locationSubscription;

    const setupLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setStreetName("Location permission denied");
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        setLocation(initialLocation);

        // Get street name
        const address = await Location.reverseGeocodeAsync({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        });

        if (address[0]) {
          setStreetName(address[0].street || "Street name not available");
        }

        // Watch location changes
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          async (newLocation) => {
            setLocation(newLocation);
            const newAddress = await Location.reverseGeocodeAsync({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
            if (newAddress[0]) {
              setStreetName(
                newAddress[0].street || "Street name not available"
              );
            }
          }
        );
      } catch (error) {
        console.error("Location error:", error);
        setStreetName("Error getting location");
      }
    };

    setupLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const onMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

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
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        />
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
});
