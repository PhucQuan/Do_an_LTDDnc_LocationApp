import React, { memo, useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SHADOW } from "../../theme";

const FALLBACK_COLORS = [
  ["#60A5FA", "#3B82F6"], // blue
  ["#A78BFA", "#8B5CF6"], // purple
  ["#F472B6", "#EC4899"], // pink
  ["#34D399", "#10B981"], // green
  ["#FBBF24", "#F59E0B"], // yellow
  ["#FB7185", "#F43F5E"], // red
];

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getFallbackGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getSpeedColor(speedKmh) {
  if (!speedKmh || speedKmh < 1) return COLORS.textMuted;
  if (speedKmh < 10) return COLORS.green;
  if (speedKmh < 40) return COLORS.yellow;
  return COLORS.orange;
}

function isLive(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return false;
  }

  return Date.now() - Number(lastUpdatedAt) <= 2 * 60 * 1000;
}

function getActiveNote(note, noteAt) {
  if (!note || !noteAt) {
    return null;
  }

  return Date.now() - Number(noteAt) < 24 * 60 * 60 * 1000 ? note : null;
}

function SocialMapMarkerComponent({
  name,
  avatarUrl,
  speedKmh = 0,
  batteryLevel = 100,
  lastUpdatedAt,
  isGhostMode = false,
  isSelected = false,
  note = null,
  noteAt = null,
}) {
  const live = isLive(lastUpdatedAt) && !isGhostMode;
  const activeNote = getActiveNote(note, noteAt);
  const gradientColors = getFallbackGradient(name);
  const speedColor = getSpeedColor(speedKmh);
  const isMoving = speedKmh && speedKmh > 1;

  // Pulse animation for live users
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (live && !isGhostMode) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [live, isGhostMode, pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.wrap}>
      {/* Note bubble */}
      {activeNote ? (
        <View style={styles.noteBubble}>
          <Text style={styles.noteText} numberOfLines={1}>
            {activeNote}
          </Text>
          <View style={styles.noteTail} />
        </View>
      ) : null}

      {/* Speed indicator */}
      {isMoving ? (
        <View style={[styles.speedBubble, { borderColor: speedColor }]}>
          <Text style={[styles.speedText, { color: speedColor }]}>
            {Math.round(speedKmh)}
          </Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
      ) : null}

      {/* Glow effect for live users */}
      {live && !isGhostMode ? (
        <Animated.View
          style={[
            styles.glowRing,
            {
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[
              gradientColors[0] + "80",
              gradientColors[1] + "40",
              "transparent",
            ]}
            style={styles.glowGradient}
          />
        </Animated.View>
      ) : null}

      {/* Avatar container with gradient border */}
      <View
        style={[
          styles.avatarContainer,
          isSelected && styles.avatarContainerSelected,
        ]}
      >
        {live && !isGhostMode ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <View style={styles.avatarInner}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fallbackAvatar}
                >
                  <Text style={styles.initials}>{getInitials(name)}</Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.gradientBorder, styles.offlineBorder]}>
            <View style={styles.avatarInner}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={[styles.avatar, styles.avatarGhost]}
                />
              ) : (
                <View
                  style={[
                    styles.fallbackAvatar,
                    { backgroundColor: COLORS.textMuted },
                  ]}
                >
                  <Text style={styles.initials}>{getInitials(name)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Battery indicator */}
        {batteryLevel < 20 && live ? (
          <View style={styles.batteryBadge}>
            <Text style={styles.batteryText}>{Math.round(batteryLevel)}%</Text>
          </View>
        ) : null}
      </View>

      {/* Name label */}
      <Text style={styles.nameLabel} numberOfLines={1}>
        {name}
      </Text>

      {/* Status dot */}
      <View
        style={[
          styles.statusDot,
          live ? styles.statusLive : styles.statusOffline,
        ]}
      />
    </View>
  );
}

export const SocialMapMarker = memo(SocialMapMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 145,
  },
  // Note bubble
  noteBubble: {
    position: "absolute",
    top: -28,
    minWidth: 60,
    maxWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    zIndex: 10,
    ...SHADOW.card,
  },
  noteText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  noteTail: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.bgCard,
  },
  // Speed bubble
  speedBubble: {
    position: "absolute",
    top: -8,
    right: -12,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    zIndex: 9,
    ...SHADOW.card,
  },
  speedText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  speedUnit: {
    fontSize: 8,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  // Glow effect
  glowRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    zIndex: 1,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
  },
  // Avatar container
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 5,
  },
  avatarContainerSelected: {
    transform: [{ scale: 1.15 }],
  },
  gradientBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    padding: 3,
    ...SHADOW.card,
  },
  offlineBorder: {
    backgroundColor: COLORS.bgSoft,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: COLORS.bg,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarGhost: {
    opacity: 0.5,
  },
  fallbackAvatar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  // Battery badge
  batteryBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.bg,
    zIndex: 6,
  },
  batteryText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },
  // Status dot
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: COLORS.bg,
    zIndex: 6,
  },
  statusLive: {
    backgroundColor: COLORS.neonGreen,
    shadowColor: COLORS.neonGreen,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  statusOffline: {
    backgroundColor: COLORS.offline,
  },
  // Name label
  nameLabel: {
    position: "absolute",
    bottom: -24,
    left: 0,
    right: 0,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 90,
    alignSelf: "center",
  },
});
