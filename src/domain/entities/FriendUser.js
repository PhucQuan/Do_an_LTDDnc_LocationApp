export class FriendUser {
  constructor({ id, userId1, userId2, status, requestSentBy, createdAt }) {
    this.id = id; // Tổ hợp của userId1_userId2 (đã sắp xếp) để duy nhất
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.status = status || 'pending'; // 'pending', 'accepted', 'blocked'
    this.requestSentBy = requestSentBy; // UID của người gửi yêu cầu
    this.createdAt = createdAt || new Date().toISOString();
  }

  /**
   * Tạo ID duy nhất từ 2 User ID để tránh trùng lặp quan hệ
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
      requestSentBy: this.requestSentBy,
      createdAt: this.createdAt,
    };
  }
}
