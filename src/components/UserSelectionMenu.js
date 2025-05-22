import React from "react";
import { Modal, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useUser, USER_TYPES } from "../contexts/UserContext";

export const UserSelectionMenu = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { updateUserType } = useUser();

  const userOptions = [
    { id: 1, label: "Parent", value: USER_TYPES.PARENT },
    { id: 2, label: "Child", value: USER_TYPES.CHILD },
    { id: 3, label: "Individual", value: USER_TYPES.INDIVIDUAL },
  ];

  const handleUserSelect = (option) => {
    updateUserType(option.value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.userMenu, { backgroundColor: theme.card }]}>
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
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
