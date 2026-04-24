import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import MapView, {
  AnimatedRegion,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Camera,
  Gift,
  Globe,
  MessageCircle,
  Navigation,
  Settings2,
  UserPlus,
} from "lucide-react-native";
import { auth, db } from "../../../infrastructure/firebase/firebase";
import { avatarMigrationService } from "../../../infrastructure/firebase/avatarMigrationService";
import { useLocation } from "../../../core/hooks/useLocation";
import { useVisibilityScope } from "../../../core/hooks/useVisibilityScope";
import { locationService } from "../../../infrastructure/firebase/locationService";
import { momentService } from "../../../infrastructure/firebase/momentService";
import { SocialMapMarker } from "../../components/map/SocialMapMarker";
import { SelectedUserSheet } from "../../components/map/SelectedUserSheet";
import { MomentViewerModal } from "../../components/map/MomentViewerModal";
import { NoteInputModal } from "../../components/map/NoteInputModal";
import { StickerReactionPicker } from "../../components/map/StickerReactionPicker";
import { ReactionAnimation } from "../../components/map/ReactionAnimation";
import { GlobeView } from "../../components/map/GlobeView";
import { useMapCamera } from "../../components/map/MapCameraController";
import { MAP_STYLE } from "../../theme/mapStyle";
import { useMockFriends } from "../../utils/mockFriends";
import { COLORS, LAYOUT, SHADOW, SPACING } from "../../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PATH_COLORS = [
  COLORS.accent,
  COLORS.pink,
  COLORS.purple,
  COLORS.green,
  COLORS.yellow,
];
const MAX_LIVE_TRAIL_POINTS = 24;
const FRIEND_TRAIL_DISTANCE_THRESHOLD = 0.00006;

function getTrailDelta(lastPoint, nextPoint) {
  if (!lastPoint || !nextPoint) {
    return Infinity;
  }
  return Math.max(
    Math.abs(lastPoint.latitude - nextPoint.latitude),
    Math.abs(lastPoint.longitude - nextPoint.longitude),
  );
}

function appendTrailPoint(
  existingTrail,
  nextPoint,
  threshold = FRIEND_TRAIL_DISTANCE_THRESHOLD,
) {
  const lastPoint = existingTrail[existingTrail.length - 1];
  if (getTrailDelta(lastPoint, nextPoint) < threshold) {
    return existingTrail;
  }
  return [...existingTrail, nextPoint].slice(-MAX_LIVE_TRAIL_POINTS);
}

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
  const cameraController = useMapCamera(mapRef);
  const animatedMarkersRef = useRef({});
  const interactionAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const [otherUsers, setOtherUsers] = useState({});
  const [friendProfiles, setFriendProfiles] = useState({});
  const [currentProfile, setCurrentProfile] = useState(null);
  const [cityName, setCityName] = useState("Your city");
  const [selectedUser, setSelectedUser] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("today");
  const [showFootprints, setShowFootprints] = useState(true);
  const [footprints, setFootprints] = useState([]);
  const [friendCount, setFriendCount] = useState(0);
  const [moments, setMoments] = useState([]);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [followCurrentUser, setFollowCurrentUser] = useState(true);
  const [incomingInteraction, setIncomingInteraction] = useState(null);
  const [showMyCard, setShowMyCard] = useState(false);
  const [selectedFriendUid, setSelectedFriendUid] = useState(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [myNote, setMyNote] = useState(null);
  const [myNoteAt, setMyNoteAt] = useState(null);
  const [localTrail, setLocalTrail] = useState([]);
  const [friendTrails, setFriendTrails] = useState({});
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [markerLoaded, setMarkerLoaded] = useState({});
  const [stickerTarget, setStickerTarget] = useState(null);
  const [activeReaction, setActiveReaction] = useState(null);
  const [showGlobe, setShowGlobe] = useState(false);
  const [showMomentsSheet, setShowMomentsSheet] = useState(false);
  const momentsSheetAnim = useRef(new Animated.Value(0)).current;

  const routeParams =
    navigation.getState()?.routes?.find((r) => r.name === "Map")?.params ?? {};
  const focusUid = routeParams?.focusUid;

  useEffect(() => {
    if (!focusUid) return;
    const timer = setTimeout(() => {
      const user = otherUsers[focusUid];
      if (user) {
        focusFriend(focusUid, user);
      }
      const mapRoute = navigation
        .getState()
        ?.routes?.find((r) => r.name === "Map");
      if (mapRoute?.params?.focusUid) {
        navigation.setParams({ focusUid: undefined });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [focusUid, otherUsers, friendProfiles]);

  const coords = location?.coords ?? null;
  const currentName =
    currentProfile?.name ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email?.split("@")[0] ||
    "You";
  const currentAvatar =
    currentProfile?.avatarUrl || auth.currentUser?.photoURL || null;
  const overlayTop = insets.top + SPACING.lg;
  const overlayBottom =
    insets.bottom + LAYOUT.tabBarBottom + LAYOUT.tabBarHeight + SPACING.md;

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const userSnapshot = await getDoc(doc(db, "users", uid));
        if (userSnapshot.exists()) {
          const nextProfile = userSnapshot.data();
          setCurrentProfile(nextProfile);

          const migratedAvatarUrl = await avatarMigrationService
            .migrateCurrentUserAvatarIfNeeded(nextProfile)
            .catch(() => null);

          if (
            migratedAvatarUrl &&
            migratedAvatarUrl !== nextProfile?.avatarUrl
          ) {
            setCurrentProfile((prev) => ({
              ...(prev || nextProfile),
              avatarUrl: migratedAvatarUrl,
            }));
          }
        }

        const realtimeState = await locationService.getMyRealtimeState();
        setMyNote(realtimeState?.note || null);
        setMyNoteAt(realtimeState?.noteAt || null);

        const friendshipsSnapshot = await getDocs(
          query(
            collection(db, "friendships"),
            where("status", "==", "accepted"),
          ),
        );
        const totalFriends = friendshipsSnapshot.docs.filter((entry) => {
          const data = entry.data();
          return data.userId1 === uid || data.userId2 === uid;
        }).length;
        setFriendCount(totalFriends);

        await locationService.syncLocationVisibility().catch(() => {});
      };
      loadProfile();
    }, []),
  );

  useEffect(() => {
    if (!coords) return;
    import("expo-location")
      .then(({ reverseGeocodeAsync }) =>
        reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      )
      .then((results) => {
        const place = results?.[0];
        if (place) {
          setCityName(
            place.city || place.district || place.region || "Your city",
          );
        }
      })
      .catch(() => {});
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    if (!coords) return;
    locationService.pushLocation(location);
  }, [coords?.latitude, coords?.longitude, location]);

  useEffect(() => {
    if (!coords) {
      return;
    }
    const nextPoint = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      capturedAt: Date.now(),
    };
    setLocalTrail((currentTrail) => {
      return appendTrailPoint(currentTrail, nextPoint, 0.00008);
    });
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToAllLocations((payload) => {
      setOtherUsers((previous) => {
        const nextUsers = {};
        const nextTrailMap = {};

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
            animatedMarkersRef.current[uid] =
              buildAnimatedRegion(nextCoordinate);
          } else {
            existingMarker
              .timing({
                ...nextCoordinate,
                duration: 850,
                useNativeDriver: false,
              })
              .start();
          }

          nextTrailMap[uid] = {
            displayName: user.displayName || "Friend",
            initials:
              user.initials ||
              (user.displayName || "F").slice(0, 1).toUpperCase(),
            nextPoint: {
              latitude: user.latitude,
              longitude: user.longitude,
              capturedAt: user.updatedAt || Date.now(),
            },
          };
        });

        setFriendTrails((previousTrails) => {
          const updatedTrails = {};
          Object.entries(nextTrailMap).forEach(([uid, trailMeta]) => {
            const existingTrail = previousTrails[uid]?.coordinates || [];
            updatedTrails[uid] = {
              uid,
              displayName: trailMeta.displayName,
              initials: trailMeta.initials,
              coordinates: appendTrailPoint(existingTrail, trailMeta.nextPoint),
            };
          });
          return updatedTrails;
        });

        return nextUsers;
      });
    });
    return () => unsubscribe();
  }, [visibleUserIds]);

  useEffect(() => {
    const loadFriendProfiles = async () => {
      const myUid = auth.currentUser?.uid;
      const ids = [...visibleUserIds].filter((uid) => uid && uid !== myUid);

      if (!ids.length) {
        setFriendProfiles({});
        return;
      }

      try {
        const snapshots = await Promise.all(
          ids.map(async (uid) => {
            const snapshot = await getDoc(doc(db, "users", uid));
            return [uid, snapshot.exists() ? snapshot.data() : null];
          }),
        );

        setFriendProfiles(
          snapshots.reduce((accumulator, [uid, profile]) => {
            if (!profile) {
              return accumulator;
            }

            accumulator[uid] = {
              displayName: profile.name || profile.displayName || null,
              avatarUrl:
                profile.avatarUrl ||
                profile.photoURL ||
                profile.photoUrl ||
                null,
            };
            return accumulator;
          }, {}),
        );
      } catch (error) {
        console.warn(
          "[MapScreen] Could not hydrate friend profiles:",
          error.message,
        );
      }
    };

    loadFriendProfiles();
  }, [visibleUserIds]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToHistory(
      historyFilter,
      (paths) => {
        setFootprints(paths.filter((path) => visibleUserIds.has(path.uid)));
      },
    );
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
      { duration: 800 },
    );
  }, [coords?.latitude, coords?.longitude, followCurrentUser]);

  useEffect(() => {
    const unsubscribe = locationService.subscribeToInteractions(
      (interactions) => {
        if (!interactions?.length) return;
        const latest = interactions[interactions.length - 1];
        setIncomingInteraction(latest);
        interactionAnim.setValue(0);
        Animated.sequence([
          Animated.spring(interactionAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
          }),
          Animated.delay(1600),
          Animated.timing(interactionAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start(() => setIncomingInteraction(null));
      },
    );
    return () => unsubscribe();
  }, [interactionAnim]);

  useEffect(() => {
    return () => {
      locationService.flushHistoryBuffer();
    };
  }, []);

  const onlineUsers = useMemo(
    () =>
      Object.entries(otherUsers).map(([uid, user]) => {
        const profile = friendProfiles[uid];
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile?.displayName || user.displayName || "Friend",
        )}&background=0f172a&color=ffffff&bold=true&size=256`;

        return [
          uid,
          {
            ...user,
            displayName: profile?.displayName || user.displayName || "Friend",
            avatarUrl: profile?.avatarUrl || user.avatarUrl || fallbackAvatar,
          },
        ];
      }),
    [friendProfiles, otherUsers],
  );

  const visibleMoments = useMemo(
    () => moments.filter((moment) => getMomentCoordinates(moment)),
    [moments],
  );

  const renderedFootprints = useMemo(() => {
    const nextFootprints = [...footprints];

    if (localTrail.length > 1) {
      nextFootprints.push({
        uid: "me-live-trail",
        displayName: currentName,
        initials: currentName.slice(0, 1).toUpperCase(),
        coordinates: localTrail,
      });
    }

    Object.values(friendTrails).forEach((trail) => {
      if (trail.coordinates.length > 1) {
        nextFootprints.push(trail);
      }
    });

    return nextFootprints;
  }, [currentName, footprints, friendTrails, localTrail]);

  const focusFriend = useCallback(async (uid, user) => {
    setFollowCurrentUser(false);
    setSelectedFriendUid(uid);

    // Try to get profile from cache first
    let profile = friendProfiles[uid];

    // If not in cache, fetch directly
    if (!profile) {
      try {
        const snapshot = await getDoc(doc(db, "users", uid));
        if (snapshot.exists()) {
          const data = snapshot.data();
          profile = {
            displayName: data.name || data.displayName || null,
            avatarUrl: data.avatarUrl || data.photoURL || data.photoUrl || null,
          };
        }
      } catch (error) {
        console.warn("[MapScreen] Could not fetch friend profile:", error.message);
      }
    }

    const enrichedUser = {
      uid,
      ...user,
      displayName: profile?.displayName || user.displayName || "Friend",
      avatarUrl: profile?.avatarUrl || user.avatarUrl || null,
    };
    setSelectedUser(enrichedUser);
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
      { duration: 950 },
    );
  }, [friendProfiles]);

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
      { duration: 900 },
    );
  };

  const handleShareMoment = async (mode) => {
    try {
      const permission =
        mode === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          mode === "camera"
            ? "Please allow camera access in Settings to share a live moment."
            : "Please allow photo access in Settings to share a live moment.",
          [{ text: "OK", style: "cancel" }],
        );
        return;
      }

      const result =
        mode === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });

      if (result.canceled || !result.assets?.[0]?.uri || !coords) {
        return;
      }

      await momentService.createMoment({
        localUri: result.assets[0].uri,
        location,
      });

      Alert.alert("Shared", "Your moment is now visible on the map.");
    } catch (error) {
      Alert.alert(
        "Upload failed",
        error.message || "Could not share this moment.",
      );
    }
  };

  const openMomentPicker = () => {
    Alert.alert("Share a moment", "Choose how you want to post it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Camera", onPress: () => handleShareMoment("camera") },
      { text: "Library", onPress: () => handleShareMoment("library") },
    ]);
  };

  const openMomentsSheet = () => {
    setShowMomentsSheet(true);
    momentsSheetAnim.setValue(0);
    Animated.spring(momentsSheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMomentsSheet = () => {
    Animated.timing(momentsSheetAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setShowMomentsSheet(false));
  };

  const handleNavigate = useCallback(() => {
    if (!selectedUser?.latitude || !selectedUser?.longitude) return;
    const { latitude, longitude } = selectedUser;
    const label = encodeURIComponent(selectedUser.displayName || "Friend");
    const url = Platform.select({
      android: `google.navigation:q=${latitude},${longitude}&labels=${label}`,
      ios: `maps://app?daddr=${latitude},${longitude}&q=${label}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      );
    });
  }, [selectedUser]);

  if (isLoading || !coords) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIconWrap}>
          <Navigation color={COLORS.accent} size={32} />
        </View>
        <Text style={styles.loadingTitle}>Finding your live location...</Text>
        <Text style={styles.loadingHint}>
          {errorMsg ||
            "Turn on GPS and grant location permission so the map can update."}
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
          latitude: coords?.latitude ?? 21.0285,
          longitude: coords?.longitude ?? 105.8542,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        customMapStyle={MAP_STYLE}
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
          coordinate={{
            latitude: coords?.latitude ?? 21.0285,
            longitude: coords?.longitude ?? 105.8542,
          }}
          anchor={{ x: 0.5, y: 0.6 }}
          zIndex={1000}
          onPress={() => {
            setSelectedUser(null);
            setShowMyCard((current) => !current);
            setSelectedFriendUid(null);
            setFollowCurrentUser(true);
            setShowNoteModal(true);
          }}
        >
          {/* Always-visible marker: blue dot + ring + avatar or initials */}
          <View style={styles.myLocationWrap}>
            {/* My note bubble */}
            {myNote &&
            myNoteAt &&
            Date.now() - myNoteAt < 24 * 60 * 60 * 1000 ? (
              <View style={styles.myMarkerNoteBubble}>
                <Text style={styles.myMarkerNoteText} numberOfLines={2}>
                  {myNote}
                </Text>
                <View style={styles.myMarkerNoteTail} />
              </View>
            ) : null}
            {currentAvatar ? (
              <Image
                source={{ uri: currentAvatar }}
                style={styles.myAvatarOnMap}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.myInitialsOnMap}>
                <Text style={styles.myInitialsText}>
                  {currentName ? currentName.slice(0, 1).toUpperCase() : "?"}
                </Text>
              </View>
            )}
          </View>
        </Marker>

        {showFootprints
          ? renderedFootprints.map((path, index) => (
              <Polyline
                key={`${path.uid}-${historyFilter}`}
                coordinates={path.coordinates}
                strokeColor={
                  path.uid === "me-live-trail"
                    ? COLORS.ink
                    : PATH_COLORS[index % PATH_COLORS.length]
                }
                strokeWidth={path.uid === "me-live-trail" ? 5 : 4}
                lineDashPattern={
                  path.uid === "me-live-trail" ? [6, 6] : undefined
                }
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
              anchor={{ x: 0.5, y: 0.72 }}
              tracksViewChanges={
                Platform.OS === "android"
                  ? true
                  : Boolean(user.avatarUrl) && !markerLoaded[uid]
              }
              style={styles.markerContainer}
              zIndex={900}
              onPress={() => focusFriend(uid, user)}
            >
              <SocialMapMarker
                name={user.displayName || "Friend"}
                avatarUrl={user.avatarUrl || null}
                speedKmh={user.speedKmh}
                batteryLevel={user.batteryLevel}
                stationarySince={user.stationarySince}
                lastUpdatedAt={user.updatedAt}
                isGhostMode={user.isGhostMode}
                bubbleAccent={["#FDE68A", "#FDBA74", "#F9A8D4"]}
                isSelected={selectedFriendUid === uid}
                note={user.note}
                noteAt={user.noteAt}
                onLoad={() =>
                  setMarkerLoaded((prev) => ({
                    ...prev,
                    [uid]: true,
                  }))
                }
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
            >
              <View style={styles.momentPin}>
                <Image
                  source={{ uri: moment.imageUrl }}
                  style={styles.momentImage}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Simple header like Bump */}
      <View style={[styles.header, { top: overlayTop }]}>
        <View style={styles.headerCard}>
          <Text style={styles.headerLabel}>FRIEND MAP</Text>
          <Text style={styles.headerCity}>{cityName}</Text>
          <View style={styles.headerStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>
                {friendCount || onlineUsers.length}
              </Text>
              <Text style={styles.statText}>LIVE FRIENDS</Text>
            </View>
            <TouchableOpacity
              style={[styles.statBadge, styles.statBadgePink]}
              onPress={openMomentsSheet}
              activeOpacity={0.75}
            >
              <Text style={[styles.statNumber, styles.statNumberPink]}>
                {visibleMoments.length}
              </Text>
              <Text style={styles.statText}>MOMENTS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Right side buttons - Bump style */}
      {!selectedUser && (
        <View style={[styles.rightButtons, { top: overlayTop + 180 }]}>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => navigation.navigate("Chats")}
          >
            <MessageCircle color={COLORS.pink} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => navigation.navigate("GiftCenter")}
          >
            <Gift color={COLORS.orange} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => setShowGlobe(true)}
          >
            <Globe color={COLORS.blue} size={24} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom controls - Bump style */}
      {!selectedUser && (
        <View style={[styles.bottomControls, { bottom: overlayBottom }]}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              showFootprints && styles.controlButtonActive,
            ]}
            onPress={() => setShowFootprints((v) => !v)}
          >
            <Text
              style={[
                styles.controlText,
                showFootprints && styles.controlTextActive,
              ]}
            >
              Trail {showFootprints ? "on" : "off"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomCameraButton}
            onPress={() => handleShareMoment("camera")}
          >
            <View style={styles.bottomCameraCircle}>
              <Camera color={COLORS.white} size={22} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.followButton,
              followCurrentUser && styles.followButtonActive,
            ]}
            onPress={centerOnMe}
          >
            <Navigation color={COLORS.white} size={18} />
            <Text style={styles.followText}>Following you</Text>
          </TouchableOpacity>
        </View>
      )}

      {showMyCard ? (
        <View style={[styles.myCard, { bottom: overlayBottom + 110 }]}>
          <Text style={styles.myCardKicker}>you are here</Text>
          <Text style={styles.myCardTitle}>{currentName}</Text>
          <View style={styles.myCardMetrics}>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>
                {Math.max(Number(location?.meta?.speedKmh || 0), 0).toFixed(0)}
              </Text>
              <Text style={styles.myMetricLabel}>km/h</Text>
            </View>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>
                {Math.max(Number(location?.meta?.batteryLevel || 0), 0).toFixed(
                  0,
                )}
                %
              </Text>
              <Text style={styles.myMetricLabel}>battery</Text>
            </View>
            <View style={styles.myMetric}>
              <Text style={styles.myMetricValue}>
                {followCurrentUser ? "Live" : "Free"}
              </Text>
              <Text style={styles.myMetricLabel}>camera</Text>
            </View>
          </View>
        </View>
      ) : null}

      <SelectedUserSheet
        user={selectedUser}
        moments={moments}
        onOpenMoment={(moment) => setSelectedMoment(moment)}
        bottomOffset={overlayBottom}
        onClose={() => {
          setSelectedUser(null);
          setSelectedFriendUid(null);
        }}
        onChat={() => navigation.navigate("Chats")}
        onInteract={(emoji) => {
          if (selectedUser?.uid) {
            locationService.pushInteraction(selectedUser.uid, emoji);
          }
        }}
        onNavigate={handleNavigate}
        onSendSticker={() => {
          setStickerTarget(selectedUser);
          setShowStickerPicker(true);
        }}
        onViewProfile={() => {
          if (selectedUser?.uid) {
            navigation.navigate("FriendProfile", {
              friendUid: selectedUser.uid,
              friendData: selectedUser,
            });
          }
        }}
      />

      <MomentViewerModal
        moment={selectedMoment}
        onClose={() => setSelectedMoment(null)}
      />

      <NoteInputModal
        visible={showNoteModal}
        currentNote={myNote}
        onSave={async (text) => {
          setMyNote(text || null);
          setMyNoteAt(text ? Date.now() : null);
          await locationService.setNote(text);
        }}
        onClose={() => setShowNoteModal(false)}
      />

      <StickerReactionPicker
        visible={showStickerPicker}
        friendName={stickerTarget?.displayName}
        onSelect={(emoji) => {
          if (stickerTarget?.uid) {
            locationService.pushInteraction(stickerTarget.uid, emoji);
            setActiveReaction({
              emoji,
              fromName: currentName,
            });
            setTimeout(() => setActiveReaction(null), 3000);
          }
        }}
        onClose={() => {
          setShowStickerPicker(false);
          setStickerTarget(null);
        }}
      />

      {activeReaction ? (
        <ReactionAnimation
          emoji={activeReaction.emoji}
          fromName={activeReaction.fromName}
          onComplete={() => setActiveReaction(null)}
        />
      ) : null}

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
          <Text style={styles.interactionEmoji}>
            {incomingInteraction.emoji}
          </Text>
          <Text style={styles.interactionLabel}>A friend reacted to you</Text>
        </Animated.View>
      ) : null}

      <GlobeView
        visible={showGlobe}
        friendsCount={onlineUsers.length}
        onClose={() => setShowGlobe(false)}
        onZoomToMap={() => {
          setShowGlobe(false);
          if (coords) {
            cameraController.flyTo(coords.latitude, coords.longitude, {
              zoom: 16,
              duration: 1500,
            });
          }
        }}
      />

      {/* ── Moments Sheet ─────────────────────────────────────── */}
      <Modal
        visible={showMomentsSheet}
        transparent
        animationType="none"
        onRequestClose={closeMomentsSheet}
      >
        <View style={styles.momentsOverlay}>
          <TouchableOpacity
            style={styles.momentsBackdrop}
            activeOpacity={1}
            onPress={closeMomentsSheet}
          />
          <Animated.View
            style={[
              styles.momentsSheet,
              { bottom: insets.bottom },
              {
                transform: [
                  {
                    translateY: momentsSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [700, 0],
                    }),
                  },
                ],
                opacity: momentsSheetAnim,
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.momentsHandle} />

            {/* Header */}
            <View style={styles.momentsHeader}>
              <View>
                <Text style={styles.momentsTitle}>Moments</Text>
                <Text style={styles.momentsSubtitle}>
                  {visibleMoments.length} post
                  {visibleMoments.length !== 1 ? "s" : ""} in the last 24h
                </Text>
              </View>
              <TouchableOpacity
                style={styles.momentsCloseBtn}
                onPress={closeMomentsSheet}
              >
                <Text style={styles.momentsCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {visibleMoments.length === 0 ? (
              <View style={styles.momentsEmpty}>
                <Text style={styles.momentsEmptyEmoji}>📷</Text>
                <Text style={styles.momentsEmptyTitle}>No moments yet</Text>
                <Text style={styles.momentsEmptyHint}>
                  You and your friends haven't posted anything in the last 24
                  hours.
                </Text>
                <TouchableOpacity
                  style={styles.momentsShareBtn}
                  onPress={() => {
                    closeMomentsSheet();
                    setTimeout(() => handleShareMoment("camera"), 300);
                  }}
                >
                  <Text style={styles.momentsShareBtnText}>Share a moment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={visibleMoments}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.momentsGrid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isMe = item.userId === auth.currentUser?.uid;
                  const ageMs =
                    Date.now() -
                    (item.createdAt?.toMillis?.() ?? item.createdAt ?? 0);
                  const ageH = Math.floor(ageMs / 3600000);
                  const ageM = Math.floor((ageMs % 3600000) / 60000);
                  const ageLabel = ageH > 0 ? `${ageH}h ago` : `${ageM}m ago`;
                  return (
                    <TouchableOpacity
                      style={styles.momentCard}
                      activeOpacity={0.88}
                      onPress={() => {
                        closeMomentsSheet();
                        setTimeout(() => setSelectedMoment(item), 320);
                      }}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.momentCardImage}
                      />
                      {/* Gradient overlay */}
                      <View style={styles.momentCardOverlay}>
                        <View style={styles.momentCardBottom}>
                          <View
                            style={[
                              styles.momentCardOwnerDot,
                              isMe && styles.momentCardOwnerDotMe,
                            ]}
                          />
                          <Text
                            style={styles.momentCardOwner}
                            numberOfLines={1}
                          >
                            {isMe ? "You" : item.displayName || "Friend"}
                          </Text>
                          <Text style={styles.momentCardAge}>{ageLabel}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  loadingHint: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
    lineHeight: 20,
  },

  // Header - Bump style
  header: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 40,
  },
  headerCard: {
    backgroundColor: "rgba(12, 16, 26, 0.9)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...SHADOW.card,
  },
  headerLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerCity: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statBadgePink: {
    backgroundColor: "rgba(236,72,153,0.15)",
  },
  statNumber: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 2,
  },
  statNumberPink: {
    color: COLORS.pink,
  },
  statText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cameraButton: {
    backgroundColor: "rgba(20, 20, 22, 0.9)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cameraText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 2,
  },

  // Right buttons
  rightButtons: {
    position: "absolute",
    right: 20,
    zIndex: 35,
    gap: 12,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(12,16,26,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...SHADOW.card,
  },

  // Bottom controls
  bottomControls: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
    zIndex: 35,
  },
  controlButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "rgba(12,16,26,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  controlButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  controlText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  controlTextActive: {
    color: COLORS.white,
  },
  controlButtonDemo: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  controlTextDemo: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(12,16,26,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  followButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  followText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
  },
  // Moment pin
  momentPin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.bgElevated,
    padding: 2,
    borderWidth: 2,
    borderColor: COLORS.pink,
    ...SHADOW.card,
  },
  momentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
    backgroundColor: COLORS.bgSoft,
  },

  interactionOverlay: {
    position: "absolute",
    top: "35%",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 999,
    backgroundColor: "rgba(255,255,255,0.98)",
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
    fontWeight: "900",
  },
  interactionLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },

  // ── My location marker ────────────────────────────────────────
  myLocationWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },

  myAvatarOnMap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    position: "absolute",
    overflow: "hidden",
  },
  myInitialsOnMap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.me,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
    position: "absolute",
    overflow: "hidden",
  },
  myInitialsText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  // ── My note bubble on marker ───────────────────────────────────
  myMarkerNoteBubble: {
    position: "absolute",
    bottom: 44,
    left: "50%",
    transform: [{ translateX: -50 }],
    paddingHorizontal: 12,
    minWidth: 60,
    maxWidth: 160,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 1001,
    alignItems: "center",
  },
  myMarkerNoteText: {
    fontSize: 10,
    fontWeight: "700",
    marginLeft: -20,
    color: COLORS.textPrimary,
    textAlign: "center",
    lineHeight: 13,
  },
  myMarkerNoteTail: {
    position: "absolute",
    bottom: -5,
    left: "50%",
    transform: [{ translateX: -5 }],
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.bgCard,
  },

  // ── Moments Sheet ─────────────────────────────────────────────
  momentsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  momentsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  markerContainer: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCameraButton: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  bottomCameraCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.ink,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  momentsSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "82%",
    paddingTop: 12,
    ...SHADOW.card,
  },
  momentsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  momentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  momentsTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  momentsSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  momentsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  momentsCloseBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  momentsGrid: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    gap: 8,
  },
  momentCard: {
    flex: 1,
    margin: 4,
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.bgSoft,
    ...SHADOW.card,
  },
  momentCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  momentCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.18)",
    backgroundGradient: "transparent",
  },
  momentCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 5,
  },
  momentCardOwnerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.pink,
  },
  momentCardOwnerDotMe: {
    backgroundColor: COLORS.accent,
  },
  momentCardOwner: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },
  momentCardAge: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  momentsEmpty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  momentsEmptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  momentsEmptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  momentsEmptyHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  momentsShareBtn: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  momentsShareBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
});
