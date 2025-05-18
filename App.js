import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

export default function App() {
  const [motionData, setMotionData] = useState({
    acceleration: {},
    accelerationIncludingGravity: {},
    rotation: {},
    orientation: null,
  });

  useEffect(() => {
    DeviceMotion.setUpdateInterval(100);

    const subscription = DeviceMotion.addListener(data => {
      setMotionData(data);
    });

    return () => subscription.remove();
  }, []);

  const {
    acceleration,
    accelerationIncludingGravity,
    rotation,
    orientation,
  } = motionData;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Device Motion</Text>

      <Text style={styles.label}>Acceleration (w/o gravity):</Text>
      <Text style={styles.value}>x: {acceleration?.x?.toFixed(2)}</Text>
      <Text style={styles.value}>y: {acceleration?.y?.toFixed(2)}</Text>
      <Text style={styles.value}>z: {acceleration?.z?.toFixed(2)}</Text>

      <Text style={styles.label}>Acceleration (with gravity):</Text>
      <Text style={styles.value}>x: {accelerationIncludingGravity?.x?.toFixed(2)}</Text>
      <Text style={styles.value}>y: {accelerationIncludingGravity?.y?.toFixed(2)}</Text>
      <Text style={styles.value}>z: {accelerationIncludingGravity?.z?.toFixed(2)}</Text>

      <Text style={styles.label}>Rotation (radians):</Text>
      <Text style={styles.value}>x: {rotation?.alpha?.toFixed(2)}</Text>
      <Text style={styles.value}>y: {rotation?.beta?.toFixed(2)}</Text>
      <Text style={styles.value}>z: {rotation?.gamma?.toFixed(2)}</Text>

      <Text style={styles.label}>Orientation: {orientation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
  },
});
