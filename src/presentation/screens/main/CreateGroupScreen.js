import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Users } from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { chatService } from '../../../infrastructure/firebase/chatService';

function getInitials(name = '?') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

const GROUP_SUGGESTIONS = ['Weekend Riders', 'Do an LTDT', 'Check-in Team'];

export default function CreateGroupScreen({ navigation }) {
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
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'accepted')
      );
      const snapshot = await getDocs(friendshipsQuery);
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
            id: friendUid,
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
  };

  const toggleSelectFriend = (uid) => {
    setSelectedFriends((currentValue) =>
      currentValue.includes(uid)
        ? currentValue.filter((id) => id !== uid)
        : [...currentValue, uid]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Loi', 'Vui long nhap ten nhom.');
      return;
    }

    if (!selectedFriends.length) {
      Alert.alert('Loi', 'Hay chon it nhat mot nguoi ban.');
      return;
    }

    setCreating(true);
    try {
      const currentUid = auth.currentUser.uid;
      const memberIds = [currentUid, ...selectedFriends];
      await chatService.createGroup(groupName.trim(), currentUid, memberIds);
      Alert.alert('Thanh cong', 'Nhom moi da duoc tao.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Loi', `Khong the tao nhom: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const selectedFriendObjects = friends.filter((friend) => selectedFriends.includes(friend.id));

  return (
    <LinearGradient colors={['#081121', '#0F172A', '#182234']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tao nhom moi</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>Group Builder</Text>
        <Text style={styles.heroTitle}>Dung nhom cho chat va chia se vi tri</Text>
        <Text style={styles.heroText}>
          Nhom nay se duoc dung de hien thi ban be tren map, footprint va chat realtime.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputCard}>
          <View style={styles.inputLabelRow}>
            <Users color="#38BDF8" size={18} />
            <Text style={styles.inputLabel}>Ten nhom</Text>
          </View>
          <TextInput
            placeholder="Vi du: GeoLink Demo Team"
            placeholderTextColor="#64748B"
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
          />

          <View style={styles.suggestionRow}>
            {GROUP_SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setGroupName(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.selectionSummary}>
          <Text style={styles.selectionTitle}>Thanh vien duoc chon</Text>
          <Text style={styles.selectionCount}>{selectedFriends.length} nguoi</Text>
        </View>

        {!!selectedFriendObjects.length && (
          <View style={styles.selectedRow}>
            {selectedFriendObjects.map((friend) => (
              <View key={friend.id} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{friend.name}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.listTitle}>Danh sach ban be</Text>

        {loading ? (
          <ActivityIndicator color="#38BDF8" style={{ marginTop: 28 }} />
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedFriends.includes(item.id);

              return (
                <TouchableOpacity
                  style={[styles.friendCard, isSelected && styles.friendCardActive]}
                  onPress={() => toggleSelectFriend(item.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendMeta}>{item.email}</Text>
                  </View>
                  <View style={[styles.checkWrap, isSelected && styles.checkWrapActive]}>
                    {isSelected && <Check color="#062033" size={16} />}
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Chua co ban be nao de them. Ban co the qua man Friends va tao du lieu demo.
              </Text>
            }
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, creating && { opacity: 0.75 }]}
          onPress={handleCreateGroup}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#062033" />
          ) : (
            <Text style={styles.createButtonText}>Tao nhom</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  heroCard: {
    marginTop: 18,
    marginHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(17,28,46,0.96)',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.16)',
  },
  heroKicker: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
  },
  heroText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  inputCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(15,23,42,0.84)',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputLabel: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    paddingVertical: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },
  suggestionText: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
  },
  selectionSummary: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  selectionCount: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectedChipText: {
    color: '#062033',
    fontSize: 12,
    fontWeight: '800',
  },
  listTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 1,
  },
  list: {
    paddingBottom: 24,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.84)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
    gap: 12,
  },
  friendCardActive: {
    borderColor: 'rgba(56,189,248,0.56)',
    backgroundColor: 'rgba(11,32,55,0.96)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#243244',
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
  },
  friendName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  friendMeta: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
  },
  checkWrapActive: {
    backgroundColor: '#FACC15',
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: 34,
    paddingTop: 8,
  },
  createButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#062033',
    fontSize: 16,
    fontWeight: '900',
  },
});
