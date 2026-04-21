import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, MapPin, Plus, UserPlus, Users, X, Zap } from 'lucide-react-native';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { friendService } from '../../../infrastructure/firebase/friendService';
import { chatService } from '../../../infrastructure/firebase/chatService';
import { seedDemoSocialData } from '../../../seedData';
import { COLORS, LAYOUT, SHADOW, SPACING } from '../../theme';

function getAvatarUri(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'B')}&background=ffffff&color=2563eb&bold=true&size=256`;
}

function StatCard({ value, label, accent = COLORS.accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FriendRow({ user, rightNode, onPress }) {
  return (
    <TouchableOpacity style={styles.friendRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: getAvatarUri(user?.name) }} style={styles.avatar} />
        <View style={[styles.dot, { backgroundColor: user?.isGhostMode ? COLORS.offline : COLORS.online }]} />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{user?.name || 'Friend'}</Text>
        <Text style={styles.friendSub}>
          {user?.isGhostMode
            ? 'Ghost mode enabled'
            : `@${user?.username || user?.email?.split('@')[0] || 'friend'}`}
        </Text>
      </View>
      {rightNode}
    </TouchableOpacity>
  );
}

function OnlineFriendAvatar({ user, onPress }) {
  return (
    <TouchableOpacity style={styles.onlineFriendItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.onlineAvatarWrap}>
        <Image source={{ uri: getAvatarUri(user?.name) }} style={styles.onlineAvatar} />
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.onlineFriendName} numberOfLines={1}>
        {user?.name?.split(' ')[0] || 'Friend'}
      </Text>
    </TouchableOpacity>
  );
}

export default function FriendsListScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return undefined;

    const qFriends = query(collection(db, 'friendships'), where('status', '==', 'accepted'));

    const unsubFriends = onSnapshot(qFriends, async (snapshot) => {
      try {
        const list = [];
        for (const snap of snapshot.docs) {
          const f = snap.data();
          const fUid = f.userId1 === currentUid ? f.userId2 : f.userId2 === currentUid ? f.userId1 : null;
          if (!fUid) continue;
          const uSnap = await getDoc(doc(db, 'users', fUid));
          if (uSnap.exists()) list.push({ id: snap.id, uid: fUid, ...uSnap.data() });
        }
        setFriends(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    const unsubGroups = chatService.subscribeToUserGroups(currentUid, setGroups);
    const unsubRequests = friendService.subscribeToPendingRequests(currentUid, setPendingRequests);

    return () => {
      unsubFriends();
      unsubGroups();
      unsubRequests();
    };
  }, []);

  const onlineFriendsList = useMemo(() => friends.filter((f) => !f.isGhostMode), [friends]);
  const onlineCount = onlineFriendsList.length;

  const handleAccept = async (id) => {
    try {
      await friendService.acceptFriendRequest(id);
    } catch {
      Alert.alert('Error', 'Could not accept request.');
    }
  };

  const handleDecline = async (id) => {
    try {
      await friendService.declineFriendRequest(id);
    } catch {
      Alert.alert('Error', 'Could not decline request.');
    }
  };

  const handleLeaveGroup = (groupId) => {
    Alert.alert('Leave group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatService.leaveGroup(groupId, auth.currentUser.uid);
          } catch {
            Alert.alert('Error', 'Could not leave this group.');
          }
        },
      },
    ]);
  };

  const handleOpenChat = async (friend) => {
    const myUid = auth.currentUser?.uid;
    if (!myUid) return;

    try {
      await chatService.ensureDirectChatExists(myUid, friend.uid, friend);
      navigation.navigate('DirectChat', {
        otherUid: friend.uid,
        otherName: friend.name || friend.email?.split('@')[0] || 'Friend',
      });
    } catch (e) {
      Alert.alert('Error', 'Could not open chat.');
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoSocialData();
      Alert.alert(
        'Demo ready',
        `Created ${result.createdUsers.length} demo friends and ${result.createdGroups.length} groups.`
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not seed demo data.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFFFFF', '#F4F7FF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerKicker}>social layer</Text>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>Build the circles that appear on your map.</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddFriend')}>
          <UserPlus color={COLORS.white} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* New Online Friends Horizontal Section */}
        {onlineCount > 0 && (
          <View style={styles.onlineSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onlineScroll}>
              {onlineFriendsList.map((friend) => (
                <OnlineFriendAvatar
                  key={friend.uid}
                  user={friend}
                  onPress={() => handleOpenChat(friend)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard value={friends.length} label="friends" />
          <StatCard value={onlineCount} label="visible now" accent={COLORS.green} />
          <StatCard value={groups.length} label="groups" accent={COLORS.purple} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateGroup')}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.accentDim }]}>
              <Plus color={COLORS.accent} size={20} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>Create group</Text>
              <Text style={styles.actionHint}>Start a location room for friends.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleSeedDemo} disabled={seeding}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245,183,0,0.14)' }]}>
              {seeding ? (
                <ActivityIndicator size="small" color={COLORS.yellow} />
              ) : (
                <Zap color={COLORS.yellow} size={20} />
              )}
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>Seed demo</Text>
              <Text style={styles.actionHint}>Fill the app with sample users.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {pendingRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend requests</Text>
            <View style={styles.card}>
              {pendingRequests.map((req) => (
                <FriendRow
                  key={req.friendshipId}
                  user={req.sender}
                  rightNode={
                    <View style={styles.btnGroup}>
                      <TouchableOpacity style={styles.btnAccept} onPress={() => handleAccept(req.friendshipId)}>
                        <Check color={COLORS.white} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnDecline} onPress={() => handleDecline(req.friendshipId)}>
                        <X color={COLORS.textPrimary} size={16} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Groups</Text>
            <Text style={styles.sectionCount}>{groups.length}</Text>
          </View>
          <View style={styles.card}>
            {groups.length ? (
              groups.map((group) => (
                <View key={group.id} style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Users color={COLORS.accent} size={18} />
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{group.name}</Text>
                    <Text style={styles.friendSub}>{group.members.length} members</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.groupChatBtn}
                    onPress={() => navigation.navigate('GroupChat', { groupId: group.id, groupName: group.name })}
                  >
                    <Text style={styles.groupChatBtnText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.leaveBtn} onPress={() => handleLeaveGroup(group.id)}>
                    <Text style={styles.leaveText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No groups yet. Tap "Create group" to get started.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All friends</Text>
            <Text style={styles.sectionCount}>{friends.length}</Text>
          </View>
          <View style={styles.card}>
            {loading ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
            ) : friends.length ? (
              friends.map((friend) => (
                <FriendRow
                  key={friend.uid}
                  user={friend}
                  onPress={() => handleOpenChat(friend)}
                  rightNode={
                    <View style={styles.friendActions}>
                      <TouchableOpacity
                        style={[styles.pill, friend.isGhostMode && styles.pillGhost]}
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate('Map', { focusUid: friend.uid });
                        }}
                      >
                        <MapPin size={13} color={friend.isGhostMode ? COLORS.textMuted : COLORS.accent} />
                        <Text style={[styles.pillText, friend.isGhostMode && styles.pillTextGhost, { marginLeft: 4 }]}>
                          {friend.isGhostMode ? 'Hidden' : 'Live'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No friends yet. Tap the plus button to add someone.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: LAYOUT.tabBarBottom + LAYOUT.tabBarHeight + SPACING.xxl,
  },
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
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.accent,
  },
  onlineSection: {
    marginBottom: 24,
    marginHorizontal: -16,
  },
  onlineScroll: {
    paddingHorizontal: 20,
    gap: 18,
  },
  onlineFriendItem: {
    alignItems: 'center',
    width: 64,
  },
  onlineAvatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: '#F3F4F6',
    padding: 2,
    ...SHADOW.card,
  },
  onlineAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.online,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  onlineFriendName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
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
  actionRow: { gap: 12, marginBottom: 28 },
  actionCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 26,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { flex: 1 },
  actionLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  actionHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  sectionCount: { color: COLORS.accent, fontSize: 14, fontWeight: '900' },
  card: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: 6,
    ...SHADOW.card,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 14,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: 2,
    backgroundColor: '#F3F4F6',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 20, backgroundColor: COLORS.bgSoft },
  dot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  friendInfo: { flex: 1 },
  friendName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  friendSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 22,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupChatBtn: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
  },
  groupChatBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  leaveBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveText: { color: COLORS.danger, fontWeight: '900' },
  btnGroup: { flexDirection: 'row', gap: 10 },
  btnAccept: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDecline: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillGhost: { backgroundColor: COLORS.bgInput },
  pillText: { color: COLORS.green, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  pillTextGhost: { color: COLORS.textMuted },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    padding: 32,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});
