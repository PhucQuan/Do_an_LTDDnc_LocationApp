import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, ArrowLeft, Check, Plus } from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { chatService } from '../../../infrastructure/firebase/chatService';

const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const currentUid = auth.currentUser.uid;
      const q = query(collection(db, "friendships"), where("status", "==", "accepted"));
      const snapshot = await getDocs(q);

      const friendsList = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        let friendUid = data.userId1 === currentUid ? data.userId2 : (data.userId2 === currentUid ? data.userId1 : null);

        if (friendUid) {
          const userSnap = await getDoc(doc(db, "users", friendUid));
          if (userSnap.exists()) {
            friendsList.push({ id: friendUid, ...userSnap.data() });
          }
        }
      }
      setFriends(friendsList);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectFriend = (uid) => {
    if (selectedFriends.includes(uid)) {
      setSelectedFriends(selectedFriends.filter(id => id !== uid));
    } else {
      setSelectedFriends([...selectedFriends, uid]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedFriends.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một người bạn");
      return;
    }

    setCreating(true);
    try {
      const currentUid = auth.currentUser.uid;
      const memberIds = [currentUid, ...selectedFriends];
      await chatService.createGroup(groupName, currentUid, memberIds);

      Alert.alert("Thành công", "Nhóm đã được tạo!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo nhóm: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedItem]}
        onPress={() => toggleSelectFriend(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <Text style={styles.friendName}>{item.name}</Text>
        {isSelected && <Check color="#38BDF8" size={20} />}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm mới</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Users color="#64748B" size={20} style={styles.inputIcon} />
          <TextInput
            placeholder="Tên nhóm trò chuyện"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <Text style={styles.sectionTitle}>Chọn bạn bè ({selectedFriends.length})</Text>

        {loading ? (
          <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.emptyText}>Bạn chưa có bạn bè nào để thêm</Text>}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.createButton, creating && { opacity: 0.7 }]}
        onPress={handleCreateGroup}
        disabled={creating}
      >
        {creating ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.createButtonText}>Tạo nhóm</Text>}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 16, marginBottom: 24, paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 16 },
  sectionTitle: { color: '#64748B', fontSize: 13, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  list: { paddingBottom: 20 },
  friendItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155'
  },
  selectedItem: { borderColor: '#38BDF8', backgroundColor: '#1E293B' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  friendName: { flex: 1, color: '#F8FAFC', fontSize: 16 },
  createButton: { backgroundColor: '#38BDF8', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', margin: 20, marginBottom: 40 },
  createButtonText: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20 }
});

export default CreateGroupScreen;
