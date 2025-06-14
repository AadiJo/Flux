const KPH_TO_MPH = 0.621371;

export const fetchWicanData = async () => {
  try {
    const response = await fetch("http://192.168.80.1/autopid_data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();

    // Validate that we have at least one of the expected fields
    if (
      !json["0D-VehicleSpeed"] &&
      !json["0C-EngineRPM"] &&
      !json["11-ThrottlePosition"]
    ) {
      throw new Error("Invalid data format: No expected PID data found");
    }

    const speedInKph = json["0D-VehicleSpeed"] || 0;
    const newObd2Data = {
      speed: speedInKph * KPH_TO_MPH,
      rpm: json["0C-EngineRPM"] || 0,
      throttle: json["11-ThrottlePosition"] || 0,
    };
    return newObd2Data;
  } catch (error) {
    console.log("WiCAN data fetch error:", error.message);
    throw error;
  }
};
