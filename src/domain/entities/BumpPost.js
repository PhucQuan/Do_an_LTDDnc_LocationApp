/**
 * @class BumpPost
 * @description Kết hợp dữ liệu hình ảnh, chú thích và tọa độ địa lý.
 */
export class BumpPost {
  /**
   * @param {string} postId - ID của bài viết
   * @param {string} userId - ID người tạo
   * @param {string} imageUrl - URL của ảnh đã upload
   * @param {string} caption - Nội dung bài viết
   * @param {LocationData} location - Đối tượng vị trí địa lý
   */
  constructor(postId, userId, imageUrl, caption, location, timestamp = new Date()) {
    this.postId = postId;
    this.userId = userId;
    this.imageUrl = imageUrl;
    this.caption = caption;
    this.location = location; // Đối tượng của LocationData
    this.timestamp = timestamp;
  }

  /**
   * Chuyển đổi sang object để lưu lên Cloud Firestore.
   */
  toFirestore() {
    return {
      postId: this.postId,
      userId: this.userId,
      imageUrl: this.imageUrl,
      caption: this.caption,
      location: this.location.toFirestore(), // Gọi toFirestore của LocationData
      timestamp: this.timestamp
    };
  }
}
