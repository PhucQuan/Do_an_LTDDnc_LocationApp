import { rtdb } from './firebase';
import { auth } from './firebase';
import { ref, set, onValue, off, serverTimestamp } from 'firebase/database';

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const MIN_DISTANCE_METERS = 10; // Chỉ push khi di chuyển > 10 mét

/**
 * Tính khoảng cách giữa 2 tọa độ (Haversine formula) — đơn vị: mét.
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // bán kính Trái Đất (mét)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class LocationService {
  constructor() {
    this._lastPushedCoords = null; // Tọa độ đã push lần cuối
  }

  /**
   * Lấy path RTDB của user hiện tại.
   * Cấu trúc: /locations/{uid}
   */
  _getUserRef() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Chưa đăng nhập — không thể push vị trí.');
    return ref(rtdb, `locations/${uid}`);
  }

  /**
   * Push tọa độ lên RTDB.
   * Chỉ push nếu đã di chuyển > MIN_DISTANCE_METERS so với lần push trước.
   * @param {number} latitude
   * @param {number} longitude
   * @param {number|null} accuracy - Độ chính xác GPS (mét)
   */
  async pushLocation(latitude, longitude, accuracy = null) {
    try {
      // Kiểm tra khoảng cách — tiết kiệm write RTDB
      if (this._lastPushedCoords) {
        const dist = getDistanceMeters(
          this._lastPushedCoords.latitude,
          this._lastPushedCoords.longitude,
          latitude,
          longitude
        );
        if (dist < MIN_DISTANCE_METERS) {
          console.log(`[locationService] Bỏ qua — chỉ di chuyển ${dist.toFixed(1)}m (<${MIN_DISTANCE_METERS}m)`);
          return false;
        }
      }

      const userRef = this._getUserRef();
      await set(userRef, {
        latitude,
        longitude,
        accuracy,
        updatedAt: serverTimestamp(),
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Ẩn danh',
      });

      this._lastPushedCoords = { latitude, longitude };
      console.log(`[locationService] ✅ Đã push vị trí: Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
      return true;
    } catch (error) {
      console.error('[locationService] ❌ Lỗi push vị trí:', error.message);
      return false;
    }
  }

  /**
   * Lắng nghe vị trí của TẤT CẢ thành viên online từ RTDB.
   * Trả về hàm unsubscribe để dừng lắng nghe.
   * @param {(locations: Object) => void} callback
   */
  subscribeToAllLocations(callback) {
    const locationsRef = ref(rtdb, 'locations');

    const handler = (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback({});
        return;
      }
      // Exclude vị trí của chính mình ra khỏi danh sách "người khác"
      const myUid = auth.currentUser?.uid;
      const others = Object.entries(data).reduce((acc, [uid, loc]) => {
        if (uid !== myUid) acc[uid] = loc;
        return acc;
      }, {});
      callback(others);
    };

    onValue(locationsRef, handler);

    // Trả về hàm cleanup
    return () => off(locationsRef, 'value', handler);
  }

  /**
   * Xóa vị trí của bản thân khi logout / tắt app.
   */
  async clearMyLocation() {
    try {
      const userRef = this._getUserRef();
      await set(userRef, null);
      this._lastPushedCoords = null;
      console.log('[locationService] Đã xóa vị trí khỏi RTDB.');
    } catch (error) {
      console.warn('[locationService] Không thể xóa vị trí:', error.message);
    }
  }
}

export const locationService = new LocationService();
