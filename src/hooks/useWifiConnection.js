import { useState } from "react";
import { Platform, Linking, Alert } from "react-native";
import WifiManager from "react-native-wifi-reborn";

export const useWifiConnection = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [isWifiModalVisible, setIsWifiModalVisible] = useState(false);

  const handleWifiSelect = (network) => {
    setSelectedNetwork(network);
    setIsWifiModalVisible(false);
    Alert.alert(
      "Connecting to WiFi",
      `Attempting to connect to ${network.ssid}...`,
      [{ text: "OK" }]
    );
  };

  const openWifiSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:root=WIFI");
    } else {
      Linking.openSettings();
    }
  };

  return {
    selectedNetwork,
    isWifiModalVisible,
    setIsWifiModalVisible,
    handleWifiSelect,
    openWifiSettings,
  };
};
