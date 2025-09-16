import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setDebugLogging, isDebugLoggingEnabled } from "../utils/debugLogger";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [speedingThreshold, setSpeedingThreshold] = useState(5); // Default value
  const [scoreProvider, setScoreProvider] = useState("Flux"); // Default value
  const [debugLogging, setDebugLoggingState] = useState(isDebugLoggingEnabled()); // Default value
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedThreshold = await AsyncStorage.getItem("speedingThreshold");
        if (storedThreshold !== null) {
          setSpeedingThreshold(JSON.parse(storedThreshold));
        }
        
        const storedScoreProvider = await AsyncStorage.getItem("scoreProvider");
        if (storedScoreProvider !== null) {
          setScoreProvider(JSON.parse(storedScoreProvider));
        }

        const storedDebugLogging = await AsyncStorage.getItem("debugLogging");
        if (storedDebugLogging !== null) {
          const debugEnabled = JSON.parse(storedDebugLogging);
          setDebugLoggingState(debugEnabled);
          setDebugLogging(debugEnabled);
        }
      } catch (e) {
        console.error("Failed to load settings.", e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const updateSpeedingThreshold = async (newThreshold) => {
    try {
      setSpeedingThreshold(newThreshold);
      await AsyncStorage.setItem(
        "speedingThreshold",
        JSON.stringify(newThreshold)
      );
    } catch (e) {
      console.error("Failed to save settings.", e);
    }
  };

  const updateScoreProvider = async (newProvider) => {
    try {
      setScoreProvider(newProvider);
      await AsyncStorage.setItem(
        "scoreProvider",
        JSON.stringify(newProvider)
      );
    } catch (e) {
      console.error("Failed to save score provider setting.", e);
    }
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  const updateDebugLogging = async (newDebugLogging) => {
    try {
      setDebugLoggingState(newDebugLogging);
      setDebugLogging(newDebugLogging);
      await AsyncStorage.setItem(
        "debugLogging",
        JSON.stringify(newDebugLogging)
      );
    } catch (e) {
      console.error("Failed to save debug logging setting.", e);
    }
  };

  return (
    <SettingsContext.Provider
      value={{ 
        speedingThreshold, 
        updateSpeedingThreshold,
        scoreProvider,
        updateScoreProvider,
        debugLogging,
        updateDebugLogging
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
