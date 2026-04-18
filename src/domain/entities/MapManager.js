/**
 * @class MapManager
 * @description Quản lý trạng thái hiển thị của bản đồ và danh sách các bài đăng.
 */
export class MapManager {
  constructor(mapId, zoomLevel = 15) {
    this.mapId = mapId;
    this.zoomLevel = zoomLevel;
    this.posts = []; // Danh sách các BumpPost hiển thị trên bản đồ (Aggregation)
  }

  /**
   * Thêm một bài đăng vào danh sách hiển thị của bản đồ.
   * @param {BumpPost} post
   */
  addPost(post) {
    this.posts.push(post);
  }

  /**
   * Chuyển đổi cấu hình bản đồ sang object để lưu vào Firestore.
   */
  toFirestore() {
    return {
      mapId: this.mapId,
      zoomLevel: this.zoomLevel,
      updatedAt: new Date()
    };
  }
}
