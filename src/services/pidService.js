import { getStoredProtocol } from "./protocolDetectionService";

export const scanAvailablePids = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const protocol = await getStoredProtocol();
    if (!protocol) {
      return {
        success: false,
        error: "No protocol configured. Please configure protocol first.",
      };
    }

    const response = await fetch(
      `http://192.168.80.1/scan_available_pids?protocol=${protocol}`,
      {
        signal: controller.signal,
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (!data.std_pids || data.std_pids.length === 0) {
        return {
          success: false,
          error: "Invalid protocol detected. Please reconfigure.",
        };
      }
      console.log("PID scan completed successfully");
      return { success: true, pids: data.std_pids };
    } else {
      console.log("PID scan failed with status:", response.status);
      return { success: false, error: `Failed with status ${response.status}` };
    }
  } catch (error) {
    console.log("PID scan failed:", error.message);
    return { success: false, error: error.message };
  } finally {
    clearTimeout(timeoutId);
  }
};
