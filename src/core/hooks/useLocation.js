import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          Alert.alert(
            "Quyền truy cập bị từ chối",
            "Ứng dụng cần quyền truy cập vị trí để hoạt động. Vui lòng bật trong cài đặt."
          );
          setIsLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        setIsLoading(false);

        // Subscribe to location updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );

        return () => {
          if (subscription) {
            subscription.remove();
          }
        };
      } catch (error) {
        console.error("Location Error:", error);
        setErrorMsg(error.message);
        setIsLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, isLoading };
};
