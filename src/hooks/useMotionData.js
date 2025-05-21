import { useState, useEffect, useRef } from "react";
import { DeviceMotion } from "expo-sensors";

export const useMotionData = (isActive = true) => {
  const [motionData, setMotionData] = useState({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
  });
  const motionSubscription = useRef(null);

  useEffect(() => {
    if (isActive) {
      DeviceMotion.setUpdateInterval(100);
      const subscription = DeviceMotion.addListener((data) =>
        setMotionData(data)
      );
      motionSubscription.current = subscription;
      return () => subscription.remove();
    }
  }, [isActive]);

  return {
    motionData,
    acceleration: motionData.acceleration,
    rotation: motionData.rotation,
  };
};
