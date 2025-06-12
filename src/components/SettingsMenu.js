import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useSettings } from "../contexts/SettingsContext";
import { SPRING_CONFIG, TIMING_CONFIG } from "../utils/animationConfig";

export const SettingsMenu = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { speedingThreshold, updateSpeedingThreshold } = useSettings();
  const [showingModal, setShowingModal] = useState(visible);
  const [localThreshold, setLocalThreshold] = useState(speedingThreshold);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      setLocalThreshold(speedingThreshold);
      setShowingModal(true);
      overlayOpacity.setValue(0);
      menuScale.setValue(0.95);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          ...TIMING_CONFIG,
        }),
        Animated.spring(menuScale, {
          toValue: 1,
          ...SPRING_CONFIG,
        }),
      ]).start();
    } else if (showingModal) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          ...TIMING_CONFIG,
        }),
        Animated.timing(menuScale, {
          toValue: 0.95,
          ...TIMING_CONFIG,
        }),
      ]).start(() => {
        setShowingModal(false);
      });
    }
  }, [visible, showingModal, overlayOpacity, menuScale, speedingThreshold]);

  const handleIncrement = () => {
    setLocalThreshold((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setLocalThreshold((prev) => Math.max(0, prev - 1)); // Don't allow negative values
  };

  const handleClose = () => {
    updateSpeedingThreshold(localThreshold);
    onClose();
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={[
          styles.modalOverlay,
          {
            backgroundColor: theme.dark
              ? "rgba(0, 0, 0, 0.7)"
              : "rgba(0, 0, 0, 0.25)",
          },
        ]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View
            style={[
              styles.menu,
              {
                backgroundColor: theme.card,
                opacity: overlayOpacity,
                transform: [{ scale: menuScale }],
              },
            ]}
          >
            <View style={styles.settingOption}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Speeding Threshold (mph over)
              </Text>
              <View style={styles.valueContainer}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  style={styles.button}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={24}
                    color={theme.primary}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.valueInput,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  value={String(localThreshold)}
                  onChangeText={(text) => setLocalThreshold(Number(text) || 0)}
                  keyboardType="number-pad"
                  textAlign="center"
                />
                <TouchableOpacity
                  onPress={handleIncrement}
                  style={styles.button}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={24}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 20,
  },
  settingOption: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 15,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: "600",
    width: 60,
    marginHorizontal: 10,
  },
  closeButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
