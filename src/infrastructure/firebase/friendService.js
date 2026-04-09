import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { FriendUser } from "../../domain/entities/FriendUser";
import { User } from "../../domain/entities/User";
import { chatService } from './chatService';

class FriendService {
  /**
   * Gửi yêu cầu kết bạn (Trạng thái mặc định là pending)
   */
  async addFriend(currentUserId, targetUserId) {
    try {
      if (currentUserId === targetUserId) throw new Error("Không thể kết bạn với chính mình.");

      const friendshipId = FriendUser.generateId(currentUserId, targetUserId);
      const docSnap = await getDoc(doc(db, "friendships", friendshipId));

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'accepted') throw new Error("Hai bạn đã là bạn bè.");
        if (data.status === 'pending') throw new Error("Yêu cầu kết bạn đang chờ xử lý.");
      }

      const newFriendship = new FriendUser({
        id: friendshipId,
        userId1: currentUserId,
        userId2: targetUserId,
        status: 'pending',
        requestSentBy: currentUserId
      });

      await setDoc(doc(db, "friendships", friendshipId), {
        ...newFriendship.toFirestore(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Chấp nhận yêu cầu kết bạn và tự động tạo cuộc trò chuyện direct
   */
  async acceptFriendRequest(friendshipId) {
    try {
      const docRef = doc(db, "friendships", friendshipId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Cập nhật trạng thái bạn bè
        await updateDoc(docRef, {
          status: 'accepted',
          updatedAt: serverTimestamp()
        });

        // Tự động tạo/lấy direct chat để nó hiện trong danh sách trò chuyện
        await chatService.getOrCreateDirectChat(data.userId1, data.userId2);

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  }

  /**
   * Từ chối hoặc hủy yêu cầu kết bạn
   */
  async declineFriendRequest(friendshipId) {
    try {
      await deleteDoc(doc(db, "friendships", friendshipId));
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách yêu cầu kết bạn đang chờ mình phê duyệt
   */
  subscribeToPendingRequests(currentUid, callback) {
    const q = query(
      collection(db, "friendships"),
      where("status", "==", "pending"),
      where("requestSentBy", "!=", currentUid) // Chỉ lấy những cái KHÔNG PHẢI do mình gửi
    );

    return onSnapshot(q, async (snapshot) => {
      const requests = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        // Kiểm tra xem mình có phải là 1 trong 2 người trong quan hệ này không
        if (data.userId1 === currentUid || data.userId2 === currentUid) {
          const senderId = data.requestSentBy;
          const userSnap = await getDoc(doc(db, "users", senderId));
          if (userSnap.exists()) {
            requests.push({
              friendshipId: d.id,
              sender: User.fromFirestore(userSnap)
            });
          }
        }
      }
      callback(requests);
    });
  }

  /**
   * Tìm kiếm hệ thống qua Email
   */
  async searchUserByEmail(email) {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return User.fromFirestore(querySnapshot.docs[0]);
  }
}

export const friendService = new FriendService();
