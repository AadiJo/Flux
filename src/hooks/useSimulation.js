import { useState, useEffect, useRef } from "react";
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { MAX_SPEED_DATA_POINTS } from "../constants/chartConfig";
import { TIMING_CONFIG } from "../utils/animationConfig";

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
  const chartAnimationValue = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      setSpeedHistory([]);
      chartAnimationValue.value = 0;

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

      chartAnimationValue.value = withTiming(1, TIMING_CONFIG);

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
