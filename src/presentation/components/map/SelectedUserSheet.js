import React, { useEffect, useRef } from 'react';
import { Animated, Image, Linking, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BatteryFull, MapPin, MessageCircle, Navigation, Smile, X } from 'lucide-react-native';
import { COLORS, SHADOW } from '../../theme';

const EMOJIS = ['Hi', 'Love', 'Fire', 'Haha', 'Eyes'];
const EMOJI_LABEL = {
  Hi: 'Wave',
  Love: 'Love',
  Fire: 'Fire',
  Haha: 'Laugh',
  Eyes: 'Look',
};

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'just now';
  const diffMs = Date.now() - Number(timestamp);
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Friend')}&background=ffffff&color=1d4ed8&size=256`;
}

export function SelectedUserSheet({ user, onClose, onChat, onInteract, onNavigate, onSendSticker, onViewProfile, bottomOffset }) {
  const translateY = useRef(new Animated.Value(420)).current;
  const insets = useSafeAreaInsets();
  const sheetBottom = typeof bottomOffset === 'number' ? bottomOffset : Math.max(12, insets.bottom + 12);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: user ? 0 : 420,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [translateY, user]);

  if (!user) return null;

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { bottom: sheetBottom, transform: [{ translateY }] }]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.identityRow}>
            <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8}>
              <Image source={{ uri: user.avatarUrl || getFallbackAvatar(user.displayName) }} style={styles.avatar} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={onViewProfile} activeOpacity={0.8}>
                <Text style={styles.name}>{user.displayName || 'Friend'}</Text>
              </TouchableOpacity>
              <Text style={styles.handle}>
                @{(user.displayName || 'friend').replace(/\s+/g, '').toLowerCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={COLORS.textPrimary} size={16} />
          </TouchableOpacity>
        </View>

        {onInteract ? (
          <View style={styles.emojiRow}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => {
                  onInteract(emoji);
                  onClose();
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.emojiText}>{EMOJI_LABEL[emoji]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <View style={styles.metricIconRow}>
              <Navigation color="#0369A1" size={16} />
              <Text style={[styles.metricValue, { color: '#0369A1' }]}>
                {Math.max(Number(user.speedKmh || 0), 0).toFixed(0)}
              </Text>
            </View>
            <Text style={styles.metricLabel}>km/h</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.metricIconRow}>
              <BatteryFull color="#166534" size={16} />
              <Text style={[styles.metricValue, { color: '#166534' }]}>
                {Math.max(Number(user.batteryLevel || 0), 0).toFixed(0)}%
              </Text>
            </View>
            <Text style={styles.metricLabel}>battery</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
            <View style={styles.metricIconRow}>
              <MapPin color="#9D174D" size={16} />
              <Text style={[styles.metricValue, { color: '#9D174D' }]}>
                {formatRelativeTime(user.updatedAt)}
              </Text>
            </View>
            <Text style={styles.metricLabel}>updated</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.chatButton} onPress={() => onChat(user)}>
            <MessageCircle color={COLORS.white} size={18} />
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>
          {onSendSticker ? (
            <TouchableOpacity style={styles.stickerButton} onPress={onSendSticker}>
              <Smile color={COLORS.white} size={18} />
              <Text style={styles.stickerText}>Sticker</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigate ? (
            <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
              <Navigation color={COLORS.white} size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.16)' },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.98)',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    ...SHADOW.card,
  },
  grabber: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  handle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: COLORS.bgInput,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  emojiButton: {
    minWidth: 54,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emojiText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    minHeight: 80,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
    ...SHADOW.card,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chatButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: COLORS.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  stickerButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stickerText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  navigateButton: {
    minHeight: 54,
    width: 54,
    borderRadius: 20,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
