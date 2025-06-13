import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { SPRING_CONFIG, TIMING_CONFIG } from "../utils/animationConfig";

export default function WelcomeScreen({ visible, onContinue }) {
  const { theme } = useTheme();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
      overlayOpacity.setValue(0);
      sheetTranslateY.setValue(1000);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          ...TIMING_CONFIG,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          ...SPRING_CONFIG,
        }),
      ]).start();
    } else if (showingModal) {
      setDismissing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          ...TIMING_CONFIG,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 1000,
          ...TIMING_CONFIG,
        }),
      ]).start(() => {
        setDismissing(false);
        setShowingModal(false);
      });
    }
  }, [visible]);

  const handleContinue = () => {
    setDismissing(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        ...TIMING_CONFIG,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 1000,
        ...TIMING_CONFIG,
      }),
    ]).start(() => {
      setDismissing(false);
      setShowingModal(false);
      onContinue();
    });
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={dismissing ? "none" : "auto"}
      />
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.card,
            shadowColor: theme.shadow,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.content}>
          <Image
            source={require("../assets/icon.png")}
            style={{ width: 80, height: 80, borderRadius: 24 }}
            resizeMode="cover"
          />
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome to Flux
          </Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>
            Track your driving habits in real time. Connect your car, monitor
            trips, get safety scores, and discover insights to help you or your
            teen become a smarter, safer, and more confident driver.
          </Text>
          {/* <View style={styles.peopleContainer}>
            <MaterialCommunityIcons
              name="car-connected"
              size={32}
              color={theme.primary}
            />
          </View>
          <Text style={[styles.privacy, { color: theme.textSecondary }]}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
            cursus nunc nec pulvinar lacinia.{" "}
            <Text style={{ color: theme.primary }}>
              Sed dapibus risus hendrerit vitae mollis augue…
            </Text>
          </Text> */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  content: {
    padding: 28,
    alignItems: "center",
  },
  // Removed unused iconContainer style
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  peopleContainer: {
    marginBottom: 12,
    marginTop: -15,
    alignItems: "center",
  },
  privacy: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
    width: "100%",
    maxWidth: 320,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
