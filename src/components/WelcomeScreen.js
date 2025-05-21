import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  PanResponder,
} from "react-native";

const MAX_PULL = 48;

export default function WelcomeScreen({ visible, onContinue }) {
  // Animated values for overlay and sheet content
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(40)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);

  // PanResponder for bounce effect
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(Math.min(gestureState.dy, MAX_PULL));
        }
      },
      onPanResponderRelease: () => {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 10,
        }).start();
      },
    })
  ).current;

  // Animate overlay and sheet content in/out
  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
      overlayOpacity.setValue(0);
      contentOpacity.setValue(0);
      contentTranslateY.setValue(40);
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }),
      ]).start();
    } else if (showingModal) {
      setDismissing(true);
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 40,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDismissing(false);
        panY.setValue(0);
        setShowingModal(false);
      });
    }
  }, [visible]);

  // Dismiss with animation on Continue
  const handleContinue = () => {
    setDismissing(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 40,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissing(false);
      panY.setValue(0);
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
      <View style={styles.sheet}>
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: Animated.add(contentTranslateY, panY) }],
            width: "100%",
          }}
          {...panResponder.panHandlers}
        >
          <ScrollView
            contentContainerStyle={{ alignItems: "center", paddingBottom: 24 }}
            bounces={true}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <Image
                source={require("../assets/icon.png")}
                style={styles.icon}
              />
            </View>
            <Text style={styles.title}>Welcome to OBDApp</Text>
            <Text style={styles.subtitle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
              varius, sapien nec ullamcorper gravida, turpis nunc blandit arcu,
              eu fermentum risus nulla.
            </Text>
            <View style={styles.peopleContainer}>
              <Image
                source={require("../assets/icon.png")}
                style={styles.peopleIcon}
              />
            </View>
            <Text style={styles.privacy}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              cursus nunc nec pulvinar lacinia. Velit sapien bibendum magna
              vitae rutrum. Felis turpis sed curabitur accumsan nisi in commodo
              luctus. Urna justo fermentum sapien non blandit sem. Urna ut ante
              maecenas auctor eros eget odio commodo.{" "}
              <Text style={{ color: "#007aff" }}>
                Sed dapibus risus hendrerit vitae mollis augue…
              </Text>
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    minHeight: 500,
    width: "100%",
    zIndex: 2,
  },
  iconContainer: {
    backgroundColor: "#007aff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  icon: {
    width: 64,
    height: 64,
    tintColor: "white",
    resizeMode: "contain",
  },
  title: {
    color: "#222",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    color: "#222",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  peopleContainer: {
    marginBottom: 12,
    marginTop: 8,
    alignItems: "center",
  },
  peopleIcon: {
    width: 32,
    height: 32,
    tintColor: "#007aff",
    resizeMode: "contain",
  },
  privacy: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 16,
  },
  button: {
    backgroundColor: "#007aff",
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
