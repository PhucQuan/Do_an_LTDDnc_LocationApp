import React, { memo, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Battery, BatteryLow, BatteryMedium } from 'lucide-react-native';
import { COLORS } from '../../theme';

const FALLBACK_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
const AVATAR_SIZE = 64;

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getFallbackColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getRingColors(status, isGhostMode) {
  if (isGhostMode) {
    return ['#CBD5E1', '#94A3B8'];
  }

  if (status === 'offline') {
    return ['#E2E8F0', '#CBD5E1'];
  }

  return [COLORS.green, COLORS.accent];
}

function getPresenceLabel(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return 'offline';
  }

  return Date.now() - Number(lastUpdatedAt) <= 2 * 60 * 1000 ? 'online' : 'offline';
}

function formatStationaryTime(timestamp) {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 5) return null;
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function BatteryIndicator({ level }) {
  if (level == null) return null;

  let Icon = Battery;
  let color = COLORS.green;

  if (level <= 20) {
    Icon = BatteryLow;
    color = COLORS.danger;
  } else if (level <= 50) {
    Icon = BatteryMedium;
    color = COLORS.warning;
  }

  return (
    <View style={styles.batteryBadge}>
      <Icon size={12} color={color} />
      <Text style={[styles.batteryText, { color }]}>{Math.round(level)}%</Text>
    </View>
  );
}

function SocialMapMarkerComponent({
  name,
  avatarUrl,
  speedKmh = 0,
  batteryLevel,
  stationarySince,
  bubbleAccent = [COLORS.accent, COLORS.purple, COLORS.pink],
  lastUpdatedAt,
  isGhostMode = false,
  showSpeed = true,
  isMe = false,
  isSelected = false,
}) {
  const presence = getPresenceLabel(lastUpdatedAt);
  const isActive = presence === 'online' && !isGhostMode;
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const stationaryText = formatStationaryTime(stationarySince);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    );

    if (isActive && speedKmh > 1) {
      loop.start();
    } else {
      pulse.setValue(0);
      loop.stop();
    }

    return () => loop.stop();
  }, [isActive, pulse, speedKmh]);

  useEffect(() => {
    if (!isMe) {
      float.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [float, isMe]);

  const pulseStyle = {
    opacity: isActive
      ? pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 0],
        })
      : 0,
    transform: [
      {
        scale: isActive
          ? pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1.8],
            })
          : 0.8,
      },
    ],
  };

  const floatStyle = isMe
    ? {
        transform: [
          {
            translateY: float.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -5],
            }),
          },
        ],
      }
    : null;

  return (
    <Animated.View style={[styles.wrap, floatStyle, isSelected && !isMe && styles.wrapSelected]}>
      {isMe ? (
        <View style={styles.youTag}>
          <Text style={styles.youTagText}>YOU</Text>
        </View>
      ) : null}

      {stationaryText ? (
        <View style={styles.stationaryTag}>
          <Text style={styles.stationaryText}>{stationaryText}</Text>
        </View>
      ) : showSpeed && speedKmh >= 1 ? (
        <View style={styles.speedTag}>
          <Text style={styles.speedText}>{`${Math.max(Number(speedKmh || 0), 0).toFixed(0)} km/h`}</Text>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.pulse,
          pulseStyle,
          isMe && {
            backgroundColor: COLORS.meGlow,
            width: 96,
            height: 96,
            borderRadius: 48,
          },
        ]}
      />
      <LinearGradient
        colors={bubbleAccent}
        style={[
          styles.glow,
          !isMe && isSelected && styles.glowSelected,
          isMe && {
            width: 88,
            height: 88,
            borderRadius: 44,
            opacity: 0.82,
          },
        ]}
      />

      <LinearGradient
        colors={isMe ? [COLORS.white, COLORS.me] : getRingColors(presence, isGhostMode)}
        style={[styles.ring, isMe && styles.ringMe, !isMe && isSelected && styles.ringSelected, !isMe && !isActive && styles.ringIdle]}
      >
        <View style={[styles.innerShell, isMe && styles.innerShellMe]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.image, isMe && styles.imageMe]}
              onError={() => {}}
            />
          ) : (
            <View style={[styles.initialsWrap, { backgroundColor: getFallbackColor(name) }]}>
              <Text style={[styles.initialsText, isMe && styles.initialsTextMe]}>{getInitials(name)}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {batteryLevel != null && !isGhostMode ? <BatteryIndicator level={batteryLevel} /> : null}

      <View style={[styles.dot, { backgroundColor: isGhostMode ? COLORS.offline : COLORS.online }]} />
    </Animated.View>
  );
}

export const SocialMapMarker = memo(SocialMapMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  wrapSelected: {
    zIndex: 20,
  },
  youTag: {
    position: 'absolute',
    top: -28,
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  youTagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  speedTag: {
    position: 'absolute',
    top: -16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(15,23,42,0.86)',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  speedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  stationaryTag: {
    position: 'absolute',
    top: -16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.inkSoft,
    zIndex: 10,
  },
  stationaryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  batteryBadge: {
    position: 'absolute',
    bottom: 1,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  batteryText: {
    fontSize: 10,
    fontWeight: '900',
  },
  pulse: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.accentGlow,
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    opacity: 0.35,
  },
  glowSelected: {
    width: 82,
    height: 82,
    borderRadius: 41,
    opacity: 0.62,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ringSelected: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 4,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ringIdle: {
    opacity: 0.82,
  },
  ringMe: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 4,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  innerShell: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: COLORS.white,
    padding: 3.5,
  },
  innerShellMe: {
    borderRadius: 40,
    padding: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: COLORS.bgSoft,
  },
  imageMe: {
    borderRadius: 40,
  },
  initialsWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  initialsTextMe: {
    fontSize: 22,
  },
  dot: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
});
