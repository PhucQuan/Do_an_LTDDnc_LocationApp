import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout } from 'react-native-maps';
import { adminService } from '../../../infrastructure/firebase/adminService';
import { mapStyle } from '../../theme/mapStyle';

const A = {
  bg: '#0A0E1A', text: '#F1F5F9', sub: '#94A3B8',
  accent: '#7C3AED', green: '#10B981', muted: '#475569',
};

const INITIAL_REGION = {
  latitude: 10.8231, longitude: 106.6297,
  latitudeDelta: 0.5, longitudeDelta: 0.5,
};

function getAvatar(loc) {
  return loc?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(loc?.name || 'U')}&background=4c1d95&color=ffffff&bold=true&size=64`;
}

export default function AdminMapScreen() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    const unsub = adminService.subscribeToLocations((locs) => {
      // Filter out stale (>10 minutes) locations
      const now = Date.now();
      const fresh = locs.filter(l => {
        if (!l.updatedAt) return true;
        return (now - l.updatedAt) < 10 * 60 * 1000;
      });
      setLocations(fresh);
      setLoading(false);

      // Fit map to all markers
      if (fresh.length > 0 && mapRef.current) {
        const coords = fresh
          .filter(l => l.latitude && l.longitude)
          .map(l => ({ latitude: l.latitude, longitude: l.longitude }));
        if (coords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 80, right: 60, bottom: 100, left: 60 },
              animated: true,
            });
          }, 600);
        }
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const onlineCount = locations.filter(l => !l.isGhostMode).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <View>
          <Text style={styles.kicker}>admin · live map</Text>
          <Text style={styles.title}>Map View</Text>
        </View>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>{onlineCount} online</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadWrap}>
          <ActivityIndicator color={A.accent} size="large" />
          <Text style={styles.loadText}>Loading locations...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={INITIAL_REGION}
          customMapStyle={mapStyle}
          showsUserLocation={false}
          showsCompass={false}
        >
          {locations
            .filter(l => l.latitude && l.longitude)
            .map((loc) => (
              <Marker
                key={loc.uid}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                tracksViewChanges={false}
              >
                {/* Custom admin marker */}
                <View style={styles.markerWrap}>
                  <View style={styles.markerRing}>
                    <Image
                      source={{ uri: getAvatar(loc) }}
                      style={styles.markerAvatar}
                    />
                  </View>
                  <View style={styles.markerTail} />
                </View>

                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName}>{loc.name || 'Unknown'}</Text>
                    <Text style={styles.calloutSub}>
                      {loc.isGhostMode ? '👻 Ghost' : '🟢 Active'}
                      {loc.status ? `  ·  ${loc.status}` : ''}
                    </Text>
                    <Text style={styles.calloutCoord}>
                      {loc.latitude?.toFixed(5)}, {loc.longitude?.toFixed(5)}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  headerOverlay: {
    position: 'absolute', top: 56, left: 16, right: 16, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(10,14,26,0.88)', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  kicker: { color: A.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, textTransform: 'uppercase' },
  title: { color: A.text, fontSize: 20, fontWeight: '900', marginTop: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: A.green },
  badgeText: { color: A.green, fontSize: 13, fontWeight: '800' },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadText: { color: A.sub, fontSize: 14 },
  // Markers
  markerWrap: { alignItems: 'center' },
  markerRing: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2.5, borderColor: '#7C3AED',
    padding: 2, backgroundColor: '#0A0E1A',
  },
  markerAvatar: { width: '100%', height: '100%', borderRadius: 18 },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#7C3AED', marginTop: -1,
  },
  callout: {
    backgroundColor: '#141824', borderRadius: 14, padding: 12, minWidth: 140,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  calloutName: { color: '#F1F5F9', fontSize: 14, fontWeight: '800' },
  calloutSub: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  calloutCoord: { color: '#475569', fontSize: 10, marginTop: 4 },
});
