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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, Users } from 'lucide-react-native';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { chatService } from '../../../infrastructure/firebase/chatService';
import { COLORS, SHADOW } from '../../theme';

function getInitials(name = '?') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

const SUGGESTIONS = ['Weekend vibes', 'Group project', 'Check-in crew', 'Coffee run'];

export default function CreateGroupScreen({ navigation }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser.uid;
        const snap = await getDocs(query(collection(db, 'friendships'), where('status', '==', 'accepted')));
        const list = [];
        for (const d of snap.docs) {
          const f = d.data();
          const fUid = f.userId1 === uid ? f.userId2 : f.userId2 === uid ? f.userId1 : null;
          if (!fUid) continue;
          const us = await getDoc(doc(db, 'users', fUid));
          if (us.exists()) list.push({ id: fUid, ...us.data() });
        }
        setFriends(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (uid) =>
    setSelectedFriends((prev) => (prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]));

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    if (!selectedFriends.length) {
      Alert.alert('Error', 'Pick at least one friend.');
      return;
    }
    setCreating(true);
    try {
      const uid = auth.currentUser.uid;
      await chatService.createGroup(groupName.trim(), uid, [uid, ...selectedFriends]);
      Alert.alert('Created', 'Your group has been created.', [{ text: 'Great', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', `Could not create group: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FFFFFF', '#F5F7FF']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New group</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Users color={COLORS.accent} size={16} />
            <Text style={styles.label}>Group name</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekend Riders"
            placeholderTextColor={COLORS.textMuted}
            value={groupName}
            onChangeText={setGroupName}
          />
          <View style={styles.chipRow}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => setGroupName(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.memberHeader}>
          <Text style={styles.memberTitle}>Select members</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberCount}>{selectedFriends.length} selected</Text>
          </View>
        </View>

        <View style={styles.listWrap}>
          {loading ? <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} /> : null}
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = selectedFriends.includes(item.id);
              return (
                <TouchableOpacity style={[styles.friendRow, active && styles.friendRowActive]} onPress={() => toggle(item.id)}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <Text style={styles.friendEmail}>{item.username || item.email}</Text>
                  </View>
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active ? <Check color={COLORS.white} size={14} /> : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.emptyText}>No friends yet. Add friends first to create a group.</Text>
              ) : null
            }
          />
        </View>

        <TouchableOpacity
          style={[styles.createBtn, (!groupName.trim() || !selectedFriends.length) && { opacity: 0.5 }]}
          onPress={handleCreate}
          disabled={creating || !groupName.trim() || !selectedFriends.length}
        >
          {creating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.createBtnText}>Create group</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  content: { flex: 1, padding: 20 },
  inputSection: { marginBottom: 28 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  label: { color: COLORS.accent, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chip: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  memberTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  memberBadge: {
    backgroundColor: COLORS.accentDim,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  memberCount: { color: COLORS.accent, fontSize: 12, fontWeight: '900' },
  listWrap: { flex: 1, marginBottom: 20 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 22,
    backgroundColor: COLORS.bgElevated,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  friendRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.accent, fontSize: 18, fontWeight: '900' },
  friendInfo: { flex: 1, marginLeft: 14 },
  friendName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  friendEmail: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  createBtn: {
    height: 60,
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.accent,
  },
  createBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
