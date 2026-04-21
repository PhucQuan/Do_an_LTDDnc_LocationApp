import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Battery,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Zap,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../infrastructure/firebase/firebase';
import { MAP_STYLE } from '../../theme/mapStyle';
import { COLORS, SHADOW, SPACING } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDistance(meters) {
  if (!meters || meters < 1000) return `${Math.round(meters || 0)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(minutes) {
  if (!minutes) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function calculateStats(locations) {
  if (!locations || locations.length === 0) {
    return {
      totalDistance: 0,
      totalTime: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      placesVisited: 0,
    };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  let speedSum = 0;
  let speedCount = 0;

  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];

    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth radius in meters
    const φ1 = (prev.latitude * Math.PI) / 180;
    const φ2 = (curr.latitude * Math.PI) / 180;
    const Δφ = ((curr.latitude - prev.latitude) * Math.PI) / 180;
    const Δλ = ((curr.longitude - prev.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    totalDistance += distance;

    if (curr.speedKmh) {
      maxSpeed = Math.max(maxSpeed, curr.speedKmh);
      speedSum += curr.speedKmh;
      speedCount++;
    }
  }

  const firstTime = locations[0].timestamp || Date.now();
  const lastTime = locations[locations.length - 1].timestamp || Date.now();
  const totalTime = (lastTime - firstTime) / 60000; // minutes

  return {
    totalDistance,
    totalTime,
    avgSpeed: speedCount > 0 ? speedSum / speedCount : 0,
    maxSpeed,
    placesVisited: locations.length,
  };
}

export default function FriendProfileScreen({ route, navigation }) {
  const { friendUid, friendData } = route.params || {};
  const insets = useSafeAreaInsets();
  const [locationHistory, setLocationHistory] = useState([]);
  const [moments, setMoments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    loadFriendData();
  }, [friendUid]);

  const loadFriendData = async () => {
    if (!friendUid) return;

    try {
      setLoading(true);

      // Load location history (last 24 hours)
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const locationsQuery = query(
        collection(db, 'locationHistory'),
        where('userId', '==', friendUid),
        where('timestamp', '>=', yesterday),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const locationsSnapshot = await getDocs(locationsQuery);
      const locations = locationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLocationHistory(locations);
      setStats(calculateStats(locations));

      // Load moments
      const momentsQuery = query(
        collection(db, 'moments'),
        where('userId', '==', friendUid),
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      const momentsSnapshot = await getDocs(momentsQuery);
      const momentsData = momentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMoments(momentsData);
    } catch (error) {
      console.error('Error loading friend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: 'clamp',
  });

  const name = friendData?.displayName || 'Friend';
  const avatar = friendData?.avatarUrl;
  const isOnline = friendData?.updatedAt && Date.now() - friendData.updatedAt < 2 * 60 * 1000;

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.headerBar, { opacity: headerOpacity }]}>
        <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
          <View style={[styles.headerContent, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft color={COLORS.textPrimary} size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.backBtn} />
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 60 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.hero, { transform: [{ scale: headerScale }] }]}>
          <LinearGradient
            colors={[COLORS.accent + '40', COLORS.pink + '20', 'transparent']}
            style={styles.heroGradient}
          />
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {isOnline ? <View style={styles.onlineDot} /> : null}
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>@{name.toLowerCase().replace(/\s+/g, '')}</Text>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp color={COLORS.accent} size={20} />
            </View>
            <Text style={styles.statValue}>{formatDistance(stats?.totalDistance || 0)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Zap color={COLORS.yellow} size={20} />
            </View>
            <Text style={styles.statValue}>{Math.round(stats?.maxSpeed || 0)}</Text>
            <Text style={styles.statLabel}>Max km/h</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock color={COLORS.pink} size={20} />
            </View>
            <Text style={styles.statValue}>{formatDuration(stats?.totalTime || 0)}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Current Status */}
        {friendData ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Navigation color={COLORS.accent} size={18} />
                  <Text style={styles.statusValue}>{Math.round(friendData.speedKmh || 0)} km/h</Text>
                  <Text style={styles.statusLabel}>Speed</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <Battery color={COLORS.green} size={18} />
                  <Text style={styles.statusValue}>{Math.round(friendData.batteryLevel || 100)}%</Text>
                  <Text style={styles.statusLabel}>Battery</Text>
                </View>
                <View style={styles.statusDivider} />
                <View style={styles.statusItem}>
                  <MapPin color={COLORS.pink} size={18} />
                  <Text style={styles.statusValue}>{isOnline ? 'Live' : 'Offline'}</Text>
                  <Text style={styles.statusLabel}>Status</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Map with Trail */}
        {locationHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Journey</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                customMapStyle={MAP_STYLE}
                initialRegion={{
                  latitude: locationHistory[0].latitude,
                  longitude: locationHistory[0].longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                <Polyline
                  coordinates={locationHistory.map((loc) => ({
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  }))}
                  strokeColor={COLORS.accent}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
                {locationHistory[0] ? (
                  <Marker
                    coordinate={{
                      latitude: locationHistory[0].latitude,
                      longitude: locationHistory[0].longitude,
                    }}
                  >
                    <View style={styles.currentMarker}>
                      <View style={styles.currentMarkerDot} />
                    </View>
                  </Marker>
                ) : null}
              </MapView>
            </View>
          </View>
        ) : null}

        {/* Moments Grid */}
        {moments.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Moments</Text>
              <Text style={styles.sectionCount}>{moments.length}</Text>
            </View>
            <View style={styles.momentsGrid}>
              {moments.map((moment) => (
                <TouchableOpacity key={moment.id} style={styles.momentCard} activeOpacity={0.8}>
                  <Image source={{ uri: moment.imageUrl }} style={styles.momentImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.momentOverlay}
                  >
                    <Text style={styles.momentTime}>
                      {new Date(moment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBack, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
      >
        <BlurView intensity={60} tint="dark" style={styles.floatingBackBlur}>
          <ArrowLeft color={COLORS.textPrimary} size={22} />
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.bgElevated,
    ...SHADOW.card,
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.bgElevated,
    ...SHADOW.card,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.neonGreen,
    borderWidth: 4,
    borderColor: COLORS.bg,
    shadowColor: COLORS.neonGreen,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  handle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: SPACING.md,
  },
  sectionCount: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  statusCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: SPACING.lg,
    ...SHADOW.card,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statusValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  mapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOW.card,
  },
  map: {
    flex: 1,
  },
  currentMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOW.accent,
  },
  currentMarkerDot: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  momentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  momentCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    height: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.bgSoft,
    ...SHADOW.card,
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  momentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 8,
  },
  momentTime: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  floatingBack: {
    position: 'absolute',
    left: SPACING.lg,
    zIndex: 99,
  },
  floatingBackBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOW.card,
  },
});
