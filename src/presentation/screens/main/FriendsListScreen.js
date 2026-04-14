import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  Database,
  LogOut,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { friendService } from '../../../infrastructure/firebase/friendService';
import { chatService } from '../../../infrastructure/firebase/chatService';
import { seedDemoSocialData } from '../../../seedData';

function getInitials(name = '?') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function getAvatarSource(user) {
  const uri =
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Friend')}&background=111827&color=FFFFFF&size=256`;
  return { uri };
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PersonRow({ user, rightNode, subtitle, accent = '#22C55E' }) {
  return (
    <View style={styles.personRow}>
      <View style={styles.avatarWrap}>
        <Image source={getAvatarSource(user)} style={styles.avatarImage} />
        <View style={[styles.avatarStatus, { backgroundColor: accent }]} />
      </View>
      <View style={styles.personBody}>
        <Text style={styles.personName}>{user?.name}</Text>
        <Text style={styles.personMeta}>{subtitle}</Text>
      </View>
      {rightNode}
    </View>
  );
}

export default function FriendsListScreen({ navigation }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      return undefined;
    }

    const qFriends = query(collection(db, 'friendships'), where('status', '==', 'accepted'));

    const unsubscribeFriends = onSnapshot(qFriends, async (snapshot) => {
      try {
        const friendList = [];

        for (const documentSnapshot of snapshot.docs) {
          const friendship = documentSnapshot.data();
          const friendUid =
            friendship.userId1 === currentUid
              ? friendship.userId2
              : friendship.userId2 === currentUid
                ? friendship.userId1
                : null;

          if (!friendUid) {
            continue;
          }

          const userSnapshot = await getDoc(doc(db, 'users', friendUid));
          if (userSnapshot.exists()) {
            friendList.push({
              id: documentSnapshot.id,
              uid: friendUid,
              ...userSnapshot.data(),
            });
          }
        }

        setFriends(friendList);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    });

    const unsubscribeGroups = chatService.subscribeToUserGroups(currentUid, setGroups);
    const unsubscribeRequests = friendService.subscribeToPendingRequests(currentUid, setPendingRequests);

    return () => {
      unsubscribeFriends();
      unsubscribeGroups();
      unsubscribeRequests();
    };
  }, []);

  const onlineFriends = useMemo(
    () => friends.filter((friend) => !friend.isGhostMode).length,
    [friends]
  );

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      return;
    }

    setSearching(true);
    try {
      const user = await friendService.searchUserByEmail(searchEmail);
      if (!user) {
        Alert.alert('Not found', 'No user matches that email yet.');
        setFoundUser(null);
        return;
      }

      setFoundUser(user);
    } catch (error) {
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await friendService.addFriend(auth.currentUser.uid, targetUserId);
      Alert.alert('Sent', 'Friend request was sent.');
      setFoundUser(null);
      setSearchEmail('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      Alert.alert('Accepted', 'You are friends now.');
    } catch (error) {
      Alert.alert('Error', 'Could not accept the request.');
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendService.declineFriendRequest(friendshipId);
    } catch (error) {
      Alert.alert('Error', 'Could not decline the request.');
    }
  };

  const handleLeaveGroup = (groupId) => {
    Alert.alert('Leave group', 'Do you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatService.leaveGroup(groupId, auth.currentUser.uid);
          } catch (error) {
            Alert.alert('Error', 'Could not leave this group.');
          }
        },
      },
    ]);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoSocialData();
      Alert.alert(
        'Demo ready',
        `Created ${result.createdUsers.length} mock profiles and ${result.createdGroups.length} groups.`
      );
    } catch (error) {
      Alert.alert('Seed failed', error.message || 'Could not create demo data.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <LinearGradient colors={['#F7E8D8', '#F5E5D6', '#ECD3BE']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>your friends</Text>
            <Text style={styles.title}>people nearby</Text>
            <Text style={styles.subtitle}>Search, seed demo data, manage groups and keep your social graph ready for the map.</Text>
          </View>
          <TouchableOpacity style={styles.createGroupBtn} onPress={() => navigation.navigate('CreateGroup')}>
            <Plus color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={friends.length} label="friends" />
          <StatCard value={onlineFriends} label="online" />
          <StatCard value={groups.length} label="groups" />
        </View>

        <View style={styles.seedCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.seedTitle}>Load demo people and map trails</Text>
            <Text style={styles.seedText}>This fills friends, groups, realtime locations, chat messages and footprints so the whole app feels alive.</Text>
          </View>
          <TouchableOpacity style={styles.seedButton} onPress={handleSeedDemo} disabled={seeding}>
            {seeding ? <ActivityIndicator color="#111111" /> : <Database color="#111111" size={16} />}
          </TouchableOpacity>
        </View>

        <View style={styles.searchCard}>
          <Search color="#111111" size={18} />
          <TextInput
            placeholder="Search by email"
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={searchEmail}
            onChangeText={setSearchEmail}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.searchButtonText}>Go</Text>}
          </TouchableOpacity>
        </View>

        {foundUser && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Search result</Text>
            <View style={styles.sheetCard}>
              <PersonRow
                user={foundUser}
                subtitle={foundUser.email}
                rightNode={
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.blueButton} onPress={() => handleAddFriend(foundUser.id)}>
                      <UserPlus color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghostButton} onPress={() => setFoundUser(null)}>
                      <X color="#111111" size={16} />
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          </View>
        )}

        {pendingRequests.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Pending requests</Text>
            <View style={styles.sheetCard}>
              {pendingRequests.map((request) => (
                <PersonRow
                  key={request.friendshipId}
                  user={request.sender}
                  subtitle="wants to add you"
                  accent="#F59E0B"
                  rightNode={
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.greenButton}
                        onPress={() => handleAcceptRequest(request.friendshipId)}
                      >
                        <Check color="#FFFFFF" size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.redButton}
                        onPress={() => handleDeclineRequest(request.friendshipId)}
                      >
                        <X color="#FFFFFF" size={16} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Your groups</Text>
            <Text style={styles.blockMeta}>{groups.length}</Text>
          </View>
          <View style={styles.sheetCard}>
            {groups.length ? (
              groups.map((group) => (
                <View key={group.id} style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Users color="#111111" size={18} />
                  </View>
                  <View style={styles.personBody}>
                    <Text style={styles.personName}>{group.name}</Text>
                    <Text style={styles.personMeta}>{group.members.length} members</Text>
                  </View>
                  <TouchableOpacity style={styles.ghostButton} onPress={() => handleLeaveGroup(group.id)}>
                    <LogOut color="#B91C1C" size={16} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No groups yet. Create one to test the shared location flow.</Text>
            )}
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>All friends</Text>
            <Text style={styles.blockMeta}>{friends.length}</Text>
          </View>
          <View style={styles.sheetCard}>
            {loading ? (
              <ActivityIndicator color="#111111" style={{ marginVertical: 24 }} />
            ) : friends.length ? (
              friends.map((friend) => (
                <PersonRow
                  key={friend.uid}
                  user={friend}
                  subtitle={friend.email}
                  accent={friend.isGhostMode ? '#9CA3AF' : '#22C55E'}
                  rightNode={
                    <View style={[styles.statusPill, friend.isGhostMode && styles.statusPillGhost]}>
                      <Text style={[styles.statusPillText, friend.isGhostMode && styles.statusPillTextGhost]}>
                        {friend.isGhostMode ? 'ghost' : 'live'}
                      </Text>
                    </View>
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No friends yet. Search someone or seed demo data to populate the app.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep slate background
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  kicker: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.2,
    textTransform: 'lowercase',
    marginTop: 2,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 250,
  },
  createGroupBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statValue: {
    color: '#38BDF8',
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'lowercase',
  },
  seedCard: {
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  seedTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  seedText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  seedButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCard: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 48,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  block: {
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '900',
  },
  blockMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 10,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: '#334155',
  },
  avatarStatus: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  personBody: {
    flex: 1,
  },
  personName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  personMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  blueButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusPillGhost: {
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  statusPillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusPillTextGhost: {
    color: '#94A3B8',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
});
