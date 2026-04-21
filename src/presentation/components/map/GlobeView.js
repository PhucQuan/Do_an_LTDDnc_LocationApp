import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, X } from 'lucide-react-native';
import { COLORS, SHADOW } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple 3D globe using image and animations
export function GlobeView({ visible, friendsCount, onClose, onZoomToMap }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [friendPositions, setFriendPositions] = useState([]);

  useEffect(() => {
    if (visible) {
      // Generate random friend positions on globe
      const positions = Array.from({ length: Math.min(friendsCount, 8) }, () => ({
        x: Math.random() * SCREEN_WIDTH * 0.6 + SCREEN_WIDTH * 0.2,
        y: Math.random() * SCREEN_HEIGHT * 0.4 + SCREEN_HEIGHT * 0.25,
        delay: Math.random() * 500,
      }));
      setFriendPositions(positions);

      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible, friendsCount, scaleAnim, fadeAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleZoomIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 3,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onZoomToMap) onZoomToMap();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Space background */}
      <LinearGradient
        colors={['#000000', '#0a0e27', '#1a1f3a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Stars */}
      <View style={styles.starsContainer}>
        {Array.from({ length: 50 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.7,
              },
            ]}
          />
        ))}
      </View>

      {/* Globe */}
      <Animated.View
        style={[
          styles.globeContainer,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Globe sphere with gradient */}
        <View style={styles.globe}>
          <LinearGradient
            colors={['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.globeGradient}
          >
            {/* Continents overlay (simplified) */}
            <View style={styles.continents}>
              <View style={[styles.continent, styles.continent1]} />
              <View style={[styles.continent, styles.continent2]} />
              <View style={[styles.continent, styles.continent3]} />
            </View>
          </LinearGradient>

          {/* Glow effect */}
          <View style={styles.globeGlow} />
        </View>

        {/* Friend markers on globe */}
        {friendPositions.map((pos, i) => (
          <Animated.View
            key={i}
            style={[
              styles.friendMarker,
              {
                left: pos.x,
                top: pos.y,
              },
            ]}
          >
            <View style={styles.markerPulse} />
            <View style={styles.markerDot} />
          </Animated.View>
        ))}
      </Animated.View>

      {/* Info overlay */}
      <Animated.View style={[styles.infoOverlay, { opacity: fadeAnim }]}>
        <View style={styles.infoCard}>
          <Globe color={COLORS.accent} size={32} />
          <Text style={styles.infoTitle}>Global View</Text>
          <Text style={styles.infoCount}>{friendsCount} friends online</Text>
          <Text style={styles.infoHint}>Tap globe to zoom in</Text>
        </View>
      </Animated.View>

      {/* Zoom button */}
      <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn} activeOpacity={0.9}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.pink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.zoomButtonGradient}
        >
          <Text style={styles.zoomButtonText}>Zoom to Map</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <View style={styles.closeButtonInner}>
          <X color={COLORS.textPrimary} size={20} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  globeContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globe: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.4,
    overflow: 'hidden',
    ...SHADOW.accent,
  },
  globeGradient: {
    flex: 1,
  },
  continents: {
    flex: 1,
  },
  continent: {
    position: 'absolute',
    backgroundColor: '#10b981',
    opacity: 0.6,
    borderRadius: 20,
  },
  continent1: {
    width: 80,
    height: 100,
    top: '25%',
    left: '15%',
    transform: [{ rotate: '-15deg' }],
  },
  continent2: {
    width: 120,
    height: 80,
    top: '40%',
    right: '20%',
    transform: [{ rotate: '25deg' }],
  },
  continent3: {
    width: 60,
    height: 90,
    bottom: '20%',
    left: '30%',
    transform: [{ rotate: '10deg' }],
  },
  globeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  friendMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  infoOverlay: {
    position: 'absolute',
    top: '15%',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
    ...SHADOW.card,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  infoCount: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  infoHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  zoomButton: {
    position: 'absolute',
    bottom: 100,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOW.accent,
  },
  zoomButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  zoomButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },
});
