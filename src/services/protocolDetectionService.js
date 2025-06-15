import AsyncStorage from "@react-native-async-storage/async-storage";

const PROTOCOL_STORAGE_KEY = "obd_protocol";
const PROTOCOL_TIMEOUT = 20000; // Increased to 20 seconds

const fetchProtocolResponse = async (protocol) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROTOCOL_TIMEOUT);

    console.log(`Testing protocol ${protocol}...`);
    const response = await fetch(
      `http://192.168.80.1/scan_available_pids?protocol=${protocol}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(
        `Protocol ${protocol} check failed with status: ${response.status}`
      );
      return { success: false, protocol };
    }

    const data = await response.json();
    // A valid protocol will have some PIDs in the response
    const isValid = data.std_pids && data.std_pids.length > 0;

    console.log(
      `Protocol ${protocol} check result: ${isValid ? "valid" : "invalid"}`
    );
    if (isValid) {
      console.log(`Found valid PIDs for protocol ${protocol}:`, data.std_pids);
    }

    return {
      success: true,
      protocol,
      isValid,
    };
  } catch (error) {
    console.log(`Protocol ${protocol} check failed:`, error);
    if (error.name === "AbortError") {
      console.log(
        `Protocol ${protocol} check timed out after ${PROTOCOL_TIMEOUT}ms`
      );
    }
    return { success: false, protocol };
  }
};

export const detectProtocol = async () => {
  try {
    console.log("Starting protocol detection...");

    // Try protocols 6-9 sequentially instead of in parallel
    for (const protocol of [6, 7, 8, 9]) {
      const result = await fetchProtocolResponse(protocol);

      if (result.success && result.isValid) {
        console.log(`Found valid protocol: ${protocol}`);
        // Store the valid protocol
        await AsyncStorage.setItem(PROTOCOL_STORAGE_KEY, protocol.toString());
        return {
          success: true,
          protocol: protocol,
        };
      }
    }

    console.log("No valid protocol found after checking all protocols");
    return {
      success: false,
      error: "No valid protocol found",
    };
  } catch (error) {
    console.error("Protocol detection failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getStoredProtocol = async () => {
  try {
    const protocol = await AsyncStorage.getItem(PROTOCOL_STORAGE_KEY);
    return protocol ? parseInt(protocol, 10) : null;
  } catch (error) {
    console.error("Failed to get stored protocol:", error);
    return null;
  }
};

export const clearStoredProtocol = async () => {
  try {
    await AsyncStorage.removeItem(PROTOCOL_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear stored protocol:", error);
  }
};
