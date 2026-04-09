import React, { memo, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'Friend'
  )}&background=0F172A&color=FFFFFF&size=256`;
}

function getRingColors(status, isGhostMode) {
  if (isGhostMode) {
    return ['#A1A1AA', '#71717A'];
  }

  if (status === 'offline') {
    return ['#CBD5E1', '#94A3B8'];
  }

  return ['#22C55E', '#38BDF8'];
}

function getPresenceLabel(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return 'offline';
  }

  return Date.now() - Number(lastUpdatedAt) <= 2 * 60 * 1000 ? 'online' : 'offline';
}

function SocialMapMarkerComponent({
  name,
  avatarUrl,
  speedKmh = 0,
  bubbleAccent = ['#60A5FA', '#C084FC', '#F9A8D4'],
  lastUpdatedAt,
  isGhostMode = false,
  showSpeed = true,
}) {
  const presence = getPresenceLabel(lastUpdatedAt);
  const isActive = presence === 'online' && !isGhostMode;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const pulseStyle = {
    opacity: isActive
      ? pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.28, 0],
        })
      : 0,
    transform: [
      {
        scale: isActive
          ? pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.7],
            })
          : 0.8,
      },
    ],
  };

  return (
    <View style={styles.wrap}>
      {showSpeed ? (
        <View style={[styles.speedTag, { backgroundColor: isGhostMode ? '#71717A' : '#111827' }]}>
          <Text style={styles.speedText}>{`${Math.max(Number(speedKmh || 0), 0).toFixed(0)} km/h`}</Text>
        </View>
      ) : null}

      <Animated.View style={[styles.pulse, pulseStyle]} />

      <LinearGradient colors={bubbleAccent} style={styles.glow} />

      <LinearGradient colors={getRingColors(presence, isGhostMode)} style={styles.ring}>
        <View style={styles.innerShell}>
          <Image source={{ uri: avatarUrl || getFallbackAvatar(name) }} style={styles.image} />
        </View>
      </LinearGradient>

      <View style={[styles.dot, { backgroundColor: presence === 'online' ? '#22C55E' : '#94A3B8' }]} />
    </View>
  );
}

export const SocialMapMarker = memo(SocialMapMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedTag: {
    position: 'absolute',
    top: -26,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 10,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pulse: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(56,189,248,0.3)',
  },
  glow: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    opacity: 0.4,
  },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  innerShell: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    padding: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  dot: {
    position: 'absolute',
    right: 5,
    bottom: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
