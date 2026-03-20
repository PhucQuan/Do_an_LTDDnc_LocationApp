export class ChatGroup {
  constructor({ id, name, creatorId, members, avatarUrl, lastMessage, createdAt }) {
    this.id = id;
    this.name = name;
    this.creatorId = creatorId;
    this.members = members || []; // Mảng chứa UIDs của các thành viên
    this.avatarUrl = avatarUrl || null;
    this.lastMessage = lastMessage || null;
    this.createdAt = createdAt || new Date().toISOString();
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatGroup({
      id: doc.id,
      ...data
    });
  }

  toFirestore() {
    return {
      name: this.name,
      creatorId: this.creatorId,
      members: this.members,
      avatarUrl: this.avatarUrl,
      lastMessage: this.lastMessage,
      createdAt: this.createdAt,
    };
  }
}
