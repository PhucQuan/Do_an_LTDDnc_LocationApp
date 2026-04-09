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
  onSnapshot,
  orderBy,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { ChatGroup } from "../../domain/entities/ChatGroup";
import { ChatMessage } from "../../domain/entities/ChatMessage";

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
   * Cập nhật thông tin nhóm (Tên, Avatar, Nicknames)
   */
  async updateGroupInfo(groupId, data) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating group info:", error);
      throw error;
    }
  }

  /**
   * Đặt biệt danh cho thành viên trong nhóm
   */
  async setUserNickname(groupId, userId, nickname) {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        [`nicknames.${userId}`]: nickname,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error setting nickname:", error);
      throw error;
    }
  }

  /**
   * Lấy hoặc tạo cuộc hội thoại 1-1
   */
  async getOrCreateDirectChat(userId1, userId2) {
    try {
      const groupsRef = collection(db, "groups");
      const q = query(
        groupsRef,
        where("members", "array-contains", userId1),
        where("isDirect", "==", true)
      );

      const querySnapshot = await getDocs(q);
      let chatId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.members.includes(userId2) && data.members.length === 2) {
          chatId = doc.id;
        }
      });

      if (chatId) return chatId;

      // Create new direct chat
      const newGroup = {
        name: "Direct Chat",
        members: [userId1, userId2],
        isDirect: true,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(groupsRef, newGroup);
      return docRef.id;
    } catch (error) {
      console.error("Error getOrCreateDirectChat:", error);
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

  /**
   * Subscribe thông tin nhóm cụ thể
   */
  subscribeToGroup(groupId, callback) {
    return onSnapshot(doc(db, "groups", groupId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  /**
   * Gửi tin nhắn
   */
  async sendMessage(groupId, text, senderId, senderName) {
    try {
      const messagesRef = collection(db, "groups", groupId, "messages");
      const newMessage = {
        text,
        senderId,
        senderName,
        createdAt: serverTimestamp(),
        readBy: [senderId] // Người gửi mặc định đã đọc
      };

      await addDoc(messagesRef, newMessage);

      // Cập nhật tin nhắn cuối cho nhóm
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        lastMessage: {
          text,
          senderName,
          sentAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu tất cả tin nhắn trong nhóm là đã đọc
   */
  async markAllAsRead(groupId, userId) {
    try {
      const messagesRef = collection(db, "groups", groupId, "messages");

      // Lấy các tin nhắn mà user chưa đọc
      const snapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach(d => {
        const data = d.data();
        if (!data.readBy || !data.readBy.includes(userId)) {
          batch.update(d.ref, {
            readBy: arrayUnion(userId)
          });
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  /**
   * Subscribe tin nhắn realtime
   */
  subscribeToMessages(groupId, callback) {
    const messagesRef = collection(db, "groups", groupId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ChatMessage.fromFirestore(doc));
      callback(messages);
    }, (error) => {
      console.error("Error subscribing to messages:", error);
    });
  }

  /**
   * Lấy số tin nhắn chưa đọc của một nhóm
   */
  subscribeToUnreadCount(groupId, userId, callback) {
    const messagesRef = collection(db, "groups", groupId, "messages");

    return onSnapshot(messagesRef, (snapshot) => {
      const unreadCount = snapshot.docs.filter(d => {
        const data = d.data();
        return data.senderId !== userId && (!data.readBy || !data.readBy.includes(userId));
      }).length;
      callback(unreadCount);
    });
  }
}

export const chatService = new ChatService();
