import AsyncStorage from "@react-native-async-storage/async-storage";

const PROTOCOL_STORAGE_KEY = "obd_protocol";

const fetchProtocolResponse = async (protocol) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `http://192.168.80.1/scan_available_pids?protocol=${protocol}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, protocol };
    }

    const data = await response.json();
    // A valid protocol will have some PIDs in the response
    const isValid = data.std_pids && data.std_pids.length > 0;

    return {
      success: true,
      protocol,
      isValid,
    };
  } catch (error) {
    console.log(`Protocol ${protocol} check failed:`, error);
    return { success: false, protocol };
  }
};

export const detectProtocol = async () => {
  try {
    // Try protocols 6-9 in parallel
    const protocolChecks = [6, 7, 8, 9].map((protocol) =>
      fetchProtocolResponse(protocol)
    );

    const results = await Promise.all(protocolChecks);

    // Find the first valid protocol
    const validProtocol = results.find(
      (result) => result.success && result.isValid
    );

    if (validProtocol) {
      // Store the valid protocol
      await AsyncStorage.setItem(
        PROTOCOL_STORAGE_KEY,
        validProtocol.protocol.toString()
      );
      return {
        success: true,
        protocol: validProtocol.protocol,
      };
    }

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
