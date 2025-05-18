import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, Button, Dimensions, Animated } from "react-native";
import { DeviceMotion } from "expo-sensors";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "3",
    strokeWidth: "1",
    stroke: "#007aff",
  },
  withInnerLines: false,
  withOuterLines: false,
  xAxisLabel: "",
  yAxisLabel: "",
  formatYLabel: () => "",
  formatXLabel: () => "",
};

const MAX_SPEED_DATA_POINTS = 30;

export default function App() {
  const [mode, setMode] = useState("motion");
  const [motionData, setMotionData] = useState({ acceleration: {}, accelerationIncludingGravity: {}, rotation: {}, orientation: null });
  const [obd2Data, setObd2Data] = useState({ speed: 0, rpm: 0, throttle: 0 });
  const [speedHistory, setSpeedHistory] = useState([0]);
  const [currentAcceleration, setCurrentAcceleration] = useState(0);
  const previousSpeedRef = useRef(0);
  const chartAnimationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mode === "motion") {
      DeviceMotion.setUpdateInterval(100);
      const subscription = DeviceMotion.addListener(data => setMotionData(data));
      return () => subscription.remove();
    }
  }, [mode]);

  useEffect(() => {
    let interval;
    if (mode === "sim") {
      setSpeedHistory([0]);
      previousSpeedRef.current = 0;
      setCurrentAcceleration(0);
      Animated.timing(chartAnimationValue, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }).start();

      const newSpeedHistory = [];

      interval = setInterval(() => {
        const newSpeed = Math.random() * 120;
        setObd2Data({ speed: newSpeed, rpm: Math.random() * 8000, throttle: Math.random() * 100 });
        const accelerationValue = newSpeed - previousSpeedRef.current;
        setCurrentAcceleration(accelerationValue);

        newSpeedHistory.push(newSpeed);

        setSpeedHistory(prevHistory => {
          const updatedHistory = [...prevHistory, newSpeed];
          return updatedHistory.length > MAX_SPEED_DATA_POINTS ? updatedHistory.slice(-MAX_SPEED_DATA_POINTS) : updatedHistory;
        });
        previousSpeedRef.current = newSpeed;
      }, 250);

      Animated.timing(chartAnimationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      return () => clearInterval(interval);
    } else if (interval) {
      clearInterval(interval);
    }
  }, [mode]);

  const { acceleration, accelerationIncludingGravity, rotation, orientation } = motionData;

  const speedChartData = {
    labels: [],
    datasets: [{
      data: speedHistory.length > 0 ? speedHistory : [0],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Device Motion" onPress={() => setMode("motion")} />
        <Button title="Live" onPress={() => setMode("live")} />
        <Button title="Simulation" onPress={() => setMode("sim")} />
      </View>

      {mode === "motion" && (
        <View style={styles.dataContainer}>
          <Text style={styles.heading}>📱Device Motion</Text>
          <Text style={styles.label}>Acceleration (w/o gravity):</Text>
          <Text style={styles.value}>x: {acceleration?.x?.toFixed(2)}</Text>
          <Text style={styles.value}>y: {acceleration?.y?.toFixed(2)}</Text>
          <Text style={styles.value}>z: {acceleration?.z?.toFixed(2)}</Text>
          <Text style={styles.label}>Acceleration (with gravity):</Text>
          <Text style={styles.value}>x: {accelerationIncludingGravity?.x?.toFixed(2)}</Text>
          <Text style={styles.value}>y: {accelerationIncludingGravity?.y?.toFixed(2)}</Text>
          <Text style={styles.value}>z: {accelerationIncludingGravity?.z?.toFixed(2)}</Text>
          <Text style={styles.label}>Rotation (radians):</Text>
          <Text style={styles.value}>α: {rotation?.alpha?.toFixed(2)}</Text>
          <Text style={styles.value}>β: {rotation?.beta?.toFixed(2)}</Text>
          <Text style={styles.value}>γ: {rotation?.gamma?.toFixed(2)}</Text>
          <Text style={styles.label}>Orientation: {orientation === null ? 'null' : orientation.toFixed(0)}</Text>
        </View>
      )}

      {mode === "live" && <Text style={styles.value}>Real time data</Text>}

      {mode === "sim" && (
        <View style={styles.dataContainer}>
          <Text style={styles.heading}>Simulated OBD2 Data</Text>
          <Text style={styles.value}>Speed: {Math.round(obd2Data.speed)} mph</Text>
          <Text style={styles.value}>RPM: {Math.round(obd2Data.rpm)}</Text>
          <Text style={styles.value}>Throttle: {obd2Data.throttle.toFixed(1)} %</Text>

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

          <Text style={styles.label}>Current Acceleration:</Text>
          <Text style={styles.value}>{currentAcceleration.toFixed(2)} mph/s</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  dataContainer: {
    width: '90%',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
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
    textAlign: 'center',
    color: '#333',
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#555',
  },
  label: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    textAlign: 'center',
    color: '#333',
  },
  value: {
    fontSize: 15,
    marginBottom: 5,
    textAlign: 'center',
    color: '#666',
  },
  chartStyle: {
    marginVertical: 10,
    borderRadius: 8,
  },
});
