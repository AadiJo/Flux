import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { MAX_SPEED_DATA_POINTS } from "../constants/chartConfig";

export const useSimulation = (isActive = true) => {
  const [obd2Data, setObd2Data] = useState({
    speed: 0,
    rpm: 0,
    throttle: 0,
    engineLoad: 0,
    coolantTemp: 0,
    fuelLevel: 0,
  });
  const [speedHistory, setSpeedHistory] = useState([]);
  const simulationInterval = useRef(null);
  const chartAnimationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      setSpeedHistory([]);
      Animated.timing(chartAnimationValue, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();

      const interval = setInterval(() => {
        const newSpeed = Math.random() * 120;
        setObd2Data({
          speed: newSpeed,
          rpm: Math.random() * 8000,
          throttle: Math.random() * 100,
          engineLoad: Math.random() * 100,
          coolantTemp: Math.random() * 100,
          fuelLevel: Math.random() * 100,
        });

        setSpeedHistory((prevHistory) => {
          const updatedHistory = [...prevHistory, newSpeed];
          return updatedHistory.length > MAX_SPEED_DATA_POINTS
            ? updatedHistory.slice(-MAX_SPEED_DATA_POINTS)
            : updatedHistory;
        });
      }, 250);

      Animated.timing(chartAnimationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      simulationInterval.current = interval;

      return () => {
        if (simulationInterval.current) {
          clearInterval(simulationInterval.current);
        }
      };
    }
  }, [isActive]);

  return {
    obd2Data,
    speedHistory,
    chartAnimationValue,
  };
};
