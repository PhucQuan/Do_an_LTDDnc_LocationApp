import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { Alert } from 'react-native';
import { startBackgroundTracking } from '../location/backgroundTracking';

// ── Adaptive tracking tiers ────────────────────────────────────────────────
// ACTIVE   (car/bike): speed > 10 km/h  →  every 3s, 5m accuracy
// WALKING  (on foot):  speed > 1 km/h   →  every 10s, 10m accuracy
// IDLE     (stationary): else           →  every 90s, 20m accuracy (huge battery saving)
const TRACKING_TIERS = {
  ACTIVE: {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 3000,
    distanceInterval: 5,
  },
  WALKING: {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 10,
  },
  IDLE: {
    accuracy: Location.Accuracy.Low,
    timeInterval: 90000,
    distanceInterval: 20,
  },
};

// Speed thresholds in m/s
const ACTIVE_SPEED_MS = 2.8;   // ~10 km/h
const WALKING_SPEED_MS = 0.28; // ~1 km/h
// How long to wait before downgrading to IDLE
const IDLE_DOWNGRADE_DELAY = 2 * 60 * 1000; // 2 minutes

function getTier(speedMs = 0) {
  if (speedMs >= ACTIVE_SPEED_MS) return 'ACTIVE';
  if (speedMs >= WALKING_SPEED_MS) return 'WALKING';
  return 'IDLE';
}

function getStatusLabel(speed = 0) {
  if (speed >= 1.6) return 'dang chay';
  if (speed >= 0.25) return 'dang di chuyen';
  return 'dung yen';
}

function normalizeLocationData(location) {
  if (!location?.coords) return null;

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
  const [trackingTier, setTrackingTier] = useState('WALKING');

  const subscriptionRef = useRef(null);
  const currentTierRef = useRef('WALKING');
  const idleTimerRef = useRef(null);

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

  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const startWatching = useCallback(async (tier = 'WALKING') => {
    try {
      const hasPermission = await ensurePermission();
      if (!hasPermission) {
        setIsLoading(false);
        return;
      }

      stopWatching();
      currentTierRef.current = tier;
      setTrackingTier(tier);

      const watchOptions = TRACKING_TIERS[tier];

      const subscription = await Location.watchPositionAsync(
        watchOptions,
        async (nextLocation) => {
          const batteryLevel = await Battery.getBatteryLevelAsync().catch(() => null);
          const normalized = normalizeLocationData({
            ...nextLocation,
            meta: {
              batteryLevel: batteryLevel == null ? null : Math.round(batteryLevel * 100),
            },
          });

          setLocation(normalized);
          setIsLoading(false);

          // ── Adaptive tier switching ────────────────────────────────────
          const speed = nextLocation.coords?.speed ?? 0;
          const newTier = getTier(speed);

          if (newTier === 'IDLE') {
            // Don't downgrade instantly — wait 2min to confirm truly idle
            if (!idleTimerRef.current && currentTierRef.current !== 'IDLE') {
              idleTimerRef.current = setTimeout(() => {
                idleTimerRef.current = null;
                if (currentTierRef.current !== 'IDLE') {
                  console.log('[Adaptive] Downgrading to IDLE (battery saver)');
                  startWatching('IDLE');
                }
              }, IDLE_DOWNGRADE_DELAY);
            }
          } else {
            // Moving again — cancel any pending idle downgrade
            if (idleTimerRef.current) {
              clearTimeout(idleTimerRef.current);
              idleTimerRef.current = null;
            }
            // Upgrade/downgrade if tier changed
            if (newTier !== currentTierRef.current) {
              console.log(`[Adaptive] Switching: ${currentTierRef.current} → ${newTier}`);
              startWatching(newTier);
            }
          }
        }
      );

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('[useLocation] Khong the bat dau theo doi vi tri:', error);
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  }, [ensurePermission, stopWatching]);

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

  useEffect(() => {
    let isMounted = true;

    getLocation().then((firstLocation) => {
      if (!isMounted || !firstLocation) return;

      // Start at WALKING tier; adaptive logic upgrades/downgrades automatically
      startWatching('WALKING');
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
    trackingTier,
    getLocation,
    startWatching,
    stopWatching,
  };
};
