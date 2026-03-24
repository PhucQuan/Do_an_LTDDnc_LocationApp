import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef(null);

  // Hàm thủ công gọi lấy vị trí một lần
  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Kiểm tra xem dịch vụ vị trí (GPS) có đang bật không
      const providerStatus = await Location.hasServicesEnabledAsync();
      if (!providerStatus) {
        setErrorMsg('Dịch vụ vị trí đã bị tắt.');
        Alert.alert(
          "GPS đang tắt",
          "Vui lòng bật GPS (Dịch vụ vị trí) trên thiết bị của bạn để ứng dụng hoạt động."
        );
        setIsLoading(false);
        return null;
      }

      // 2. Yêu cầu quyền truy cập vị trí Foreground
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Quyền truy cập vị trí bị từ chối.');
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Ứng dụng cần quyền truy cập vị trí để hoạt động. Vui lòng cấp quyền trong phần Cài đặt."
        );
        setIsLoading(false);
        return null;
      }

      // 3. Lấy vị trí hiện tại
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation);
      console.log(`[getLocation] Đã lấy vị trí mới: Lat: ${currentLocation.coords.latitude}, Lng: ${currentLocation.coords.longitude}`);
      setIsLoading(false);
      return currentLocation;
    } catch (error) {
      console.error("[useLocation] Có lỗi khi lấy vị trí:", error);
      setErrorMsg(error.message);
      setIsLoading(false);
      return null;
    }
  }, []);

  // Hàm để bắt đầu theo dõi vị trí liên tục
  const startWatching = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Xóa subscription cũ nếu đã có
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,     // Theo dõi mỗi 5 giây
          distanceInterval: 10,   // Hoặc người dùng di chuyển 10 mét
        },
        (newLocation) => {
          console.log(`[watchPosition] Cập nhật liên tục: Lat: ${newLocation.coords.latitude}, Lng: ${newLocation.coords.longitude}`);
          setLocation(newLocation);
        }
      );
      
      subscriptionRef.current = subscription;
    } catch (error) {
      console.log("[useLocation] Không thể bắt đầu theo dõi vị trí:", error);
    }
  }, []);

  // Hàm dừng theo dõi
  const stopWatching = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Tự động gọi lần đầu khi mount hook
    getLocation().then(() => {
      // Sau khi lấy được lần đầu, bắt đầu theo dõi liên tục
      startWatching();
    });

    // Cleanup khi component bị hủy (unmount)
    return () => {
      stopWatching();
    };
  }, [getLocation, startWatching, stopWatching]);

  return { 
    location, 
    errorMsg, 
    isLoading, 
    getLocation, // Cho phép gọi lại từ bên ngoài (ví dụ: nút "Tải lại")
    startWatching,
    stopWatching
  };
};
