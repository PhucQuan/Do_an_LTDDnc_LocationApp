export class FriendUser {
  constructor({ id, userId1, userId2, status, createdAt }) {
    this.id = id; // Thường là tổ hợp của userId1_userId2 để đảm bảo duy nhất
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.status = status || 'accepted'; // 'pending', 'accepted', 'blocked'
    this.createdAt = createdAt || new Date().toISOString();
  }

  /**
   * Tạo ID duy nhất từ 2 User ID để tránh trùng lặp quan hệ (A-B và B-A)
   */
  static generateId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new FriendUser({
      id: doc.id,
      ...data
    });
  }

  toFirestore() {
    return {
      userId1: this.userId1,
      userId2: this.userId2,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}
