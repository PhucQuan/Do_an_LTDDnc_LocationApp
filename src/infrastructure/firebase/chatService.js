import { db } from './firebase';
import {
  addDoc,
  arrayRemove,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ChatGroup } from '../../domain/entities/ChatGroup';

class ChatService {
  async syncGroupVisibility(memberIds) {
    const uniqueMembers = [...new Set(memberIds)];
    const writes = [];

    uniqueMembers.forEach((sourceId) => {
      uniqueMembers.forEach((targetId) => {
        if (sourceId === targetId) {
          return;
        }

        writes.push(
          setDoc(
            doc(db, 'groups_visibility', `${sourceId}_${targetId}`),
            {
              sourceId,
              targetId,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        );
      });
    });

    await Promise.all(writes);
  }

  async createGroup(groupName, creatorId, memberIds) {
    try {
      const groupsRef = collection(db, 'groups');
      const newGroup = new ChatGroup({
        name: groupName,
        creatorId,
        members: memberIds,
        createdAt: new Date().toISOString(),
      });

      const docRef = await addDoc(groupsRef, {
        ...newGroup.toFirestore(),
        updatedAt: serverTimestamp(),
      });

      await this.syncGroupVisibility(memberIds);
      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId, userId) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  subscribeToUserGroups(userId, callback) {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const groups = snapshot.docs.map((entry) => ChatGroup.fromFirestore(entry));
        callback(groups);
      },
      (error) => {
        console.error('Error subscribing to groups:', error);
      }
    );
  }

  async sendGroupMessage(groupId, sender, text) {
    const trimmedText = text?.trim();
    if (!trimmedText) {
      throw new Error('Message cannot be empty.');
    }

    const messagesRef = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesRef, {
      text: trimmedText,
      senderId: sender.id,
      senderName: sender.name,
      senderInitials: sender.initials,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'groups', groupId), {
      lastMessage: trimmedText,
      updatedAt: serverTimestamp(),
    });
  }

  subscribeToGroupMessages(groupId, callback) {
    const messagesQuery = query(
      collection(db, 'groups', groupId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...messageDoc.data(),
        }));
        callback(messages);
      },
      (error) => {
        console.error('Error subscribing to group messages:', error);
      }
    );
  }
}

export const chatService = new ChatService();
