import {
  collection, doc, getDocs, getDoc, updateDoc, deleteDoc,
  query, orderBy, limit, onSnapshot, serverTimestamp,
  addDoc, where,
} from 'firebase/firestore';
import { ref, get, onValue } from 'firebase/database';
import { db, rtdb } from './firebase';

export const ADMIN_EMAILS = ['admin@geolink.app'];

class AdminService {
  isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email?.toLowerCase());
  }

  async ensureAdminRole(uid, email) {
    if (!this.isAdminEmail(email)) return false;
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists() && userDoc.data().role !== 'admin') {
      await updateDoc(userRef, { role: 'admin' });
    }
    return true;
  }

  async getStats() {
    const [usersSnap, groupsSnap, giftsSnap, friendsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'gifts')),
      getDocs(query(collection(db, 'friendships'), where('status', '==', 'accepted'))),
    ]);
    const ghostCount = usersSnap.docs.filter(d => d.data().isGhostMode).length;
    return {
      totalUsers: usersSnap.size,
      ghostUsers: ghostCount,
      activeUsers: usersSnap.size - ghostCount,
      totalGroups: groupsSnap.size,
      totalGifts: giftsSnap.size,
      totalFriendships: friendsSnap.size,
    };
  }

  subscribeToUsers(callback) {
    return onSnapshot(collection(db, 'users'), (snap) => {
      callback(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
  }

  async setUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role });
  }

  async toggleBan(uid, isBanned) {
    await updateDoc(doc(db, 'users', uid), { isBanned });
  }

  async deleteUserDoc(uid) {
    await deleteDoc(doc(db, 'users', uid));
  }

  async getAllGroups() {
    const snap = await getDocs(collection(db, 'groups'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async deleteGroup(groupId) {
    await deleteDoc(doc(db, 'groups', groupId));
  }

  async getRecentGifts(n = 30) {
    try {
      const snap = await getDocs(
        query(collection(db, 'gifts'), orderBy('createdAt', 'desc'), limit(n))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      const snap = await getDocs(collection(db, 'gifts'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  }

  async getAllFriendships() {
    const snap = await getDocs(collection(db, 'friendships'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ── Gift Catalog ────────────────────────────────────────────────
  DEFAULT_CATALOG = [
    { title: 'Milk Tea', subtitle: 'Cute surprise for besties', price: '29.000đ', category: 'Food', image: 'https://cdn-icons-png.flaticon.com/512/4949/4949857.png', accent: '#FFE7D6' },
    { title: 'Coffee', subtitle: 'Morning energy in one tap', price: '35.000đ', category: 'Food', image: 'https://cdn-icons-png.flaticon.com/512/3050/3050153.png', accent: '#FDE68A' },
    { title: 'Sticker Burst', subtitle: 'Locket-style reaction pack', price: '9.000đ', category: 'Cute', image: 'https://cdn-icons-png.flaticon.com/512/833/833472.png', accent: '#D8F3FF' },
    { title: 'Phone Top-up 20K', subtitle: 'Quick recharge gift', price: '20.000đ', category: 'Top-up', image: 'https://cdn-icons-png.flaticon.com/512/597/597177.png', accent: '#DBEAFE' },
    { title: 'Phone Top-up 50K', subtitle: 'Big recharge for someone', price: '50.000đ', category: 'Top-up', image: 'https://cdn-icons-png.flaticon.com/128/9946/9946341.png', accent: '#E0EAFF' },
    { title: 'Movie Voucher', subtitle: 'Weekend hangout idea', price: '79.000đ', category: 'Voucher', image: 'https://cdn-icons-png.flaticon.com/512/1179/1179069.png', accent: '#FCE7F3' },
    { title: 'Snack', subtitle: 'Late-night comfort gift', price: '45.000đ', category: 'Food', image: 'https://cdn-icons-png.flaticon.com/128/1051/1051948.png', accent: '#E9D5FF' },
    { title: 'Heart Confetti', subtitle: 'Tiny but affectionate', price: '15.000đ', category: 'Cute', image: 'https://cdn-icons-png.flaticon.com/512/1077/1077035.png', accent: '#FEE2E2' },
  ];

  async getGiftCatalog() {
    const snap = await getDocs(collection(db, 'gift_catalog'));
    if (snap.empty) {
      await this.seedDefaultCatalog();
      const snap2 = await getDocs(collection(db, 'gift_catalog'));
      return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async seedDefaultCatalog() {
    for (const gift of this.DEFAULT_CATALOG) {
      await addDoc(collection(db, 'gift_catalog'), { ...gift, createdAt: serverTimestamp() });
    }
  }

  async addGiftItem(gift) {
    return addDoc(collection(db, 'gift_catalog'), { ...gift, createdAt: serverTimestamp() });
  }

  async updateGiftItem(id, data) {
    await updateDoc(doc(db, 'gift_catalog', id), data);
  }

  async deleteGiftItem(id) {
    await deleteDoc(doc(db, 'gift_catalog', id));
  }

  // ── Locations ───────────────────────────────────────────────────
  subscribeToLocations(callback) {
    const locRef = ref(rtdb, 'locations');
    return onValue(locRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const data = snapshot.val();
      callback(Object.entries(data).map(([uid, loc]) => ({ uid, ...loc })));
    });
  }
}

export const adminService = new AdminService();
