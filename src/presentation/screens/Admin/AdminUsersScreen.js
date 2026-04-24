import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Shield, ShieldOff, Trash2, UserX, UserCheck } from 'lucide-react-native';
import { adminService } from '../../../infrastructure/firebase/adminService';
import { auth } from '../../../infrastructure/firebase/firebase';

const A = {
  bg: '#0A0E1A',
  card: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.1)',
  text: '#F1F5F9',
  sub: '#94A3B8',
  muted: '#475569',
  accent: '#7C3AED',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

function getAvatar(user) {
  return user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=1e1b4b&color=a78bfa&bold=true&size=128`;
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <View style={[styles.badge, { backgroundColor: isAdmin ? 'rgba(124,58,237,0.2)' : 'rgba(148,163,184,0.15)' }]}>
      <Text style={[styles.badgeText, { color: isAdmin ? '#A78BFA' : A.muted }]}>
        {isAdmin ? '👑 Admin' : 'User'}
      </Text>
    </View>
  );
}

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = adminService.subscribeToUsers((list) => {
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const myUid = auth.currentUser?.uid;

  const handleSetRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    Alert.alert(
      `Set role → ${newRole}`,
      `Change ${user.name || user.email} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try { await adminService.setUserRole(user.uid, newRole); }
            catch { Alert.alert('Error', 'Could not update role.'); }
          },
        },
      ]
    );
  };

  const handleBan = (user) => {
    const action = user.isBanned ? 'Unban' : 'Ban';
    Alert.alert(`${action} user`, `${action} ${user.name || user.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: 'destructive',
        onPress: async () => {
          try { await adminService.toggleBan(user.uid, !user.isBanned); }
          catch { Alert.alert('Error', 'Could not update user.'); }
        },
      },
    ]);
  };

  const handleDelete = (user) => {
    if (user.uid === myUid) { Alert.alert('Cannot delete yourself.'); return; }
    Alert.alert('Delete user', `Remove ${user.name || user.email} from database?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await adminService.deleteUserDoc(user.uid); }
          catch { Alert.alert('Error', 'Could not delete user.'); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#0A0E1A', '#111827']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.kicker}>admin · user management</Text>
        <Text style={styles.title}>Users  <Text style={{ color: A.accent }}>{users.length}</Text></Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search color={A.muted} size={16} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email..."
          placeholderTextColor={A.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.map((user) => (
            <View key={user.uid} style={[styles.userCard, user.isBanned && styles.banned]}>
              <Image source={{ uri: getAvatar(user) }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{user.name || 'No Name'}</Text>
                  <RoleBadge role={user.role} />
                </View>
                <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: user.isGhostMode ? A.muted : A.green }]} />
                  <Text style={styles.statusText}>
                    {user.isBanned ? '🚫 Banned' : user.isGhostMode ? 'Ghost' : 'Active'}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleSetRole(user)}>
                  {user.role === 'admin'
                    ? <ShieldOff color={A.muted} size={16} />
                    : <Shield color={A.accent} size={16} />
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleBan(user)}>
                  {user.isBanned
                    ? <UserCheck color={A.green} size={16} />
                    : <UserX color={A.yellow} size={16} />
                  }
                </TouchableOpacity>
                {user.uid !== myUid && (
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(user)}>
                    <Trash2 color={A.red} size={16} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No users found.</Text>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  kicker: { color: A.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: A.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 18, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: A.border },
  searchInput: { flex: 1, color: A.text, fontSize: 14 },
  list: { paddingHorizontal: 18, gap: 10 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: A.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: A.border },
  banned: { opacity: 0.5, borderColor: 'rgba(239,68,68,0.3)' },
  avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#1e1b4b' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { color: A.text, fontSize: 15, fontWeight: '800', flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  email: { color: A.sub, fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: A.muted, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: A.border },
  empty: { color: A.muted, textAlign: 'center', paddingVertical: 40, fontSize: 14 },
});
