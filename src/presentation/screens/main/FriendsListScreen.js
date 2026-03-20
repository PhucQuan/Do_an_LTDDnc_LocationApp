import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Search, UserPlus, Check, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { db, auth } from '../../../infrastructure/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { friendService } from '../../../infrastructure/firebase/friendService';

const FriendsListScreen = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Lấy danh sách bạn bè thời gian thực
  useEffect(() => {
    const currentUid = auth.currentUser.uid;

    // Truy vấn tất cả các mối quan hệ bạn bè mà user này tham gia
    const q = query(
      collection(db, "friendships"),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
        console.error("Error fetching friends details:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
      Alert.alert("Thành công", "Đã kết bạn thành công!");
      setFoundUser(null);
      setSearchEmail('');
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    }
  };

  const FriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem}>
      <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name ? item.name[0] : '?'}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.isGhostMode ? '#94A3B8' : '#10B981' }]} />
      </View>
      <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendStatus}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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

      {/* Kết quả tìm kiếm */}
      {foundUser && (
        <View style={styles.searchResult}>
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

      {loading ? (
        <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FriendItem item={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Bạn bè ({friends.length})</Text>}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có bạn bè nào. Hãy tìm kiếm để kết bạn!</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: { flex: 1, color: '#F8FAFC', marginLeft: 10, fontSize: 16 },
  sectionTitle: { color: '#64748B', fontSize: 13, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase', paddingHorizontal: 20 },
  searchResult: { marginBottom: 30 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    marginHorizontal: 20, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155'
  },
  addBtn: { backgroundColor: '#38BDF8', padding: 10, borderRadius: 12 },
  closeBtn: { marginLeft: 10, padding: 5 },
  listContent: { paddingBottom: 20 },
  friendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
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
  friendStatus: { color: '#94A3B8', fontSize: 14 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 40, fontSize: 15 }
});

export default FriendsListScreen;
