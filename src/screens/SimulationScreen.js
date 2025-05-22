import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MAX_SPEED_DATA_POINTS } from "../constants/chartConfig";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

const screenWidth = Dimensions.get("window").width;

export const SimulationScreen = ({ onResetSplash }) => {
  const { theme, isDark } = useTheme();
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
        color: (opacity = 1) =>
          isDark
            ? `rgba(255, 255, 255, ${opacity})`
            : `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartBaseConfig = {
    backgroundColor: theme.card,
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    fillShadowGradient: isDark ? "#FFFFFF" : "#000000",
    fillShadowGradientOpacity: isDark ? 0.3 : 0.1,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    },
    propsForVerticalLabels: {
      fill: isDark ? "#FFFFFF" : "#00000",
    },
    propsForHorizontalLabels: {
      fill: isDark ? "#FFFFFF" : "#00000",
    },
    propsForLabels: {
      fill: isDark ? "#FFFFFF" : "#00000",
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.headerButton} onPress={onResetSplash}>
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.dataContainer,
          {
            backgroundColor: theme.card,
            shadowColor: theme.shadow,
            borderColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.heading, { color: theme.text }]}>
          Simulated OBD2 Data
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          Speed: {Math.round(obd2Data.speed)} mph
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          RPM: {Math.round(obd2Data.rpm)}
        </Text>
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          Throttle: {obd2Data.throttle.toFixed(1)} %
        </Text>

        <Text style={[styles.subHeading, { color: theme.text }]}>
          Vehicle Speed Over Time
        </Text>
        <LineChart
          key={isDark ? "dark" : "light"}
          data={speedChartData}
          width={screenWidth * 0.9}
          height={220}
          chartConfig={chartBaseConfig}
          style={styles.chartStyle}
          yAxisSuffix=" mph"
          yLabelsOffset={5}
          paddingRight={35}
          paddingLeft={0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  dataContainer: {
    width: "90%",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: 600,
    borderWidth: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: "center",
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
});
