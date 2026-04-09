import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase/firebase';
import { locationService } from '../../infrastructure/firebase/locationService';

function buildVisibleUserIds(uid, friendships, groups) {
  const ids = new Set([uid]);

  friendships.forEach((friendship) => {
    if (friendship.status !== 'accepted') {
      return;
    }

    if (friendship.userId1 === uid) {
      ids.add(friendship.userId2);
    }

    if (friendship.userId2 === uid) {
      ids.add(friendship.userId1);
    }
  });

  groups.forEach((group) => {
    (group.members || []).forEach((memberId) => ids.add(memberId));
  });

  return ids;
}

export function useVisibilityScope() {
  const [visibleUserIds, setVisibleUserIds] = useState(new Set());

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setVisibleUserIds(new Set());
      return undefined;
    }

    let friendships = [];
    let groups = [];

    const sync = () => {
      setVisibleUserIds(buildVisibleUserIds(uid, friendships, groups));
      locationService.syncLocationVisibility().catch(() => {});
    };

    const unsubscribeFriendships = onSnapshot(
      query(collection(db, 'friendships'), where('status', '==', 'accepted')),
      (snapshot) => {
        friendships = snapshot.docs
          .map((entry) => entry.data())
          .filter((entry) => entry.userId1 === uid || entry.userId2 === uid);
        sync();
      }
    );

    const unsubscribeGroups = onSnapshot(
      query(collection(db, 'groups'), where('members', 'array-contains', uid)),
      (snapshot) => {
        groups = snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }));
        sync();
      }
    );

    return () => {
      unsubscribeFriendships();
      unsubscribeGroups();
    };
  }, []);

  return visibleUserIds;
}
