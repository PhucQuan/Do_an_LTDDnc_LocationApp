import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Search, UserPlus, Check, X, Users, LogOut } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { db, auth } from '../../../infrastructure/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { friendService } from '../../../infrastructure/firebase/friendService';
import { chatService } from '../../../infrastructure/firebase/chatService';

const FriendsListScreen = ({ navigation }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const currentUid = auth.currentUser.uid;

    const qFriends = query(
      collection(db, "friendships"),
      where("status", "==", "accepted")
    );

    const unsubFriends = onSnapshot(qFriends, async (snapshot) => {
      try {
        const friendsList = [];
        for (const d of snapshot.docs) {
          const data = d.data();
          let friendUid = null;
          if (data.userId1 === currentUid) friendUid = data.userId2;
          else if (data.userId2 === currentUid) friendUid = data.userId1;

          if (friendUid) {
            const userSnap = await getDoc(doc(db, "users", friendUid));
            if (userSnap.exists()) {
              friendsList.push({ id: d.id, ...userSnap.data(), uid: friendUid });
            }
          }
        }
        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    });

    const unsubGroups = chatService.subscribeToUserGroups(currentUid, async (userGroups) => {
      // Resolve names for direct chats
      const resolvedGroups = await Promise.all(userGroups.map(async (group) => {
        if (group.isDirect) {
          const otherUid = group.members.find(uid => uid !== currentUid);
          if (otherUid) {
            const userSnap = await getDoc(doc(db, "users", otherUid));
            if (userSnap.exists()) {
              return { ...group, name: userSnap.data().name };
            }
          }
        }
        return group;
      }));
      setGroups(resolvedGroups);
    });

    const unsubRequests = friendService.subscribeToPendingRequests(currentUid, (requests) => {
      setPendingRequests(requests);
    });

    return () => {
      unsubFriends();
      unsubRequests();
      unsubGroups();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    try {
      const user = await friendService.searchUserByEmail(searchEmail);
      if (user) {
        setFoundUser(user);
      } else {
        Alert.alert("Thông báo", "Không tìm thấy người dùng với email này.");
        setFoundUser(null);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tìm kiếm.");
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await friendService.addFriend(auth.currentUser.uid, targetUserId);
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn!");
      setFoundUser(null);
      setSearchEmail('');
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      Alert.alert("Thành công", "Bây giờ các bạn đã là bạn bè!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chấp nhận yêu cầu.");
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendService.declineFriendRequest(friendshipId);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể từ chối yêu cầu.");
    }
  };

  const handleLeaveGroup = (groupId) => {
    Alert.alert(
      "Rời nhóm",
      "Bạn có chắc chắn muốn rời khỏi nhóm này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời khỏi",
          style: "destructive",
          onPress: async () => {
            try {
              await chatService.leaveGroup(groupId, auth.currentUser.uid);
              Alert.alert("Thành công", "Bạn đã rời khỏi nhóm.");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể rời nhóm.");
            }
          }
        }
      ]
    );
  };

  const RequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarTextSmall}>{item.sender.name[0]}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.friendName}>{item.sender.name}</Text>
        <Text style={styles.friendStatus}>Muốn kết bạn với bạn</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptRequest(item.friendshipId)}>
          <Check color="#fff" size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineRequest(item.friendshipId)}>
          <X color="#fff" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const FriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name ? item.name[0] : '?'}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.isGhostMode ? '#94A3B8' : '#10B981' }]} />
      </View>
      <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
      </View>
    </View>
  );

  const GroupItem = ({ item }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const currentUid = auth.currentUser.uid;

    useEffect(() => {
      const unsubscribe = chatService.subscribeToUnreadCount(item.id, currentUid, (count) => {
        setUnreadCount(count);
      });
      return () => unsubscribe();
    }, [item.id]);

    return (
      <View style={styles.friendItem}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => navigation.navigate('Chat', { chatId: item.id, title: item.name, isGroup: !item.isDirect })}
        >
          <View style={[styles.avatar, { backgroundColor: '#1E293B' }]}>
            {item.isDirect ? (
              <Text style={styles.avatarText}>{item.name ? item.name[0] : '?'}</Text>
            ) : (
              <Users color="#38BDF8" size={24} />
            )}
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={[styles.friendStatus, unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
              {item.lastMessage ?
                `${item.lastMessage.senderName}: ${item.lastMessage.text}` :
                'Bắt đầu trò chuyện...'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {!item.isDirect && (
          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={() => handleLeaveGroup(item.id)}
          >
            <LogOut color="#EF4444" size={20} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity
          style={styles.createGroupBtn}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Users color="#38BDF8" size={24} />
          <Text style={styles.createGroupText}>Tạo nhóm</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <BlurView intensity={80} tint="dark" style={styles.searchBar}>
            <Search color="#94A3B8" size={20} />
            <TextInput 
                placeholder="Tìm bạn qua Email..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={searchEmail}
                onChangeText={setSearchEmail}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
            />
            {searching && <ActivityIndicator size="small" color="#38BDF8" />}
        </BlurView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {foundUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
            <View style={styles.resultCard}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarTextSmall}>{foundUser.name[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.friendName}>{foundUser.name}</Text>
                <Text style={styles.friendStatus}>{foundUser.email}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => handleAddFriend(foundUser.id)}>
                <UserPlus color="#fff" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setFoundUser(null)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lời mời kết bạn ({pendingRequests.length})</Text>
            {pendingRequests.map(req => (
              <RequestItem key={req.friendshipId} item={req} />
            ))}
          </View>
        )}

        {groups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trò chuyện ({groups.length})</Text>
            {groups.map(group => (
              <GroupItem key={group.id} item={group} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bạn bè ({friends.length})</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 20 }} />
          ) : friends.length > 0 ? (
            friends.map(friend => (
              <FriendItem key={friend.id} item={friend} />
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có bạn bè nào. Hãy tìm kiếm để kết bạn!</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  createGroupText: { color: '#38BDF8', marginLeft: 8, fontWeight: '600', fontSize: 14 },
  scrollContent: { paddingBottom: 30 },
  section: { marginBottom: 25 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: { flex: 1, color: '#F8FAFC', marginLeft: 10, fontSize: 16 },
  sectionTitle: { color: '#64748B', fontSize: 13, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', paddingHorizontal: 20 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    marginHorizontal: 20, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155'
  },
  requestCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    marginHorizontal: 20, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 10
  },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#10B981', padding: 8, borderRadius: 10 },
  declineBtn: { backgroundColor: '#EF4444', padding: 8, borderRadius: 10 },
  addBtn: { backgroundColor: '#38BDF8', padding: 10, borderRadius: 12 },
  closeBtn: { marginLeft: 10, padding: 5 },
  friendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, paddingHorizontal: 20 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155', position: 'relative'
  },
  avatarSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold' },
  avatarTextSmall: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#0F172A' },
  friendInfo: { flex: 1, marginLeft: 15 },
  friendName: { color: '#F8FAFC', fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  friendStatus: { color: '#94A3B8', fontSize: 13 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20, fontSize: 14, paddingHorizontal: 40 },
  leaveBtn: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
  unreadBadge: { backgroundColor: '#38BDF8', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 10 },
  unreadBadgeText: { color: '#0F172A', fontSize: 11, fontWeight: 'bold' },
  unreadText: { color: '#F8FAFC', fontWeight: '600' }
});

export default FriendsListScreen;
