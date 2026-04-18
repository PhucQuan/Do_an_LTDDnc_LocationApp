import { auth, db, storage } from './firebase';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

const MOMENTS_COLLECTION = 'moments';

async function uriToBlob(uri) {
  const response = await fetch(uri);
  return await response.blob();
}

class MomentService {
  async createMoment({ localUri, caption = '', location }) {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      throw new Error('You must be logged in to share a moment.');
    }

    if (!localUri) {
      throw new Error('A local image URI is required.');
    }

    const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid));
    const userProfile = userSnapshot.data() || {};
    const blob = await uriToBlob(localUri);
    const fileRef = storageRef(
      storage,
      `moments/${currentUser.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    );

    await uploadBytes(fileRef, blob, { contentType: blob.type || 'image/jpeg' });
    const imageUrl = await getDownloadURL(fileRef);
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    await addDoc(collection(db, MOMENTS_COLLECTION), {
      userId: currentUser.uid,
      displayName:
        userProfile.name ||
        currentUser.displayName ||
        currentUser.email?.split('@')[0] ||
        'You',
      avatarUrl: userProfile.avatarUrl || currentUser.photoURL || null,
      caption: caption.trim(),
      imageUrl,
      location: {
        latitude: Number(location?.coords?.latitude ?? location?.latitude),
        longitude: Number(location?.coords?.longitude ?? location?.longitude),
      },
      createdAt: Timestamp.fromDate(createdAt),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
  }

  subscribeToRecentMoments(callback) {
    const now = Timestamp.now();
    const momentsQuery = query(
      collection(db, MOMENTS_COLLECTION),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc')
    );

    return onSnapshot(momentsQuery, (snapshot) => {
      callback(
        snapshot.docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        }))
      );
    });
  }
}

export const momentService = new MomentService();
