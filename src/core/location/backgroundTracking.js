import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { locationService } from '../../infrastructure/firebase/locationService';

export const BACKGROUND_LOCATION_TASK = 'geolink-background-location-task';

const ACTIVE_OPTIONS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 15000,
  distanceInterval: 12,
  deferredUpdatesInterval: 15000,
  deferredUpdatesDistance: 25,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: false,
  foregroundService: {
    notificationTitle: 'GeoLink is sharing location',
    notificationBody: 'Realtime location stays active for your friends.',
  },
};

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[backgroundTracking] Task error:', error.message);
    return;
  }

  const locations = data?.locations || [];
  const latestLocation = locations[locations.length - 1];
  if (!latestLocation) {
    return;
  }

  const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => null);

  await locationService.pushLocation({
    ...latestLocation,
    meta: {
      batteryLevel: batteryLevel == null ? null : Math.round(batteryLevel * 100),
    },
  });
});

export async function requestTrackingPermissions() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  const background = await Location.requestBackgroundPermissionsAsync();

  return {
    foreground: foreground.status,
    background: background.status,
  };
}

export async function startBackgroundTracking() {
  const permissions = await requestTrackingPermissions();
  if (permissions.foreground !== 'granted' || permissions.background !== 'granted') {
    throw new Error('Background location permission was not granted.');
  }

  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) {
    return true;
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, ACTIVE_OPTIONS);
  return true;
}

export async function stopBackgroundTracking() {
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (!started) {
    return false;
  }

  await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  return true;
}
