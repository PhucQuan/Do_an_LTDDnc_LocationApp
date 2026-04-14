import { auth, db, rtdb } from './firebase';
import { ref, set, onValue, off } from 'firebase/database';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

const MIN_PUSH_DISTANCE_METERS = 5;
const MAX_IDLE_PUSH_MS = 30 * 1000;
const MIN_HISTORY_DISTANCE_METERS = 8;
const HISTORY_FLUSH_INTERVAL_MS = 30 * 60 * 1000;
const MAX_BUFFER_POINTS = 25;
const HISTORY_COLLECTION = 'locations_history';
const HISTORY_RETENTION_DAYS = 49;

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getStatusFromSpeed(speed = 0, lastStationaryAt = null) {
  if (speed >= 1.6) {
    return 'running';
  }

  if (speed >= 0.25) {
    return 'moving';
  }

  return 'still';
}

function getInitials(name = '?') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function toDayKey(inputDate) {
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeFilterRange(filterKey = 'today') {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (filterKey === 'yesterday') {
    start.setDate(start.getDate() - 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

function normalizeCoords(coords) {
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: coords?.accuracy ?? null,
    speed: Math.max(coords?.speed ?? 0, 0),
    heading: coords?.heading ?? 0,
    altitude: coords?.altitude ?? null,
  };
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'just now';
  }

  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

class LocationService {
  constructor() {
    this._lastPushedPayload = null;
    this._lastPushAt = 0;
    this._historyBuffer = [];
    this._lastBufferedPoint = null;
    this._flushTimer = null;
    this._cachedProfile = null;
    this._lastStationaryAt = null;
  }

  async _getCurrentUser() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.uid) {
      throw new Error('Chua dang nhap.');
    }

    if (!this._cachedProfile || this._cachedProfile.uid !== firebaseUser.uid) {
      const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      this._cachedProfile = {
        uid: firebaseUser.uid,
        displayName:
          userSnapshot.data()?.name ||
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Bạn',
        avatarUrl:
          userSnapshot.data()?.avatarUrl ||
          firebaseUser.photoURL ||
          null,
        batteryLevel: userSnapshot.data()?.batteryLevel ?? null,
        isGhostMode: Boolean(userSnapshot.data()?.isGhostMode),
      };
    }

    return {
      ...this._cachedProfile,
      initials: getInitials(
        this._cachedProfile.displayName || firebaseUser.displayName || firebaseUser.email || 'B'
      ),
    };
  }

  async _getUserRef() {
    const { uid } = await this._getCurrentUser();
    return ref(rtdb, `locations/${uid}`);
  }

  _shouldPushRealtime(nextCoords) {
    if (!this._lastPushedPayload) {
      return true;
    }

    const movedDistance = getDistanceMeters(
      this._lastPushedPayload.latitude,
      this._lastPushedPayload.longitude,
      nextCoords.latitude,
      nextCoords.longitude
    );

    const idleDuration = Date.now() - this._lastPushAt;
    return movedDistance >= MIN_PUSH_DISTANCE_METERS || idleDuration >= MAX_IDLE_PUSH_MS;
  }

  _shouldBufferHistory(nextCoords) {
    if (!this._lastBufferedPoint) {
      return true;
    }

    const movedDistance = getDistanceMeters(
      this._lastBufferedPoint.latitude,
      this._lastBufferedPoint.longitude,
      nextCoords.latitude,
      nextCoords.longitude
    );

    return movedDistance >= MIN_HISTORY_DISTANCE_METERS;
  }

  _scheduleHistoryFlush() {
    if (this._flushTimer) {
      return;
    }

    this._flushTimer = setTimeout(() => {
      this.flushHistoryBuffer();
    }, HISTORY_FLUSH_INTERVAL_MS);
  }

  async pushLocation(location) {
    try {
      const coords = normalizeCoords(location?.coords ?? location);
      if (!coords) {
        return false;
      }

      if (!this._shouldPushRealtime(coords)) {
        this.bufferHistoryPoint(location);
        return false;
      }

      const currentUser = await this._getCurrentUser();
      if (currentUser.isGhostMode) {
        await this.clearMyLocation();
        return false;
      }

      const now = Date.now();
      if (coords.speed < 0.25) {
        if (!this._lastStationaryAt) {
          this._lastStationaryAt = now;
        }
      } else {
        this._lastStationaryAt = null;
      }

      const statusInfo = getStatusFromSpeed(coords.speed, this._lastStationaryAt);

      const realtimePayload = {
        ...coords,
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        initials: currentUser.initials,
        avatarUrl: currentUser.avatarUrl,
        status: statusInfo,
        speedKmh: Number((coords.speed * 3.6).toFixed(1)),
        batteryLevel:
          location?.meta?.batteryLevel ??
          currentUser.batteryLevel ??
          null,
        stationarySince: statusInfo === 'still' ? this._lastStationaryAt : null,
        updatedAt: now,
      };

      await set(await this._getUserRef(), realtimePayload);
      this._lastPushedPayload = coords;
      this._lastPushAt = now;
      this.bufferHistoryPoint(location);
      return true;
    } catch (error) {
      console.error('[locationService] Loi push vi tri:', error.message);
      return false;
    }
  }

  bufferHistoryPoint(location) {
    try {
      const coords = normalizeCoords(location?.coords ?? location);
      if (!coords || !this._shouldBufferHistory(coords)) {
        return;
      }

      const capturedAt = new Date(location?.timestamp ?? Date.now());
      this._historyBuffer.push({
        ...coords,
        status: getStatusFromSpeed(coords.speed),
        speedKmh: Number((coords.speed * 3.6).toFixed(1)),
        capturedAt: capturedAt.toISOString(),
      });

      this._lastBufferedPoint = coords;
      this._scheduleHistoryFlush();

      if (this._historyBuffer.length >= MAX_BUFFER_POINTS) {
        this.flushHistoryBuffer();
      }
    } catch (error) {
      console.warn('[locationService] Khong the dua diem vao buffer:', error.message);
    }
  }

  async flushHistoryBuffer() {
    if (this._flushTimer) {
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
    }

    if (!this._historyBuffer.length) {
      return;
    }

    try {
      const currentUser = await this._getCurrentUser();
      const firstPointTime = new Date(this._historyBuffer[0].capturedAt);
      const expiresAt = new Date(firstPointTime);
      expiresAt.setDate(expiresAt.getDate() + HISTORY_RETENTION_DAYS);

      const points = this._historyBuffer.map((point) => ({
        ...point,
        capturedAt: Timestamp.fromDate(new Date(point.capturedAt)),
      }));

      await addDoc(collection(db, HISTORY_COLLECTION), {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        initials: currentUser.initials,
        dayKey: toDayKey(firstPointTime),
        startedAt: Timestamp.fromDate(firstPointTime),
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expiresAt),
        points,
      });

      this._historyBuffer = [];
    } catch (error) {
      console.error('[locationService] Loi flush footprint:', error.message);
    }
  }

  subscribeToAllLocations(callback) {
    const locationsRef = ref(rtdb, 'locations');

    const handler = (snapshot) => {
      const data = snapshot.val() || {};
      const myUid = auth.currentUser?.uid;
      const others = Object.entries(data).reduce((accumulator, [uid, payload]) => {
        if (
          uid === myUid ||
          !Number.isFinite(payload?.latitude) ||
          !Number.isFinite(payload?.longitude)
        ) {
          return accumulator;
        }

        accumulator[uid] = {
          ...payload,
          relativeTime: formatRelativeTime(payload.updatedAt),
        };
        return accumulator;
      }, {});

      callback(others);
    };

    onValue(locationsRef, handler);
    return () => off(locationsRef, 'value', handler);
  }

  subscribeToHistory(filterKey, callback) {
    const { start, end } = getTimeFilterRange(filterKey);
    const historyQuery = query(
      collection(db, HISTORY_COLLECTION),
      where('startedAt', '>=', Timestamp.fromDate(start)),
      where('startedAt', '<', Timestamp.fromDate(end)),
      orderBy('startedAt', 'asc')
    );

    return onSnapshot(historyQuery, (snapshot) => {
      const polylinesByUser = snapshot.docs.reduce((accumulator, documentSnapshot) => {
        const data = documentSnapshot.data();
        const points = Array.isArray(data.points)
          ? data.points
              .map((point) => ({
                latitude: point.latitude,
                longitude: point.longitude,
                capturedAt: point.capturedAt?.toDate?.()?.getTime?.() ?? null,
              }))
              .filter(
                (point) =>
                  Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
              )
          : [];

        if (!points.length) {
          return accumulator;
        }

        if (!accumulator[data.uid]) {
          accumulator[data.uid] = {
            uid: data.uid,
            displayName: data.displayName || 'Ban do',
            initials: data.initials || getInitials(data.displayName || 'B'),
            coordinates: [],
          };
        }

        accumulator[data.uid].coordinates.push(...points);
        return accumulator;
      }, {});

      callback(Object.values(polylinesByUser));
    });
  }

  async clearMyLocation() {
    try {
      await this.flushHistoryBuffer();
      await set(await this._getUserRef(), null);
      this._lastPushedPayload = null;
      this._lastPushAt = 0;
      this._lastBufferedPoint = null;
      this._cachedProfile = null;
    } catch (error) {
      console.warn('[locationService] Khong the xoa vi tri:', error.message);
    }
  }

  async setGhostMode(enabled) {
    const currentUser = await this._getCurrentUser();
    await setDoc(
      doc(db, 'users', currentUser.uid),
      {
        isGhostMode: enabled,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    this._cachedProfile = {
      ...this._cachedProfile,
      isGhostMode: enabled,
    };

    if (enabled) {
      await this.clearMyLocation();
    }
  }

  async syncLocationVisibility() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.uid) {
      return;
    }

    const acceptedFriendships = await getDocs(
      query(collection(db, 'friendships'), where('status', '==', 'accepted'))
    );
    const groupsSnapshot = await getDocs(
      query(collection(db, 'groups'), where('members', 'array-contains', firebaseUser.uid))
    );

    const visibleIds = new Set([firebaseUser.uid]);

    acceptedFriendships.docs.forEach((entry) => {
      const data = entry.data();
      if (data.userId1 === firebaseUser.uid) {
        visibleIds.add(data.userId2);
      }
      if (data.userId2 === firebaseUser.uid) {
        visibleIds.add(data.userId1);
      }
    });

    groupsSnapshot.docs.forEach((entry) => {
      (entry.data().members || []).forEach((memberId) => visibleIds.add(memberId));
    });

    const writes = {};
    visibleIds.forEach((visibleUid) => {
      writes[visibleUid] = true;
    });

    await set(ref(rtdb, `location_visibility/${firebaseUser.uid}`), writes);
  }
}

export const locationService = new LocationService();
