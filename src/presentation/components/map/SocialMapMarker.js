import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { COLORS, SHADOW } from "../../theme";

function getRandomColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#60A5FA",
    "#F472B6",
    "#34D399",
    "#FBBF24",
    "#A78BFA",
    "#FB7185",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function getSpeedColor(speedKmh) {
  if (!speedKmh || speedKmh < 1) return COLORS.textMuted;
  if (speedKmh < 10) return COLORS.green;
  if (speedKmh < 40) return COLORS.yellow;
  return COLORS.orange;
}

function isLive(lastUpdatedAt) {
  if (!lastUpdatedAt) return false;
  return Date.now() - Number(lastUpdatedAt) <= 2 * 60 * 1000;
}

function getActiveNote(note, noteAt) {
  if (!note || !noteAt) return null;
  return Date.now() - Number(noteAt) < 24 * 60 * 60 * 1000 ? note : null;
}

function SocialMapMarkerComponent({
  name,
  avatarUrl = null,
  speedKmh = 0,
  batteryLevel = 100,
  lastUpdatedAt,
  isGhostMode = false,
  isSelected = false,
  note = null,
  noteAt = null,
  onLoad = null,
}) {
  const live = isLive(lastUpdatedAt) && !isGhostMode;
  const activeNote = getActiveNote(note, noteAt);
  const speedColor = getSpeedColor(speedKmh);
  const isMoving = speedKmh && speedKmh > 1;

  const randomColor = getRandomColor(name);

  // animation (giữ lại nếu sau này muốn dùng)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (live) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [live]);

  return (
    <View style={styles.wrap}>
      {/* Note bubble - trên cùng */}
      {activeNote ? (
        <View style={styles.noteBubble}>
          <Text style={styles.noteText} numberOfLines={1}>
            {activeNote}
          </Text>
          <View style={styles.noteTail} />
        </View>
      ) : null}

      {/* Avatar or colored dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: randomColor,
            transform: [{ scale: isSelected ? 1.2 : 1 }],
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
            onLoad={onLoad}
            resizeMode="cover"
          />
        ) : null}
      </Animated.View>

      {/* Status dot */}
      <View
        style={[
          styles.statusDot,
          live ? styles.statusLive : styles.statusOffline,
        ]}
      />

      {/* Name - dưới cùng */}
      <Text style={styles.nameLabel} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

export const SocialMapMarker = memo(SocialMapMarkerComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
    flexDirection: "column",
    width: 400,
    height: 400,
  },

  // note bubble (ở trên)
  noteBubble: {
    position: "absolute",
    top: -40,
    minWidth: 60,
    maxWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 6,
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

  // dot (ở giữa) - PHẢI tròn
  dot: {
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },

  // name (ở dưới)
  nameLabel: {
    marginTop: 12,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    maxWidth: 160,
    flexShrink: 0,
  },

  // status
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.bg,
  },
  statusLive: {
    backgroundColor: COLORS.neonGreen,
  },
  statusOffline: {
    backgroundColor: COLORS.offline,
  },
});
