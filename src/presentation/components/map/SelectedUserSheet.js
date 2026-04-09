import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BatteryFull, MessageCircle, X } from 'lucide-react-native';

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'just now';
  }

  const diffMs = Date.now() - Number(timestamp);
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'Friend'
  )}&background=0F172A&color=FFFFFF&size=256`;
}

export function SelectedUserSheet({ user, onClose, onChat }) {
  const translateY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: user ? 0 : 420,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [translateY, user]);

  if (!user) {
    return null;
  }

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.identityRow}>
            <Image source={{ uri: user.avatarUrl || getFallbackAvatar(user.displayName) }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.displayName}</Text>
              <Text style={styles.handle}>@{(user.displayName || 'friend').replace(/\s+/g, '').toLowerCase()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#111111" size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{Math.max(Number(user.speedKmh || 0), 0).toFixed(0)}</Text>
            <Text style={styles.metricLabel}>km/h</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <BatteryFull color="#111111" size={16} />
              <Text style={styles.metricValue}>{Math.max(Number(user.batteryLevel || 0), 0).toFixed(0)}%</Text>
            </View>
            <Text style={styles.metricLabel}>battery</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatRelativeTime(user.updatedAt)}</Text>
            <Text style={styles.metricLabel}>updated</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.chatButton} onPress={() => onChat(user)}>
          <MessageCircle color="#FFFFFF" size={18} />
          <Text style={styles.chatText}>Chat</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.22)',
  },
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
    shadowColor: '#111111',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
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
    backgroundColor: '#E5E7EB',
  },
  name: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },
  handle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    justifyContent: 'space-between',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chatButton: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
