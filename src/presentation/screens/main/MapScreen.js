import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, {
  AnimatedRegion,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Camera, ImagePlus, MessageCircle, Settings2, Users } from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { useLocation } from '../../../core/hooks/useLocation';
import { useVisibilityScope } from '../../../core/hooks/useVisibilityScope';
import { locationService } from '../../../infrastructure/firebase/locationService';
import { momentService } from '../../../infrastructure/firebase/momentService';
import { SocialMapMarker } from '../../components/map/SocialMapMarker';
import { SelectedUserSheet } from '../../components/map/SelectedUserSheet';
import { MomentViewerModal } from '../../components/map/MomentViewerModal';

const FILTERS = [
  { key: 'today', label: 'NOW' },
  { key: 'yesterday', label: 'BEFORE' },
];

const PATH_COLORS = ['#1D4ED8', '#F472B6', '#22C55E', '#F59E0B', '#A78BFA'];

function buildAnimatedRegion(coords) {
  return new AnimatedRegion({
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
}

function formatStatus(status = 'dung yen') {
  if (status === 'dang chay') {
    return 'running';
  }
  if (status === 'dang di chuyen') {
    return 'moving';
  }
  return 'still';
}

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'You'
  )}&background=111827&color=FFFFFF&size=256`;
}

function getMomentCoordinates(moment) {
  const latitude = Number(moment?.location?.latitude);
  const longitude = Number(moment?.location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export default function MapScreen({ navigation }) {
  const { location, isLoading, errorMsg } = useLocation();
  const visibleUserIds = useVisibilityScope();
  const mapRef = useRef(null);
  const animatedMarkersRef = useRef({});
  const fitTimeoutRef = useRef(null);

  const [otherUsers, setOtherUsers] = useState({});
  const [currentProfile, setCurrentProfile] = useState(null);
  const [cityName, setCityName] = useState('Your city');
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('today');
  const [showFootprints, setShowFootprints] = useState(true);
  const [footprints, setFootprints] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [moments, setMoments] = useState([]);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [followCurrentUser, setFollowCurrentUser] = useState(true);

  const coords = location?.coords ?? null;
  const currentUid = auth.currentUser?.uid;
  const currentName =
    currentProfile?.name ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split('@')[0] ||
    'You';
  const currentAvatar = currentProfile?.avatarUrl || auth.currentUser?.photoURL || null;

  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      const userSnapshot = await getDoc(doc(db, 'users', uid));
      if (userSnapshot.exists()) {
        setCurrentProfile(userSnapshot.data());
      }

      const friendshipsSnapshot = await getDocs(
        query(collection(db, 'friendships'), where('status', '==', 'accepted'))
      );

      const totalFriends = friendshipsSnapshot.docs.filter((entry) => {
        const data = entry.data();
        return data.userId1 === uid || data.userId2 === uid;
      }).length;

      setFriendCount(totalFriends);
      await locationService.syncLocationVisibility().catch(() => {});
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!coords) {
      return;
    }

    import('expo-location')
      .then(({ reverseGeocodeAsync }) =>
        reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      )
      .then((results) => {
        if (results?.[0]) {
          const place = results[0];
          setCityName(place.city || place.district || place.region || 'Your city');
        }
      })
      .catch(() => {});
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    if (!coords) {
      return;
    }

    locationService.pushLocation(location);
  }, [location, coords?.latitude, coords?.longitude]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToAllLocations((payload) => {
      setOtherUsers((previous) => {
        const nextUsers = {};

        Object.entries(payload).forEach(([uid, user]) => {
          if (!visibleUserIds.has(uid) || user.isGhostMode) {
            return;
          }

          nextUsers[uid] = previous[uid]
            ? { ...previous[uid], ...user }
            : user;

          const nextCoordinate = {
            latitude: user.latitude,
            longitude: user.longitude,
          };

          const existingMarker = animatedMarkersRef.current[uid];
          if (!existingMarker) {
            animatedMarkersRef.current[uid] = buildAnimatedRegion(nextCoordinate);
          } else {
            existingMarker.timing({
              ...nextCoordinate,
              duration: 850,
              useNativeDriver: false,
            }).start();
          }
        });

        return nextUsers;
      });
    });

    return () => unsubscribe();
  }, [visibleUserIds]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToHistory(historyFilter, (paths) => {
      setFootprints(paths.filter((path) => visibleUserIds.has(path.uid)));
    });

    return () => unsubscribe();
  }, [historyFilter, visibleUserIds]);

  useEffect(() => {
    const unsubscribe = momentService.subscribeToRecentMoments((items) => {
      setMoments(items.filter((item) => visibleUserIds.has(item.userId)));
    });

    return () => unsubscribe();
  }, [visibleUserIds]);

  useEffect(() => {
    if (!coords || !mapRef.current || !followCurrentUser) {
      return;
    }

    mapRef.current.animateCamera(
      {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        zoom: 16.2,
      },
      { duration: 900 }
    );
  }, [coords?.latitude, coords?.longitude, followCurrentUser]);

  useEffect(() => {
    if (!mapRef.current || !coords) {
      return;
    }

    const coordinates = [
      { latitude: coords.latitude, longitude: coords.longitude },
      ...Object.values(otherUsers).map((user) => ({
        latitude: user.latitude,
        longitude: user.longitude,
      })),
    ];

    if (coordinates.length < 2) {
      return;
    }

    clearTimeout(fitTimeoutRef.current);
    fitTimeoutRef.current = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 180, right: 72, bottom: 250, left: 72 },
        animated: true,
      });
    }, 600);

    return () => clearTimeout(fitTimeoutRef.current);
  }, [coords?.latitude, coords?.longitude, Object.keys(otherUsers).join('|')]);

  useEffect(() => {
    return () => {
      locationService.flushHistoryBuffer();
    };
  }, []);

  const onlineUsers = useMemo(() => Object.entries(otherUsers), [otherUsers]);
  const visibleMoments = useMemo(
    () => moments.filter((moment) => getMomentCoordinates(moment)),
    [moments]
  );

  const focusFriend = (uid, user) => {
    setFollowCurrentUser(false);
    setSelectedUser({
      uid,
      ...user,
      statusLabel: formatStatus(user.status),
    });

    mapRef.current?.animateCamera(
      {
        center: {
          latitude: user.latitude,
          longitude: user.longitude,
        },
        zoom: 16.4,
      },
      { duration: 700 }
    );
  };

  const centerOnMe = () => {
    if (!coords || !mapRef.current) {
      return;
    }

    setFollowCurrentUser(true);
    setSelectedUser(null);
    mapRef.current.animateCamera(
      {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        zoom: 16.5,
      },
      { duration: 700 }
    );
  };

  const handleShareMoment = async (mode) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to share moments.');
        return;
      }

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.[0]?.uri || !coords) {
        return;
      }

      await momentService.createMoment({
        localUri: result.assets[0].uri,
        location,
      });

      Alert.alert('Moment shared', 'Your new moment is now visible on the map.');
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Could not share this moment.');
    }
  };

  const openMomentPicker = () => {
    Alert.alert('Share a moment', 'Choose how you want to add a map moment.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => handleShareMoment('camera') },
      { text: 'Library', onPress: () => handleShareMoment('library') },
    ]);
  };

  if (isLoading || !coords) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Finding your live location...</Text>
        {!!errorMsg && <Text style={styles.loadingHint}>{errorMsg}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        onPress={() => setSelectedUser(null)}
      >
        <Marker
          coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1000}
        >
          <SocialMapMarker
            name={currentName}
            avatarUrl={currentAvatar}
            speedKmh={location?.meta?.speedKmh}
            lastUpdatedAt={Date.now()}
            bubbleAccent={['#60A5FA', '#C084FC', '#F9A8D4']}
            showSpeed
          />
        </Marker>

        {showFootprints &&
          footprints.map((path, index) => (
            <Polyline
              key={`${path.uid}-${historyFilter}`}
              coordinates={path.coordinates}
              strokeColor={PATH_COLORS[index % PATH_COLORS.length]}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}

        {onlineUsers.map(([uid, user]) => {
          const animatedCoordinate =
            animatedMarkersRef.current[uid] ||
            buildAnimatedRegion({
              latitude: user.latitude,
              longitude: user.longitude,
            });

          if (!animatedMarkersRef.current[uid]) {
            animatedMarkersRef.current[uid] = animatedCoordinate;
          }

          return (
            <Marker.Animated
              key={uid}
              coordinate={animatedCoordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={900}
              onPress={() => focusFriend(uid, user)}
            >
              <SocialMapMarker
                name={user.displayName || 'Friend'}
                avatarUrl={user.avatarUrl}
                speedKmh={user.speedKmh}
                batteryLevel={user.batteryLevel}
                stationarySince={user.stationarySince}
                lastUpdatedAt={user.updatedAt}
                isGhostMode={user.isGhostMode}
                bubbleAccent={['#FDE68A', '#F9A8D4', '#C4B5FD']}
              />
            </Marker.Animated>
          );
        })}

        {visibleMoments.map((moment) => {
          const point = getMomentCoordinates(moment);
          return (
            <Marker
              key={moment.id}
              coordinate={point}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              onPress={() => setSelectedMoment(moment)}
            >
              <View style={styles.momentPin}>
                <Image source={{ uri: moment.imageUrl }} style={styles.momentImage} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.header}>
        <View>
          <Text style={styles.cityTitle}>{cityName}</Text>
          <View style={styles.cityUnderline} />
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Profile')}>
          <Settings2 color="#111111" size={20} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.topStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{friendCount || onlineUsers.length}</Text>
          <Text style={styles.statLabel}>friends</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{visibleMoments.length}</Text>
          <Text style={styles.statLabel}>moments</Text>
        </View>
      </View>

      <View style={styles.rightRail}>
        <TouchableOpacity style={styles.railButton} onPress={() => navigation.navigate('Friends')}>
          <Users color="#111111" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.railButton} onPress={() => navigation.navigate('Chats')}>
          <MessageCircle color="#111111" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.railButton} onPress={openMomentPicker}>
          <ImagePlus color="#111111" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.railButton} onPress={() => setShowFootprints((current) => !current)}>
          <Camera color="#111111" size={18} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroFog}
        pointerEvents="none"
      />

      <View style={styles.filterDock}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterCard, historyFilter === filter.key && styles.filterCardActive]}
            onPress={() => setHistoryFilter(filter.key)}
          >
            <Text style={[styles.filterTime, historyFilter === filter.key && styles.filterTextActive]}>
              {filter.key === 'today' ? '17:16' : '20:05'}
            </Text>
            <Text style={[styles.filterLabel, historyFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.nowCard} onPress={centerOnMe}>
          <Text style={styles.nowText}>{followCurrentUser ? 'LIVE' : 'FOLLOW'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomDock}>
        <TouchableOpacity style={styles.dockButton} onPress={() => navigation.navigate('Friends')}>
          <Users color="#111111" size={19} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dockButton} onPress={() => navigation.navigate('Chats')}>
          <MessageCircle color="#111111" size={19} />
        </TouchableOpacity>
        <Pressable style={styles.meBubble} onPress={centerOnMe}>
          <Image
            source={{ uri: currentAvatar || getFallbackAvatar(currentName) }}
            style={styles.meBubbleImage}
          />
        </Pressable>
      </View>

      <SelectedUserSheet
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onChat={() => navigation.navigate('Chats')}
      />

      <MomentViewerModal moment={selectedMoment} onClose={() => setSelectedMoment(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  loadingHint: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cityTitle: {
    color: '#F8FAFC',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cityUnderline: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
    marginTop: 6,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  topStats: {
    position: 'absolute',
    top: 118,
    left: 20,
    zIndex: 35,
    gap: 10,
  },
  statCard: {
    width: 84,
    borderRadius: 24,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  statValue: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  rightRail: {
    position: 'absolute',
    right: 18,
    top: 190,
    zIndex: 35,
    gap: 12,
  },
  railButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroFog: {
    position: 'absolute',
    top: 210,
    left: 34,
    width: 180,
    height: 180,
    borderRadius: 90,
    zIndex: 5,
  },
  filterDock: {
    position: 'absolute',
    bottom: 128,
    left: 18,
    right: 18,
    zIndex: 35,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  filterCard: {
    width: 82,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  filterCardActive: {
    backgroundColor: '#38BDF8',
    borderWidth: 0,
  },
  filterTime: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '800',
  },
  filterLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  filterTextActive: {
    color: '#0F172A',
  },
  nowCard: {
    width: 92,
    height: 94,
    borderRadius: 24,
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  nowText: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 34,
    left: 18,
    flexDirection: 'row',
    gap: 10,
    zIndex: 35,
    alignItems: 'center',
  },
  dockButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  meBubble: {
    width: 62,
    height: 62,
    borderRadius: 20,
    padding: 3,
    backgroundColor: '#38BDF8',
    marginLeft: 6,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  meBubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#0F172A',
  },
  momentPin: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    padding: 3,
    borderWidth: 2,
    borderColor: '#F472B6',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  momentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: '#334155',
  },
});
