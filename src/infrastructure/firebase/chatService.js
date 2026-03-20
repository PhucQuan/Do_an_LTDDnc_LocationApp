import { db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { ChatGroup } from "../../domain/entities/ChatGroup";

class ChatService {
  /**
   * Tạo nhóm trò chuyện mới
   */
  async createGroup(groupName, creatorId, memberIds) {
    try {
      const groupsRef = collection(db, "groups");
      const newGroup = new ChatGroup({
        name: groupName,
        creatorId: creatorId,
        members: memberIds,
        createdAt: new Date().toISOString(),
      });

      const docRef = await addDoc(groupsRef, {
        ...newGroup.toFirestore(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating group:", error);
      throw error;
    }
  }

  /**
   * Rời khỏi nhóm trò chuyện
   */
  async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách nhóm mà người dùng tham gia (Realtime)
   */
  subscribeToUserGroups(userId, callback) {
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where("members", "array-contains", userId));

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ChatGroup.fromFirestore(doc));
      callback(groups);
    }, (error) => {
      console.error("Error subscribing to groups:", error);
    });
  }
}

export const chatService = new ChatService();
