import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, Text, Dimensions, Animated } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { chartConfig, MAX_SPEED_DATA_POINTS } from "../constants/chartConfig";

const screenWidth = Dimensions.get("window").width;

export const SimulationScreen = () => {
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

    return () => clearInterval(interval);
  }, []);

  const speedChartData = {
    labels: [],
    datasets: [
      {
        data: speedHistory.length > 0 ? speedHistory : [0],
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.dataContainer}>
      <Text style={styles.heading}>Simulated OBD2 Data</Text>
      <Text style={styles.value}>Speed: {Math.round(obd2Data.speed)} mph</Text>
      <Text style={styles.value}>RPM: {Math.round(obd2Data.rpm)}</Text>
      <Text style={styles.value}>
        Throttle: {obd2Data.throttle.toFixed(1)} %
      </Text>

      <Text style={styles.subHeading}>Vehicle Speed Over Time</Text>
      <LineChart
        data={speedChartData}
        width={screenWidth * 0.9}
        height={220}
        chartConfig={chartConfig}
        style={styles.chartStyle}
        yAxisSuffix=" mph"
        yLabelsOffset={5}
        paddingRight={35}
        paddingLeft={0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dataContainer: {
    width: "90%",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 600,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: "#555",
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
    color: "#666",
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
});
