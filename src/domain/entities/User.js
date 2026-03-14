/**
 * @class User
 * @description Quản lý thông tin người dùng và hành động cơ bản.
 */
export class User {
  constructor(userId, username, email, avatarUrl = "") {
    this.userId = userId;
    this.username = username;
    this.email = email;
    this.avatarUrl = avatarUrl;
    this.posts = []; // Danh sách postId đã bump
  }

  /**
   * Tạo dữ liệu người dùng để lưu vào Firebase.
   */
  toFirestore() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      avatarUrl: this.avatarUrl,
      createdAt: new Date()
    };
  }
}
