const KPH_TO_MPH = 0.621371;

export const fetchWicanData = async () => {
  try {
    const response = await fetch("http://192.168.80.1/autopid_data");
    const json = await response.json();
    const speedInKph = json["0D-VehicleSpeed"] || 0;
    const newObd2Data = {
      speed: speedInKph * KPH_TO_MPH,
      rpm: json["0C-EngineRPM"] || 0,
      throttle: json["11-ThrottlePosition"] || 0,
    };
    return newObd2Data;
  } catch (error) {
    // Re-throwing the error so the UI can handle it
    throw error;
  }
};
