import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Gift, MessageCircle, Plus, Users } from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { chatService } from '../../../infrastructure/firebase/chatService';
import { COLORS, SHADOW } from '../../theme';

function getAvatarUri(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=ffffff&color=2563eb&bold=true&size=256`;
}

export default function ChatListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!myUid) return undefined;

    const unsubGroups = chatService.subscribeToUserGroups(myUid, (list) => {
      setGroups(list);
    });

    const unsubDirect = chatService.subscribeToDirectChats(myUid, (list) => {
      setDirectChats(list);
      setLoading(false);
    });

    return () => {
      unsubGroups();
      unsubDirect();
    };
  }, [myUid]);

  // Build a merged flat list: groups first, then direct chats
  const allChats = [
    ...groups.map((g) => ({ _type: 'group', ...g })),
    ...directChats.map((d) => ({ _type: 'direct', ...d })),
  ];

  const totalMembers = groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);

  const renderRoom = ({ item }) => {
    if (item._type === 'group') {
      return (
        <TouchableOpacity
          style={styles.roomCard}
          onPress={() => navigation.navigate('GroupChat', { groupId: item.id, groupName: item.name })}
        >
          <View style={styles.roomIconWrap}>
            <LinearGradient colors={[COLORS.accent, COLORS.purple]} style={StyleSheet.absoluteFill} />
            <Users color={COLORS.white} size={24} />
          </View>
          <View style={styles.roomBody}>
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.roomMeta}>{item.members.length} members</Text>
            {item.lastMessage ? (
              <Text style={styles.roomPreview} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            ) : (
              <Text style={styles.roomPreviewEmpty}>No messages yet. Tap to open.</Text>
            )}
          </View>
          <ChevronRight color={COLORS.textMuted} size={20} />
        </TouchableOpacity>
      );
    }

    // Direct chat — always look up the OTHER member's name from memberNames
    const otherMemberId = item.members?.find((m) => m !== myUid) ?? item.id.split('_').find((p) => p !== myUid);
    const otherName = item.memberNames?.[otherMemberId] || 'Friend';
    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => navigation.navigate('DirectChat', { otherUid: otherMemberId, otherName })}
      >
        <View style={styles.roomIconWrap}>
          <Image source={{ uri: getAvatarUri(otherName) }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
        </View>
        <View style={styles.roomBody}>
          <Text style={styles.roomName}>{otherName}</Text>
          <Text style={styles.roomMeta}>Direct message</Text>
          {item.lastMessage ? (
            <Text style={styles.roomPreview} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          ) : (
            <Text style={styles.roomPreviewEmpty}>No messages yet.</Text>
          )}
        </View>
        <ChevronRight color={COLORS.textMuted} size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFFFFF', '#F5F7FF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerKicker}>location chat</Text>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Live group rooms for friends and meetups.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('GiftCenter')}>
            <Gift color={COLORS.textPrimary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateGroup')}>
            <Plus color={COLORS.white} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.accent }]}>{groups.length}</Text>
          <Text style={styles.statLabel}>groups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.green }]}>{directChats.length}</Text>
          <Text style={styles.statLabel}>direct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: COLORS.pink }]}>{totalMembers}</Text>
          <Text style={styles.statLabel}>members</Text>
        </View>
      </View>

      <FlatList
        data={allChats}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <MessageCircle color={COLORS.textMuted} size={64} />
              </View>
              <Text style={styles.emptyTitle}>No chats yet</Text>
              <Text style={styles.emptyText}>
                Start a group or message a friend from the Friends tab.
              </Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('CreateGroup')}>
                <Text style={styles.emptyActionText}>Create group</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} /> : <View style={{ height: 120 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerKicker: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginTop: 4,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.accent,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 22,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    ...SHADOW.card,
  },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: { paddingHorizontal: 20, gap: 12 },
  roomCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    ...SHADOW.card,
  },
  roomIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roomBody: { flex: 1, gap: 2 },
  roomName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  roomMeta: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  roomPreview: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  roomPreviewEmpty: { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: { marginBottom: 20 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', marginBottom: 8 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyAction: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
  },
  emptyActionText: { color: COLORS.white, fontWeight: '900', fontSize: 15 },
});
