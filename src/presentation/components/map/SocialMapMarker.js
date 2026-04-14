import React, { memo, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Battery, BatteryCharging, BatteryLow, BatteryMedium } from 'lucide-react-native';

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

function formatStationaryTime(timestamp) {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  
  if (minutes < 5) return null; // Don't show if stationary for less than 5 minutes
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function BatteryIndicator({ level }) {
  if (level == null) return null;
  
  let Icon = Battery;
  let color = '#22C55E';
  
  if (level <= 20) {
    Icon = BatteryLow;
    color = '#EF4444';
  } else if (level <= 50) {
    Icon = BatteryMedium;
    color = '#F59E0B';
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
  bubbleAccent = ['#38BDF8', '#818CF8', '#C084FC'],
  lastUpdatedAt,
  isGhostMode = false,
  showSpeed = true,
}) {
  const presence = getPresenceLabel(lastUpdatedAt);
  const isActive = presence === 'online' && !isGhostMode;
  const pulse = useRef(new Animated.Value(0)).current;
  
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
  }, [pulse, isActive, speedKmh]);

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

  return (
    <View style={styles.wrap}>
      {stationaryText ? (
        <View style={styles.stationaryTag}>
          <Text style={styles.stationaryText}>{stationaryText}</Text>
        </View>
      ) : showSpeed && speedKmh >= 1 ? (
        <View style={[styles.speedTag, { backgroundColor: isGhostMode ? '#71717A' : '#1E293B' }]}>
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

      {batteryLevel != null && !isGhostMode && (
         <BatteryIndicator level={batteryLevel} />
      )}
      
      {isGhostMode && (
         <View style={[styles.dot, { backgroundColor: '#94A3B8' }]} />
      )}
    </View>
  );
}

export const SocialMapMarker = memo(SocialMapMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  speedTag: {
    position: 'absolute',
    top: -16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  speedText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '900',
  },
  stationaryTag: {
    position: 'absolute',
    top: -16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#334155',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  stationaryText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '800',
  },
  batteryBadge: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    gap: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: 'rgba(56,189,248,0.4)',
  },
  glow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    opacity: 0.35,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  innerShell: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: '#0F172A',
    padding: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: '#334155',
  },
  dot: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
