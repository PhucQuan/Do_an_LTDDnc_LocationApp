import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { COLORS, SHADOW, SPACING } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STICKER_SETS = {
  reactions: [
    { emoji: '❤️', label: 'Love' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '👀', label: 'Eyes' },
    { emoji: '💀', label: 'Skull' },
    { emoji: '😂', label: 'LOL' },
    { emoji: '🎉', label: 'Party' },
    { emoji: '💯', label: '100' },
    { emoji: '⚡', label: 'Bolt' },
  ],
  vibes: [
    { emoji: '🌟', label: 'Star' },
    { emoji: '✨', label: 'Sparkle' },
    { emoji: '💫', label: 'Dizzy' },
    { emoji: '🌈', label: 'Rainbow' },
    { emoji: '🦄', label: 'Unicorn' },
    { emoji: '🍕', label: 'Pizza' },
    { emoji: '🍔', label: 'Burger' },
    { emoji: '☕', label: 'Coffee' },
  ],
  mood: [
    { emoji: '😍', label: 'Heart Eyes' },
    { emoji: '🥳', label: 'Party' },
    { emoji: '😎', label: 'Cool' },
    { emoji: '🤩', label: 'Star Struck' },
    { emoji: '😴', label: 'Sleepy' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '😱', label: 'Shocked' },
    { emoji: '🥺', label: 'Pleading' },
  ],
};

export function StickerReactionPicker({ visible, friendName, onSelect, onClose }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleSelect = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerContent}>
              <Text style={styles.title}>Send to {friendName || 'friend'}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X color={COLORS.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sticker grid */}
          <View style={styles.content}>
            {Object.entries(STICKER_SETS).map(([category, stickers]) => (
              <View key={category} style={styles.section}>
                <Text style={styles.categoryLabel}>{category}</Text>
                <View style={styles.grid}>
                  {stickers.map((sticker) => (
                    <TouchableOpacity
                      key={sticker.emoji}
                      style={styles.stickerBtn}
                      onPress={() => handleSelect(sticker.emoji)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.stickerWrap}>
                        <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
                      </View>
                      <Text style={styles.stickerLabel}>{sticker.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOW.card,
  },
  header: {
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    alignSelf: 'center',
    marginBottom: SPACING.md,
    opacity: 0.4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  categoryLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  stickerBtn: {
    width: '22%',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stickerWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...SHADOW.card,
  },
  stickerEmoji: {
    fontSize: 32,
  },
  stickerLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
