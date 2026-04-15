export class User {
  constructor({ id, name, email, phone, avatarUrl, username, createdAt, privacyMap }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.avatarUrl = avatarUrl || null;
    this.username = username || null;
    this.createdAt = createdAt || new Date().toISOString();
    this.isGhostMode = false;
    this.batteryLevel = 100;
    this.speed = 0;
    this.privacyMap = privacyMap || {};
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      id: doc.id,
      ...data
    });
  }

  toFirestore() {
    return {
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      username: this.username,
      createdAt: this.createdAt,
      isGhostMode: this.isGhostMode,
      batteryLevel: this.batteryLevel,
      speed: this.speed,
      privacyMap: this.privacyMap,
    };
  }
}
