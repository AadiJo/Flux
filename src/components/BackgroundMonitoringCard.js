import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  startBackgroundMonitoring,
  stopBackgroundMonitoring,
  isBackgroundMonitoringActive,
  getBackgroundStatus,
} from '../services/backgroundService';

export const BackgroundMonitoringCard = () => {
  const { theme } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundStatus, setBackgroundStatus] = useState(null);

  useEffect(() => {
    loadBackgroundStatus();
    
    // Set up interval to check status periodically
    const interval = setInterval(loadBackgroundStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadBackgroundStatus = async () => {
    try {
      const status = await getBackgroundStatus();
      setBackgroundStatus(status);
      setIsEnabled(status.isActive);
    } catch (error) {
      console.error('Failed to load background status:', error);
    }
  };

  const handleToggleBackground = async (value) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (value) {
        // Starting background monitoring
        Alert.alert(
          'Enable Background Monitoring',
          'Flux will continue monitoring your driving when you switch to other apps. This may affect battery life.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false),
            },
            {
              text: 'Enable',
              onPress: async () => {
                const result = await startBackgroundMonitoring();
                if (result.success) {
                  setIsEnabled(true);
                  Alert.alert(
                    'Background Monitoring Enabled',
                    'Flux will now continue collecting OBD data when you switch to other apps.'
                  );
                } else {
                  Alert.alert(
                    'Failed to Enable',
                    `Could not enable background monitoring: ${result.error}`
                  );
                }
                setIsLoading(false);
                loadBackgroundStatus();
              },
            },
          ]
        );
      } else {
        // Stopping background monitoring
        const result = await stopBackgroundMonitoring();
        if (result.success) {
          setIsEnabled(false);
          Alert.alert(
            'Background Monitoring Disabled',
            'Flux will only collect data when the app is active.'
          );
        } else {
          Alert.alert(
            'Failed to Disable',
            `Could not disable background monitoring: ${result.error}`
          );
        }
        setIsLoading(false);
        loadBackgroundStatus();
      }
    } catch (error) {
      console.error('Error toggling background monitoring:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="car-connected"
          size={24}
          color={isEnabled ? theme.primary : theme.textSecondary}
        />
        <Text style={[styles.title, { color: theme.text }]}>
          Background Monitoring
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Switch
            trackColor={{ false: theme.border, true: theme.primary + '60' }}
            thumbColor={isEnabled ? theme.primary : theme.textSecondary}
            onValueChange={handleToggleBackground}
            value={isEnabled}
            disabled={isLoading}
          />
        )}
      </View>
      
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {isEnabled 
          ? 'Flux is monitoring your driving in the background'
          : 'Enable to continue OBD data collection when using other apps'
        }
      </Text>
      
      {backgroundStatus && (
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Last Update:
            </Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>
              {formatLastUpdate(backgroundStatus.lastUpdate)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Background Fetch:
            </Text>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons
                name={backgroundStatus.isBackgroundFetchRegistered ? 'check-circle' : 'close-circle'}
                size={16}
                color={backgroundStatus.isBackgroundFetchRegistered ? theme.success : theme.error}
              />
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {backgroundStatus.isBackgroundFetchRegistered ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              Location Updates:
            </Text>
            <View style={styles.statusIndicator}>
              <MaterialCommunityIcons
                name={backgroundStatus.isLocationTaskRegistered ? 'check-circle' : 'close-circle'}
                size={16}
                color={backgroundStatus.isLocationTaskRegistered ? theme.success : theme.error}
              />
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {backgroundStatus.isLocationTaskRegistered ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {isEnabled && (
        <View style={[styles.warningContainer, { backgroundColor: theme.warning + '20' }]}>
          <MaterialCommunityIcons
            name="battery-alert"
            size={16}
            color={theme.warning}
          />
          <Text style={[styles.warningText, { color: theme.warning }]}>
            Background monitoring may impact battery life
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
});
