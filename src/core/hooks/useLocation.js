import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Alert } from 'react-native';
import { startBackgroundTracking } from '../location/backgroundTracking';

const WATCH_OPTIONS = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 3000,
  distanceInterval: 3,
  mayShowUserSettingsDialog: true,
};

const MOVING_SPEED_THRESHOLD = 1.6;
const WALKING_SPEED_THRESHOLD = 0.25;

function getStatusLabel(speed = 0) {
  if (speed >= MOVING_SPEED_THRESHOLD) {
    return 'dang chay';
  }

  if (speed >= WALKING_SPEED_THRESHOLD) {
    return 'dang di chuyen';
  }

  return 'dung yen';
}

function normalizeLocationData(location) {
  if (!location?.coords) {
    return null;
  }

  const safeSpeed = Math.max(location.coords.speed ?? 0, 0);

  return {
    ...location,
    coords: {
      ...location.coords,
      speed: safeSpeed,
      heading: location.coords.heading ?? 0,
      accuracy: location.coords.accuracy ?? null,
      altitude: location.coords.altitude ?? null,
    },
    meta: {
      speedKmh: safeSpeed * 3.6,
      status: getStatusLabel(safeSpeed),
      capturedAt: location.timestamp ?? Date.now(),
      batteryLevel: location?.meta?.batteryLevel ?? null,
    },
  };
}

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef(null);

  const ensurePermission = useCallback(async () => {
    const providerStatus = await Location.hasServicesEnabledAsync();
    if (!providerStatus) {
      setErrorMsg('Dich vu vi tri da bi tat.');
      Alert.alert(
        'GPS dang tat',
        'Vui long bat GPS de ung dung co the cap nhat vi tri theo thoi gian thuc.'
      );
      return false;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Quyen truy cap vi tri bi tu choi.');
      Alert.alert(
        'Quyen truy cap bi tu choi',
        'Ung dung can quyen vi tri de hien thi ban do va chia se vi tri.'
      );
      return false;
    }

    return true;
  }, []);

  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => null);

      const normalizedLocation = normalizeLocationData({
        ...currentLocation,
        meta: {
          batteryLevel: batteryLevel == null ? null : Math.round(batteryLevel * 100),
        },
      });
      setLocation(normalizedLocation);
      setIsLoading(false);
      return normalizedLocation;
    } catch (error) {
      console.error('[useLocation] Loi lay vi tri:', error);
      setErrorMsg(error.message);
      setIsLoading(false);
      return null;
    }
  }, [ensurePermission]);

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startWatching = useCallback(async () => {
    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      stopWatching();

      const subscription = await Location.watchPositionAsync(
        WATCH_OPTIONS,
        async (nextLocation) => {
          const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => null);
          setLocation(
            normalizeLocationData({
              ...nextLocation,
              meta: {
                batteryLevel: batteryLevel == null ? null : Math.round(batteryLevel * 100),
              },
            })
          );
          setIsLoading(false);
        }
      );

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('[useLocation] Khong the bat dau theo doi vi tri:', error);
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  }, [ensurePermission, stopWatching]);

  useEffect(() => {
    let isMounted = true;

    getLocation().then((firstLocation) => {
      if (!isMounted || !firstLocation) {
        return;
      }

      startWatching();
      startBackgroundTracking().catch(() => {});
    });

    return () => {
      isMounted = false;
      stopWatching();
    };
  }, [getLocation, startWatching, stopWatching]);

  return {
    location,
    errorMsg,
    isLoading,
    getLocation,
    startWatching,
    stopWatching,
  };
};
