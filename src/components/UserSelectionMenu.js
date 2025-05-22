import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUser, USER_TYPES } from "../contexts/UserContext";
import { SPRING_CONFIG, TIMING_CONFIG } from "../utils/animationConfig";

export const UserSelectionMenu = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { updateUserType } = useUser();
  const [showingModal, setShowingModal] = useState(visible);
  const [dismissing, setDismissing] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      setShowingModal(true);
      setDismissing(false);
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
      setDismissing(true);
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
        setDismissing(false);
        setShowingModal(false);
      });
    }
  }, [visible]);

  const userOptions = [
    { id: 1, label: "Parent", value: USER_TYPES.PARENT },
    { id: 2, label: "Child", value: USER_TYPES.CHILD },
    { id: 3, label: "Individual", value: USER_TYPES.INDIVIDUAL },
  ];

  const handleUserSelect = (option) => {
    updateUserType(option.value);
    onClose();
  };

  if (!showingModal) return null;

  return (
    <Modal
      visible={showingModal}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
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
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.userMenu,
            {
              backgroundColor: theme.card,
              opacity: overlayOpacity,
              transform: [{ scale: menuScale }],
            },
          ]}
        >
          {userOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.userOption, { borderBottomColor: theme.border }]}
              onPress={() => handleUserSelect(option)}
            >
              <Text style={[styles.userOptionText, { color: theme.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
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
  userMenu: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  userOptionText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
