import { auth, db, rtdb } from './infrastructure/firebase/firebase';
import { ref, set } from 'firebase/database';
import { Timestamp, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FriendUser } from './domain/entities/FriendUser';

const DEMO_USERS = [
  {
    id: 'mock_hung',
    name: 'Hung Map',
    email: 'hung.map.demo@geolink.app',
    phone: '0901000001',
    avatarUrl: 'https://i.pravatar.cc/300?img=12',
    batteryLevel: 87,
    speed: 3.8,
    isGhostMode: false,
  },
  {
    id: 'mock_tu',
    name: 'Tu Social',
    email: 'tu.social.demo@geolink.app',
    phone: '0901000002',
    avatarUrl: 'https://i.pravatar.cc/300?img=24',
    batteryLevel: 74,
    speed: 1.2,
    isGhostMode: false,
  },
  {
    id: 'mock_linh',
    name: 'Linh Designer',
    email: 'linh.demo@geolink.app',
    phone: '0901000003',
    avatarUrl: 'https://i.pravatar.cc/300?img=32',
    batteryLevel: 63,
    speed: 0,
    isGhostMode: false,
  },
  {
    id: 'mock_mai',
    name: 'Mai Pending',
    email: 'mai.pending.demo@geolink.app',
    phone: '0901000004',
    avatarUrl: 'https://i.pravatar.cc/300?img=48',
    batteryLevel: 91,
    speed: 0.4,
    isGhostMode: false,
  },
];

const DEMO_CENTER = {
  latitude: 10.77653,
  longitude: 106.70098,
};

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function buildPoint(latitude, longitude, capturedAt, speedKmh, status) {
  return {
    latitude,
    longitude,
    accuracy: 8,
    altitude: null,
    heading: 0,
    speed: Number((speedKmh / 3.6).toFixed(2)),
    speedKmh,
    status,
    capturedAt: Timestamp.fromDate(capturedAt),
  };
}

function buildTodayPath(offsetLat, offsetLng, speedKmh, status) {
  const start = new Date();
  start.setHours(8, 10, 0, 0);

  return [
    buildPoint(DEMO_CENTER.latitude + offsetLat, DEMO_CENTER.longitude + offsetLng, start, speedKmh, status),
    buildPoint(DEMO_CENTER.latitude + offsetLat + 0.0012, DEMO_CENTER.longitude + offsetLng + 0.001, addMinutes(start, 9), speedKmh, status),
    buildPoint(DEMO_CENTER.latitude + offsetLat + 0.0021, DEMO_CENTER.longitude + offsetLng + 0.0018, addMinutes(start, 18), speedKmh, status),
  ];
}

function buildYesterdayPath(offsetLat, offsetLng, speedKmh, status) {
  const start = addDays(new Date(), -1);
  start.setHours(17, 0, 0, 0);

  return [
    buildPoint(DEMO_CENTER.latitude + offsetLat - 0.0004, DEMO_CENTER.longitude + offsetLng - 0.0012, start, speedKmh, status),
    buildPoint(DEMO_CENTER.latitude + offsetLat + 0.0003, DEMO_CENTER.longitude + offsetLng - 0.0004, addMinutes(start, 12), speedKmh, status),
    buildPoint(DEMO_CENTER.latitude + offsetLat + 0.0011, DEMO_CENTER.longitude + offsetLng + 0.0007, addMinutes(start, 23), speedKmh, status),
  ];
}

function buildHistoryDoc(uid, displayName, initials, docId, points, startedAt) {
  return {
    id: docId,
    payload: {
      uid,
      displayName,
      initials,
      dayKey: startedAt.toISOString().slice(0, 10),
      startedAt: Timestamp.fromDate(startedAt),
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(addDays(startedAt, 21)),
      points,
    },
  };
}

function buildMessage(text, senderId, senderName, senderInitials, createdAt) {
  return {
    text,
    senderId,
    senderName,
    senderInitials,
    createdAt: Timestamp.fromDate(createdAt),
  };
}

export async function seedDemoSocialData() {
  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error('Ban can dang nhap truoc khi tao du lieu demo.');
  }

  const currentUserName =
    currentUser.displayName || currentUser.email?.split('@')[0] || 'Ban';

  await setDoc(
    doc(db, 'users', currentUser.uid),
    {
      name: currentUserName,
      email: currentUser.email || 'current.user@geolink.app',
      phone: '0900000000',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=0F172A&color=FFFFFF&size=256`,
      createdAt: new Date().toISOString(),
      isGhostMode: false,
      batteryLevel: 96,
      speed: 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  for (const demoUser of DEMO_USERS) {
    await setDoc(
      doc(db, 'users', demoUser.id),
      {
        name: demoUser.name,
        email: demoUser.email,
        phone: demoUser.phone,
        avatarUrl: demoUser.avatarUrl,
        createdAt: new Date().toISOString(),
        isGhostMode: demoUser.isGhostMode,
        batteryLevel: demoUser.batteryLevel,
        speed: demoUser.speed,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  for (const demoUser of DEMO_USERS.slice(0, 3)) {
    const friendshipId = FriendUser.generateId(currentUser.uid, demoUser.id);
    const [userId1, userId2] = [currentUser.uid, demoUser.id].sort();
    await setDoc(
      doc(db, 'friendships', friendshipId),
      {
        userId1,
        userId2,
        status: 'accepted',
        requestSentBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const pendingId = FriendUser.generateId(currentUser.uid, 'mock_mai');
  const [pendingUserId1, pendingUserId2] = [currentUser.uid, 'mock_mai'].sort();
  await setDoc(
    doc(db, 'friendships', pendingId),
    {
      userId1: pendingUserId1,
      userId2: pendingUserId2,
      status: 'pending',
      requestSentBy: 'mock_mai',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, 'groups', 'demo_group_core'),
    {
      name: 'GeoLink Demo Team',
      creatorId: currentUser.uid,
      members: [currentUser.uid, 'mock_hung', 'mock_tu'],
      avatarUrl: null,
      lastMessage: 'Hen gap nhau o map luc 8h toi',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, 'groups', 'demo_group_week3'),
    {
      name: 'Footprint Testers',
      creatorId: currentUser.uid,
      members: [currentUser.uid, 'mock_hung', 'mock_linh'],
      avatarUrl: null,
      lastMessage: 'Da bat footprint va polyline',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  const groupVisibilityPairs = [
    [currentUser.uid, 'mock_hung'],
    [currentUser.uid, 'mock_tu'],
    [currentUser.uid, 'mock_linh'],
    ['mock_hung', 'mock_tu'],
    ['mock_hung', 'mock_linh'],
  ];

  for (const [sourceId, targetId] of groupVisibilityPairs) {
    await setDoc(
      doc(db, 'groups_visibility', `${sourceId}_${targetId}`),
      {
        sourceId,
        targetId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const realtimeLocations = [
    {
      uid: 'mock_hung',
      displayName: 'Hung Map',
      initials: 'HM',
      avatarUrl: 'https://i.pravatar.cc/300?img=12',
      latitude: DEMO_CENTER.latitude + 0.0028,
      longitude: DEMO_CENTER.longitude + 0.0011,
      speed: 1.05,
      speedKmh: 3.8,
      status: 'dang chay',
      batteryLevel: 87,
    },
    {
      uid: 'mock_tu',
      displayName: 'Tu Social',
      initials: 'TS',
      avatarUrl: 'https://i.pravatar.cc/300?img=24',
      latitude: DEMO_CENTER.latitude - 0.0011,
      longitude: DEMO_CENTER.longitude + 0.0023,
      speed: 0.34,
      speedKmh: 1.2,
      status: 'dang di chuyen',
      batteryLevel: 74,
    },
    {
      uid: 'mock_linh',
      displayName: 'Linh Designer',
      initials: 'LD',
      avatarUrl: 'https://i.pravatar.cc/300?img=32',
      latitude: DEMO_CENTER.latitude + 0.0008,
      longitude: DEMO_CENTER.longitude - 0.0019,
      speed: 0,
      speedKmh: 0,
      status: 'dung yen',
      batteryLevel: 63,
    },
  ];

  for (const location of realtimeLocations) {
    await set(ref(rtdb, `locations/${location.uid}`), {
      ...location,
      accuracy: 6,
      altitude: null,
      heading: 0,
      updatedAt: Date.now(),
    });
  }

  await set(ref(rtdb, `location_visibility/${currentUser.uid}`), {
    [currentUser.uid]: true,
    mock_hung: true,
    mock_tu: true,
    mock_linh: true,
  });

  const today = new Date();
  today.setHours(8, 10, 0, 0);
  const yesterday = addDays(today, -1);

  const historyDocs = [
    buildHistoryDoc(
      'mock_hung',
      'Hung Map',
      'HM',
      'demo_history_hung_today',
      buildTodayPath(0.001, 0.0002, 3.8, 'dang chay'),
      today
    ),
    buildHistoryDoc(
      'mock_tu',
      'Tu Social',
      'TS',
      'demo_history_tu_today',
      buildTodayPath(-0.0014, 0.0014, 1.2, 'dang di chuyen'),
      today
    ),
    buildHistoryDoc(
      'mock_linh',
      'Linh Designer',
      'LD',
      'demo_history_linh_yesterday',
      buildYesterdayPath(0.0005, -0.0008, 0.6, 'dung yen'),
      yesterday
    ),
  ];

  for (const historyDoc of historyDocs) {
    await setDoc(doc(db, 'locations_history', historyDoc.id), historyDoc.payload, {
      merge: true,
    });
  }

  const messageStart = new Date();
  messageStart.setHours(19, 30, 0, 0);

  const groupMessages = [
    {
      groupId: 'demo_group_core',
      docId: 'demo_message_1',
      payload: buildMessage(
        'I am on the way to the meetup point.',
        'mock_hung',
        'Hung Map',
        'HM',
        messageStart
      ),
    },
    {
      groupId: 'demo_group_core',
      docId: 'demo_message_2',
      payload: buildMessage(
        'Perfect. I can already see your marker moving.',
        currentUser.uid,
        currentUserName,
        currentUserName.slice(0, 2).toUpperCase(),
        addMinutes(messageStart, 2)
      ),
    },
    {
      groupId: 'demo_group_week3',
      docId: 'demo_message_3',
      payload: buildMessage(
        'Trails look good. The blue polyline is visible now.',
        'mock_linh',
        'Linh Designer',
        'LD',
        addMinutes(messageStart, 4)
      ),
    },
  ];

  for (const message of groupMessages) {
    await setDoc(
      doc(db, 'groups', message.groupId, 'messages', message.docId),
      message.payload,
      { merge: true }
    );
  }

  await setDoc(
    doc(db, 'moments', 'demo_moment_hung'),
    {
      userId: 'mock_hung',
      displayName: 'Hung Map',
      avatarUrl: 'https://i.pravatar.cc/300?img=12',
      caption: 'Coffee run before the meetup.',
      imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      location: {
        latitude: DEMO_CENTER.latitude + 0.0015,
        longitude: DEMO_CENTER.longitude + 0.0014,
      },
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(addMinutes(new Date(), 24 * 60)),
    },
    { merge: true }
  );

  return {
    createdUsers: DEMO_USERS.map((user) => user.email),
    createdGroups: ['GeoLink Demo Team', 'Footprint Testers'],
    note:
      'Day la mock profile trong Firestore/RTDB de test UI va map. Chung khong phai tai khoan Firebase Auth dang nhap duoc.',
  };
}
