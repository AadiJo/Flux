import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWicanData } from './wicanService';
import { logData, logConnectionMarker } from './loggingService';

const BACKGROUND_FETCH_TASK = 'flux-background-fetch';
const LOCATION_TASK_NAME = 'flux-background-location';
const BACKGROUND_STATE_KEY = 'flux_background_active';
const LAST_BACKGROUND_UPDATE_KEY = 'flux_last_background_update';

// Background fetch task for OBD data collection
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log('[Background] Background fetch task started');
  
  try {
    // Check if background monitoring is enabled
    const isBackgroundActive = await AsyncStorage.getItem(BACKGROUND_STATE_KEY);
    if (isBackgroundActive !== 'true') {
      console.log('[Background] Background monitoring is disabled');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Try to fetch OBD data
    let obdData = null;
    let hasNewData = false;
    
    try {
      obdData = await fetchWicanData();
      hasNewData = true;
      console.log('[Background] OBD data fetched successfully:', obdData);
    } catch (error) {
      console.log('[Background] OBD data fetch failed:', error.message);
      // Log connection issue
      await logConnectionMarker('real', 'CONNECTION_FAILED', {
        error: error.message,
        timestamp: Date.now(),
        source: 'background'
      });
    }

    // Get current location
    let locationData = null;
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      locationData = location;
      console.log('[Background] Location data obtained');
    } catch (error) {
      console.log('[Background] Location fetch failed:', error.message);
    }

    // Log data if we have either OBD or location data
    if (hasNewData || locationData) {
      await logData('real', {
        obd2Data: obdData,
        location: locationData,
        timestamp: Date.now(),
        source: 'background'
      });
      
      // Update last background update timestamp
      await AsyncStorage.setItem(LAST_BACKGROUND_UPDATE_KEY, Date.now().toString());
      
      console.log('[Background] Data logged successfully');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[Background] Background fetch task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Background] Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    console.log('[Background] Received new locations:', locations.length);

    // Check if background monitoring is enabled
    const isBackgroundActive = await AsyncStorage.getItem(BACKGROUND_STATE_KEY);
    if (isBackgroundActive !== 'true') {
      console.log('[Background] Background monitoring is disabled');
      return;
    }

    // Process the most recent location
    if (locations && locations.length > 0) {
      const location = locations[locations.length - 1];
      
      // Try to get OBD data as well
      let obdData = null;
      try {
        obdData = await fetchWicanData();
        console.log('[Background] OBD data fetched with location update');
      } catch (error) {
        console.log('[Background] OBD data not available with location update');
      }

      // Log the data
      await logData('real', {
        obd2Data: obdData,
        location: {
          coords: location.coords,
          timestamp: location.timestamp
        },
        timestamp: Date.now(),
        source: 'background_location'
      });

      // Update last background update timestamp
      await AsyncStorage.setItem(LAST_BACKGROUND_UPDATE_KEY, Date.now().toString());
    }
  }
});

export const startBackgroundMonitoring = async () => {
  try {
    console.log('[Background] Starting background monitoring...');
    
    // Enable background state
    await AsyncStorage.setItem(BACKGROUND_STATE_KEY, 'true');
    
    // Register background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 1000, // 15 seconds (minimum allowed)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    // Request background location permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus === 'granted') {
        // Start background location updates
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
          foregroundService: {
            notificationTitle: 'Flux is monitoring your drive',
            notificationBody: 'Recording vehicle data in the background',
            notificationColor: '#00202d',
          },
        });
        
        console.log('[Background] Background location updates started');
      } else {
        console.log('[Background] Background location permission denied');
      }
    }
    
    // Log start marker
    await logConnectionMarker('real', 'BACKGROUND_STARTED', {
      timestamp: Date.now(),
    });
    
    console.log('[Background] Background monitoring started successfully');
    return { success: true };
  } catch (error) {
    console.error('[Background] Failed to start background monitoring:', error);
    return { success: false, error: error.message };
  }
};

export const stopBackgroundMonitoring = async () => {
  try {
    console.log('[Background] Stopping background monitoring...');
    
    // Disable background state
    await AsyncStorage.setItem(BACKGROUND_STATE_KEY, 'false');
    
    // Unregister background fetch
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    
    // Stop location updates
    const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isLocationTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    
    // Log stop marker
    await logConnectionMarker('real', 'BACKGROUND_STOPPED', {
      timestamp: Date.now(),
    });
    
    console.log('[Background] Background monitoring stopped successfully');
    return { success: true };
  } catch (error) {
    console.error('[Background] Failed to stop background monitoring:', error);
    return { success: false, error: error.message };
  }
};

export const isBackgroundMonitoringActive = async () => {
  try {
    const isActive = await AsyncStorage.getItem(BACKGROUND_STATE_KEY);
    return isActive === 'true';
  } catch (error) {
    console.error('[Background] Failed to check background monitoring status:', error);
    return false;
  }
};

export const getBackgroundStatus = async () => {
  try {
    const isActive = await isBackgroundMonitoringActive();
    const lastUpdate = await AsyncStorage.getItem(LAST_BACKGROUND_UPDATE_KEY);
    const isBackgroundFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    
    return {
      isActive,
      lastUpdate: lastUpdate ? parseInt(lastUpdate) : null,
      isBackgroundFetchRegistered,
      isLocationTaskRegistered,
    };
  } catch (error) {
    console.error('[Background] Failed to get background status:', error);
    return {
      isActive: false,
      lastUpdate: null,
      isBackgroundFetchRegistered: false,
      isLocationTaskRegistered: false,
    };
  }
};

// Initialize background fetch when app starts
export const initializeBackgroundService = async () => {
  try {
    console.log('[Background] Initializing background service...');
    
    // Check if tasks are already registered and clean up if needed
    const isBackgroundFetchRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    
    if (isBackgroundFetchRegistered) {
      console.log('[Background] Background fetch task already registered');
    }
    
    if (isLocationTaskRegistered) {
      console.log('[Background] Location task already registered');
    }
    
    // Check if background monitoring should be restored
    const wasBackgroundActive = await isBackgroundMonitoringActive();
    if (wasBackgroundActive) {
      console.log('[Background] Restoring background monitoring...');
      // Don't automatically restart - let user manually enable
      await AsyncStorage.setItem(BACKGROUND_STATE_KEY, 'false');
    }
    
    console.log('[Background] Background service initialized');
    return { success: true };
  } catch (error) {
    console.error('[Background] Failed to initialize background service:', error);
    return { success: false, error: error.message };
  }
};
