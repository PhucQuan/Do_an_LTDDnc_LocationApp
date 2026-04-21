import { useEffect, useMemo, useState } from 'react';

const MAX_TRAIL_POINTS = 18;

const MOCK_PROFILES = [
  {
    uid: 'mock-001',
    displayName: 'Nguyen Minh Khoa',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Khoa&size=128&backgroundColor=b6e3f4',
    batteryLevel: 78,
    status: 'moving',
    speedKmh: 12.4,
    note: 'Dang tren duong den lop',
  },
  {
    uid: 'mock-002',
    displayName: 'Tran Thi Mai',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Mai&size=128&backgroundColor=ffdfbf',
    batteryLevel: 42,
    status: 'still',
    speedKmh: 0,
    note: 'Uong ca phe ne',
  },
  {
    uid: 'mock-003',
    displayName: 'Le Van Dung',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Dung&size=128&backgroundColor=c0aede',
    batteryLevel: 91,
    status: 'running',
    speedKmh: 22.1,
    note: 'Chay bo buoi sang',
  },
  {
    uid: 'mock-004',
    displayName: 'Pham Hong Nhung',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Nhung&size=128&backgroundColor=ffd5dc',
    batteryLevel: 15,
    status: 'still',
    speedKmh: 0,
    stationarySince: Date.now() - 1000 * 60 * 25,
    note: 'Ngu ti...',
  },
  {
    uid: 'mock-005',
    displayName: 'Vu Quang Huy',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Huy&size=128&backgroundColor=d1f4e0',
    batteryLevel: 63,
    status: 'moving',
    speedKmh: 6.8,
    note: 'Nghe nhac hay qua',
  },
  {
    uid: 'mock-006',
    displayName: 'Dang Thi Thu',
    avatarUrl: 'https://api.dicebear.com/8.x/notionists/png?seed=Thu&size=128&backgroundColor=ffe4c8',
    batteryLevel: 55,
    status: 'still',
    speedKmh: 0,
    note: 'On thi day',
  },
];

const OFFSETS = [
  { dlat: 0.003, dlng: 0.001 },
  { dlat: -0.002, dlng: 0.004 },
  { dlat: 0.005, dlng: -0.003 },
  { dlat: -0.004, dlng: -0.002 },
  { dlat: 0.001, dlng: 0.006 },
  { dlat: -0.006, dlng: 0.003 },
];

const MOVE_SPEEDS = [0.000035, 0, 0.000055, 0, 0.000022, 0];
const MOVE_DIRS = [
  { dlat: 0.7, dlng: 0.3 },
  { dlat: 0, dlng: 0 },
  { dlat: -0.5, dlng: 0.6 },
  { dlat: 0, dlng: 0 },
  { dlat: 0.4, dlng: -0.8 },
  { dlat: 0, dlng: 0 },
];

function buildInitialState(myLat, myLng) {
  const now = Date.now();

  return MOCK_PROFILES.reduce((accumulator, profile, index) => {
    const latitude = myLat + OFFSETS[index].dlat;
    const longitude = myLng + OFFSETS[index].dlng;

    accumulator[profile.uid] = {
      profile: {
        ...profile,
        latitude,
        longitude,
        updatedAt: now,
        noteAt: now,
        isGhostMode: false,
      },
      trail: [{ latitude, longitude, capturedAt: now }],
    };

    return accumulator;
  }, {});
}

export function useMockFriends(myLat, myLng, enabled = true) {
  const [state, setState] = useState(() => buildInitialState(myLat, myLng));

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    setState(buildInitialState(myLat, myLng));
    return undefined;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      setState((currentState) =>
        Object.entries(currentState).reduce((nextState, [uid, entry], index) => {
          const speed = MOVE_SPEEDS[index];
          const direction = MOVE_DIRS[index];
          const previousProfile = entry.profile;
          const latitude = speed === 0 ? previousProfile.latitude : previousProfile.latitude + direction.dlat * speed;
          const longitude = speed === 0 ? previousProfile.longitude : previousProfile.longitude + direction.dlng * speed;

          const nextTrailPoint = { latitude, longitude, capturedAt: now };
          nextState[uid] = {
            profile: {
              ...previousProfile,
              latitude,
              longitude,
              updatedAt: now,
            },
            trail:
              speed === 0
                ? entry.trail
                : [...entry.trail, nextTrailPoint].slice(-MAX_TRAIL_POINTS),
          };

          return nextState;
        }, {})
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [enabled]);

  return useMemo(() => {
    if (!enabled) {
      return { friends: {}, trails: [] };
    }

    const friends = {};
    const trails = [];

    Object.values(state).forEach(({ profile, trail }) => {
      friends[profile.uid] = profile;

      if (trail.length > 1) {
        trails.push({
          uid: profile.uid,
          displayName: profile.displayName,
          initials: profile.displayName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join(''),
          coordinates: trail.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            capturedAt: point.capturedAt,
          })),
        });
      }
    });

    return { friends, trails };
  }, [enabled, state]);
}
