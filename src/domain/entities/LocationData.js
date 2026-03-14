/**
 * @class LocationData
 * @description Đại diện cho tọa độ địa lý và địa chỉ của một bài đăng.
 */
export class LocationData {
  constructor(latitude, longitude, addressName = "") {
    this.latitude = latitude;
    this.longitude = longitude;
    this.addressName = addressName;
  }

  /**
   * @returns {string} Địa chỉ định dạng rút gọn.
   */
  getFormattedAddress() {
    return this.addressName || `Lat: ${this.latitude}, Lon: ${this.longitude}`;
  }

  /**
   * Chuyển đổi sang object thuần túy để lưu vào Firestore.
   */
  toFirestore() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      addressName: this.addressName
    };
  }
}
