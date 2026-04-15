import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MapView, { AnimatedRegion, Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import {
  Camera,
  Gift,
  ImagePlus,
  MessageCircle,
  Navigation,
  Settings2,
} from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { useLocation } from '../../../core/hooks/useLocation';
import { useVisibilityScope } from '../../../core/hooks/useVisibilityScope';
import { locationService } from '../../../infrastructure/firebase/locationService';
import { momentService } from '../../../infrastructure/firebase/momentService';
import { SocialMapMarker } from '../../components/map/SocialMapMarker';
import { SelectedUserSheet } from '../../components/map/SelectedUserSheet';
import { MomentViewerModal } from '../../components/map/MomentViewerModal';
import { COLORS, SHADOW } from '../../theme';

const PATH_COLORS = [COLORS.accent, COLORS.pink, COLORS.purple, COLORS.green, COLORS.yellow];

function buildAnimatedRegion(coords) {
  return new AnimatedRegion({
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
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
  const interactionAnim = useRef(new Animated.Value(0)).current;

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
  const [incomingInteraction, setIncomingInteraction] = useState(null);
  const [showMyCard, setShowMyCard] = useState(false);
  const [selectedFriendUid, setSelectedFriendUid] = useState(null);

  const coords = location?.coords ?? null;
  const currentName =
    currentProfile?.name ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split('@')[0] ||
    'You';
  const currentAvatar = currentProfile?.avatarUrl || auth.currentUser?.photoURL || null;

  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

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
    if (!coords) return;

    import('expo-location')
      .then(({ reverseGeocodeAsync }) =>
        reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      )
      .then((results) => {
        const place = results?.[0];
        if (place) {
          setCityName(place.city || place.district || place.region || 'Your city');
        }
      })
      .catch(() => {});
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    if (!coords) return;
    locationService.pushLocation(location);
  }, [coords?.latitude, coords?.longitude, location]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToAllLocations((payload) => {
      setOtherUsers((previous) => {
        const nextUsers = {};

        Object.entries(payload).forEach(([uid, user]) => {
          if (!visibleUserIds.has(uid) || user.isGhostMode) {
            return;
          }

          nextUsers[uid] = previous[uid] ? { ...previous[uid], ...user } : user;

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
        zoom: 16.1,
      },
      { duration: 800 }
    );
  }, [coords?.latitude, coords?.longitude, followCurrentUser]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToInteractions((interactions) => {
      if (!interactions?.length) return;
      const latest = interactions[interactions.length - 1];
      setIncomingInteraction(latest);
      interactionAnim.setValue(0);
      Animated.sequence([
        Animated.spring(interactionAnim, { toValue: 1, useNativeDriver: true, tension: 80 }),
        Animated.delay(1600),
        Animated.timing(interactionAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => setIncomingInteraction(null));
    });
    return () => unsubscribe();
  }, [interactionAnim]);

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
    setSelectedFriendUid(uid);
    setSelectedUser({ uid, ...user });
    setShowMyCard(false);

    mapRef.current?.animateCamera(
      {
        center: {
          latitude: user.latitude - 0.00055,
          longitude: user.longitude,
        },
        zoom: 17.1,
        pitch: 18,
        heading: 0,
        altitude: 420,
      },
      { duration: 950 }
    );
  };

  const centerOnMe = () => {
    if (!coords || !mapRef.current) return;
    setFollowCurrentUser(true);
    setSelectedUser(null);
    setSelectedFriendUid(null);
    setShowMyCard(true);
    mapRef.current.animateCamera(
      {
        center: {
          latitude: coords.latitude - 0.00045,
          longitude: coords.longitude,
        },
        zoom: 16.8,
        pitch: 12,
        heading: 0,
        altitude: 460,
      },
      { duration: 900 }
    );
  };

  const handleShareMoment = async (mode) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo access to share a live moment.');
        return;
      }

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

      if (result.canceled || !result.assets?.[0]?.uri || !coords) {
        return;
      }

      await momentService.createMoment({
        localUri: result.assets[0].uri,
        location,
      });

      Alert.alert('Shared', 'Your moment is now visible on the map.');
    } catch (error) {
      Alert.alert('Upload failed', error.message || 'Could not share this moment.');
    }
  };

  const openMomentPicker = () => {
    Alert.alert('Share a moment', 'Choose how you want to post it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: () => handleShareMoment('camera') },
      { text: 'Library', onPress: () => handleShareMoment('library') },
    ]);
  };

  if (isLoading || !coords) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIconWrap}>
          <Navigation color={COLORS.accent} size={32} />
        </View>
        <Text style={styles.loadingTitle}>Finding your live location...</Text>
        <Text style={styles.loadingHint}>
          {errorMsg || 'Turn on GPS and grant location permission so the map can update.'}
        </Text>
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
        onPress={() => {
          setSelectedUser(null);
          setShowMyCard(false);
          setSelectedFriendUid(null);
        }}
      >
        <Marker
          coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1000}
          onPress={() => {
            setSelectedUser(null);
            setShowMyCard((current) => !current);
            setSelectedFriendUid(null);
            setFollowCurrentUser(true);
          }}
        >
          <SocialMapMarker
            name={currentName}
            avatarUrl={currentAvatar}
            speedKmh={location?.meta?.speedKmh}
            batteryLevel={location?.meta?.batteryLevel}
            lastUpdatedAt={Date.now()}
            bubbleAccent={[COLORS.me, COLORS.accent, COLORS.purple]}
            showSpeed
            isMe
          />
        </Marker>

        {showFootprints
          ? footprints.map((path, index) => (
              <Polyline
                key={`${path.uid}-${historyFilter}`}
                coordinates={path.coordinates}
                strokeColor={PATH_COLORS[index % PATH_COLORS.length]}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            ))
          : null}

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
                bubbleAccent={['#FDE68A', '#FDBA74', '#F9A8D4']}
                isSelected={selectedFriendUid === uid}
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

      <LinearGradient
        colors={['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.cityBlock}>
          <Text style={styles.cityEyebrow}>friend map</Text>
          <Text style={styles.cityTitle}>{cityName}</Text>
          <Text style={styles.citySubtitle}>Live circles, avatar pins and shared moments</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Profile')}>
          <Settings2 color={COLORS.textPrimary} size={20} />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.editorialStrip}>
        <View style={styles.editorialPill}>
          <Text style={styles.editorialValue}>{friendCount || onlineUsers.length}</Text>
          <Text style={styles.editorialLabel}>live friends</Text>
        </View>
        <View style={styles.editorialPill}>
          <Text style={[styles.editorialValue, { color: COLORS.pink }]}>{visibleMoments.length}</Text>
          <Text style={styles.editorialLabel}>moments</Text>
        </View>
        <View style={[styles.editorialPill, styles.editorialPillSoft]}>
          <Text style={styles.editorialHint}>{selectedFriendUid ? 'friend focus' : followCurrentUser ? 'camera live' : 'map free'}</Text>
        </View>
      </View>

      <View style={styles.rightRail}>
        <TouchableOpacity style={styles.railButton} onPress={() => navigation.navigate('GiftCenter')}>
          <Gift color={COLORS.orange} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.railButton} onPress={() => navigation.navigate('Chats')}>
          <MessageCircle color={COLORS.pink} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.railButton} onPress={() => handleShareMoment('library')}>
          <ImagePlus color={COLORS.yellow} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.railButton, styles.railButtonActive]} onPress={() => handleShareMoment('camera')}>
          <Camera color={COLORS.white} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterDock}>
        <TouchableOpacity
          style={[styles.filterCard, showFootprints && styles.filterCardActive]}
          onPress={() => setShowFootprints((current) => !current)}
        >
          <Text style={[styles.filterLabel, showFootprints && styles.filterLabelActive]}>
            {showFootprints ? 'Trail on' : 'Trail off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.followCard,
            followCurrentUser
              ? { backgroundColor: COLORS.accent, borderColor: COLORS.accent }
              : { backgroundColor: 'rgba(255,255,255,0.96)', borderColor: COLORS.border },
          ]}
          onPress={centerOnMe}
        >
          <Navigation color={followCurrentUser ? COLORS.white : COLORS.accent} size={18} />
          <Text style={[styles.followText, followCurrentUser && { color: COLORS.white }]}>
            {followCurrentUser ? 'Following you' : 'Center on me'}
          </Text>
        </TouchableOpacity>
      </View>

      {showMyCard ? (
        <View style={styles.myCard}>
          <Text style={styles.myCardKicker}>you are here</Text>
          <Text style={styles.myCardTitle}>{currentName}</Text>
          <View style={styles.myCardMetrics}>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>{Math.max(Number(location?.meta?.speedKmh || 0), 0).toFixed(0)}</Text>
              <Text style={styles.myMetricLabel}>km/h</Text>
            </View>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>{Math.max(Number(location?.meta?.batteryLevel || 0), 0).toFixed(0)}%</Text>
              <Text style={styles.myMetricLabel}>battery</Text>
            </View>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>{followCurrentUser ? 'Live' : 'Free'}</Text>
              <Text style={styles.myMetricLabel}>camera</Text>
            </View>
          </View>
        </View>
      ) : null}

      <SelectedUserSheet
        user={selectedUser}
        onClose={() => {
          setSelectedUser(null);
          setSelectedFriendUid(null);
        }}
        onChat={() => navigation.navigate('Chats')}
        onInteract={(emoji) => {
          if (selectedUser?.uid) {
            locationService.pushInteraction(selectedUser.uid, emoji);
          }
        }}
      />

      <MomentViewerModal moment={selectedMoment} onClose={() => setSelectedMoment(null)} />

      {incomingInteraction ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.interactionOverlay,
            {
              opacity: interactionAnim,
              transform: [
                {
                  scale: interactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.interactionEmoji}>{incomingInteraction.emoji}</Text>
          <Text style={styles.interactionLabel}>A friend reacted to you</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  loadingHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 190,
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
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  cityBlock: {
    maxWidth: 250,
  },
  cityEyebrow: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cityTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.1,
    textTransform: 'capitalize',
  },
  citySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  settingsButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  topStats: {
  },
  editorialStrip: {
    position: 'absolute',
    top: 144,
    left: 18,
    right: 96,
    zIndex: 35,
    flexDirection: 'row',
    gap: 10,
  },
  editorialPill: {
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...SHADOW.card,
  },
  editorialPillSoft: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderColor: 'rgba(15,23,42,0.06)',
  },
  editorialValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  editorialLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  editorialHint: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rightRail: {
    position: 'absolute',
    right: 18,
    top: 190,
    zIndex: 35,
    gap: 12,
  },
  railButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
  railButtonActive: {
    backgroundColor: COLORS.purple,
  },
  filterDock: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 110,
    zIndex: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterCard: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCardActive: {
    backgroundColor: COLORS.ink,
  },
  filterLabel: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  filterLabelActive: {
    color: COLORS.white,
  },
  followCard: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    ...SHADOW.accent,
  },
  followText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  myCard: {
    position: 'absolute',
    left: 18,
    right: 132,
    bottom: 168,
    zIndex: 34,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...SHADOW.card,
  },
  myCardKicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  myCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  myCardMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  myMetric: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  myMetricValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  myMetricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  momentPin: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    padding: 3,
    borderWidth: 2,
    borderColor: COLORS.pink,
    ...SHADOW.card,
  },
  momentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    backgroundColor: COLORS.bgSoft,
  },
  interactionOverlay: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  interactionEmoji: {
    fontSize: 28,
    color: COLORS.textPrimary,
    fontWeight: '900',
  },
  interactionLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
});
