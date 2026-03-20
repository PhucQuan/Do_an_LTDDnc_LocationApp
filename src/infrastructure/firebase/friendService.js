import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { FriendUser } from "../../domain/entities/FriendUser";
import { User } from "../../domain/entities/User";

class FriendService {
  /**
   * TÌM KIẾM HỆ THỐNG: Theo Email (Tìm được bất kỳ ai)
   */
  async searchUserByEmail(email) {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      const userDoc = querySnapshot.docs[0];
      const userData = User.fromFirestore(userDoc);

      // Kiểm tra xem đã là bạn bè chưa
      // Note: Bạn có thể thêm flag isFriend vào object trả về nếu muốn UI hiển thị khác đi
      return userData;
    } catch (error) {
      console.error("Error searching user by email:", error);
      throw error;
    }
  }

  /**
   * TÌM KIẾM BẠN BÈ: Theo Tên (Chỉ tìm trong những người đã kết bạn)
   */
  async searchFriendsByName(currentUid, nameQuery) {
    try {
      // 1. Lấy tất cả friendship của user này
      const q = query(collection(db, "friendships"), where("status", "==", "accepted"));
      const snapshot = await getDocs(q);

      const friendsList = [];
      const lowerQuery = nameQuery.toLowerCase().trim();

      for (const d of snapshot.docs) {
        const data = d.data();
        let friendUid = null;

        if (data.userId1 === currentUid) friendUid = data.userId2;
        else if (data.userId2 === currentUid) friendUid = data.userId1;

        if (friendUid) {
          const userSnap = await getDoc(doc(db, "users", friendUid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Lọc theo tên (không phân biệt hoa thường)
            if (userData.name.toLowerCase().includes(lowerQuery)) {
              friendsList.push({ id: d.id, ...userData, uid: friendUid });
            }
          }
        }
      }
      return friendsList;
    } catch (error) {
      console.error("Error searching friends by name:", error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái bạn bè
   */
  async getFriendshipStatus(uid1, uid2) {
    try {
      const friendshipId = FriendUser.generateId(uid1, uid2);
      const docRef = doc(db, "friendships", friendshipId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().status : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Kết bạn
   */
  async addFriend(currentUserId, targetUserId) {
    try {
      if (currentUserId === targetUserId) throw new Error("Không thể kết bạn với chính mình.");

      const friendshipId = FriendUser.generateId(currentUserId, targetUserId);
      const status = await this.getFriendshipStatus(currentUserId, targetUserId);

      if (status === 'accepted') throw new Error("Hai bạn đã là bạn bè.");

      const newFriendship = new FriendUser({
        id: friendshipId,
        userId1: currentUserId,
        userId2: targetUserId,
        status: 'accepted',
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
}

export const friendService = new FriendService();
