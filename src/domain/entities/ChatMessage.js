export class ChatMessage {
  constructor({ id, text, senderId, senderName, createdAt, readBy }) {
    this.id = id;
    this.text = text;
    this.senderId = senderId;
    this.senderName = senderName;
    this.createdAt = createdAt || new Date().toISOString();
    this.readBy = readBy || []; // Mảng chứa UIDs của những người đã đọc
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatMessage({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      readBy: data.readBy || []
    });
  }

  toFirestore() {
    return {
      text: this.text,
      senderId: this.senderId,
      senderName: this.senderName,
      createdAt: this.createdAt,
      readBy: this.readBy
    };
  }
}
