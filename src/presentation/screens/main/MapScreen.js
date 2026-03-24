import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocation } from '../../../core/hooks/useLocation';
import { locationService } from '../../../infrastructure/firebase/locationService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Mock activity data (Tuần 2 sẽ thay bằng real Firestore) ────────────────
const MOCK_ACTIVITIES = [
  { id: '1', name: 'Thành Tú 💙', action: 'đã đến trường', time: 'VỪA XONG', avatar: null },
  { id: '2', name: 'Mạnh Hùng 🔥', action: 'đã về nhà', time: '5 phút', avatar: null },
  { id: '3', name: 'Thành Tú 💙', action: 'đã đến quán cà phê', time: 'VỪA XONG', avatar: null },
];

// ─── Pulse animation wrapper ─────────────────────────────────────────────────
function PulseRing({ color = '#38BDF8', size = 60 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

// ─── Avatar Marker – bản thân ────────────────────────────────────────────────
function MyAvatarMarker({ initials = 'Q' }) {
  return (
    <View style={styles.avatarMarkerWrapper}>
      <PulseRing color="#38BDF8" size={56} />
      <View style={styles.avatarMarkerRing}>
        <View style={styles.avatarMarkerInner}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      </View>
      {/* LIVE badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
  );
}

// ─── Avatar Marker – người khác ──────────────────────────────────────────────
function OtherAvatarMarker({ name = '?' }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <View style={styles.otherAvatarWrapper}>
      <PulseRing color="#F472B6" size={48} />
      <View style={styles.otherAvatarRing}>
        <View style={[styles.avatarMarkerInner, { backgroundColor: '#F472B6' }]}>
          <Text style={styles.avatarInitials}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────
function ActivityCard({ item, index }) {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0, duration: 400, delay: index * 120, useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 400, delay: index * 120, useNativeDriver: true
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.activityCard, { transform: [{ translateX }], opacity }]}>
      {/* Avatar placeholder */}
      <View style={styles.activityAvatar}>
        <Text style={{ fontSize: 18 }}>
          {item.name.includes('Tú') ? '👤' : '👤'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityName}>{item.name}</Text>
        <Text style={styles.activityAction}>{item.action}</Text>
      </View>
      <Text style={styles.activityTime}>{item.time}</Text>
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function MapScreen() {
  const { location, isLoading, errorMsg, getLocation } = useLocation();
  const mapRef = useRef(null);
  const [otherUsers, setOtherUsers] = useState({});
  const [cityName, setCityName] = useState('Vị trí của bạn');
  const [showActivity, setShowActivity] = useState(true);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const coords = location?.coords ?? null;

  // Reverse geocode tên thành phố (dùng expo-location)
  useEffect(() => {
    if (!coords) return;
    import('expo-location').then(({ reverseGeocodeAsync }) => {
      reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude })
        .then((results) => {
          if (results?.[0]) {
            const r = results[0];
            setCityName(r.district || r.city || r.region || 'Vị trí của bạn');
          }
        })
        .catch(() => {});
    });
  }, [coords?.latitude, coords?.longitude]);

  // Auto-push lên RTDB
  useEffect(() => {
    if (!coords) return;
    locationService.pushLocation(coords.latitude, coords.longitude, coords.accuracy);
  }, [coords?.latitude, coords?.longitude]);

  // Subscribe vị trí người khác
  useEffect(() => {
    const unsub = locationService.subscribeToAllLocations(setOtherUsers);
    return () => unsub();
  }, []);

  // Toggle activity panel
  const toggleActivity = useCallback(() => {
    Animated.spring(panelAnim, {
      toValue: showActivity ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setShowActivity((v) => !v);
  }, [showActivity]);

  const flyToUser = useCallback(() => {
    if (!coords || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
      700
    );
  }, [coords]);

  if (isLoading || !coords) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingEmoji}>🌍</Text>
        <Text style={styles.loadingText}>Đang xác định vị trí…</Text>
      </View>
    );
  }

  const onlineCount = Object.keys(otherUsers).length;
  const panelTranslate = panelAnim.interpolate({
    inputRange: [0, 1], outputRange: [220, 0]
  });

  return (
    <View style={{ flex: 1 }}>
      {/* ── Bản đồ full-screen ── */}
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
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        scrollEnabled
        zoomEnabled
        pitchEnabled
      >
        {/* Marker bản thân */}
        <Marker
          coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <MyAvatarMarker initials="Q" />
        </Marker>

        {/* Radius circle mờ */}
        <Circle
          center={{ latitude: coords.latitude, longitude: coords.longitude }}
          radius={150}
          fillColor="rgba(56,189,248,0.06)"
          strokeColor="rgba(56,189,248,0.2)"
          strokeWidth={1}
        />

        {/* Markers người khác */}
        {Object.entries(otherUsers).map(([uid, data]) => (
          <Marker
            key={uid}
            coordinate={{ latitude: data.latitude, longitude: data.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <OtherAvatarMarker name={data.displayName} />
          </Marker>
        ))}
      </MapView>

      {/* ── Gradient overlay trên cùng ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.header}>
        {/* City name */}
        <View>
          <Text style={styles.cityName}>{cityName}</Text>
          <View style={styles.coordsRow}>
            <Text style={styles.coordsSmall}>
              {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
            </Text>
            {onlineCount > 0 && (
              <View style={styles.onlinePill}>
                <View style={styles.greenDot} />
                <Text style={styles.onlinePillText}>+{onlineCount} online</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top-right actions */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topBtn} onPress={toggleActivity}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.topAvatar}>
            <Text style={{ fontSize: 16 }}>Q</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Activity panel (slide up) ── */}
      <Animated.View
        style={[
          styles.activityPanel,
          { transform: [{ translateY: panelTranslate }] },
        ]}
        pointerEvents={showActivity ? 'box-none' : 'none'}
      >
        {MOCK_ACTIVITIES.map((item, i) => (
          <ActivityCard key={item.id} item={item} index={i} />
        ))}
      </Animated.View>

      {/* ── Gradient overlay dưới ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* ── Bottom floating bar ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          {/* Nút bên trái */}
          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnIcon}>👥</Text>
            <Text style={styles.bottomBtnLabel}>Bạn bè</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnIcon}>💬</Text>
            <Text style={styles.bottomBtnLabel}>Chat</Text>
          </TouchableOpacity>

          {/* Nút FAB trung tâm với Nhãn */}
          <View style={styles.fabContainer}>
            <TouchableOpacity style={styles.fabBtn} onPress={flyToUser}>
              <LinearGradient 
                colors={['#38BDF8', '#818CF8']} 
                style={styles.fabGradient} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 22, color: '#FFF' }}>◎</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.bottomBtnLabel, { color: '#38BDF8', fontWeight: '800' }]}>Dẫn đường</Text>
          </View>

          <TouchableOpacity style={styles.bottomBtn}>
            <Text style={styles.bottomBtnIcon}>🌐</Text>
            <Text style={styles.bottomBtnLabel}>Khám phá</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomBtn} onPress={toggleActivity}>
            <Text style={styles.bottomBtnIcon}>🔔</Text>
            <Text style={styles.bottomBtnLabel}>Thông báo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Loading ──
  loadingScreen: {
    flex: 1, backgroundColor: '#0F172A',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingEmoji: { fontSize: 56, marginBottom: 16 },
  loadingText: { color: '#94A3B8', fontSize: 16 },

  // ── Gradients ──
  topGradient: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 180, zIndex: 5,
  },
  bottomGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 200, zIndex: 5,
  },

  // ── Header ──
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cityName: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  coordsSmall: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.2)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
    gap: 4,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  onlinePillText: { color: '#34D399', fontSize: 11, fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  topBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  topAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#38BDF8',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },

  // ── My Avatar Marker ──
  avatarMarkerWrapper: { alignItems: 'center', justifyContent: 'center' },
  avatarMarkerRing: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 3, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0F172A',
    elevation: 8,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12,
  },
  avatarMarkerInner: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#38BDF8',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  liveBadge: {
    position: 'absolute', bottom: -6,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
    gap: 3,
    borderWidth: 1.5, borderColor: '#FFF',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFF' },
  liveText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // ── Other Avatar Marker ──
  otherAvatarWrapper: { alignItems: 'center', justifyContent: 'center' },
  otherAvatarRing: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 3, borderColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0F172A',
    elevation: 6,
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10,
  },

  // ── Activity Panel ──
  activityPanel: {
    position: 'absolute',
    bottom: 110,
    right: 16,
    width: SCREEN_W * 0.72,
    zIndex: 20,
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
    elevation: 8,
  },
  activityAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center', alignItems: 'center',
  },
  activityName: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  activityAction: { color: '#64748B', fontSize: 12, marginTop: 1 },
  activityTime: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },

  // ── Bottom Bar ──
  bottomBarContainer: {
    position: 'absolute',
    bottom: 20, // Đẩy lên một chút để tạo hiệu ứng nổi
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: SCREEN_W * 0.92,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center', // Align items to center vertically
    // Shadow cho iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    // Elevation cho Android
    elevation: 15,
  },
  bottomBtn: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 4 
  },
  bottomBtnIcon: { fontSize: 22 },
  bottomBtnLabel: { 
    color: '#64748B', 
    fontSize: 10, 
    fontWeight: '600',
    textAlign: 'center'
  },

  // FAB
  fabContainer: {
    marginTop: -35, // Đẩy FAB lên cao hơn mặt bằng chung
    alignItems: 'center',
    gap: 4,
  },
  fabBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
});
