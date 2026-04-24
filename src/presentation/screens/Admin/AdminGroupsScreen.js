import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageSquare, Trash2, Users } from 'lucide-react-native';
import { adminService } from '../../../infrastructure/firebase/adminService';

const A = {
  bg: '#0A0E1A', card: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.1)',
  text: '#F1F5F9', sub: '#94A3B8', muted: '#475569',
  accent: '#7C3AED', red: '#EF4444', green: '#10B981',
};

export default function AdminGroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const list = await adminService.getAllGroups();
      setGroups(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (group) => {
    Alert.alert('Delete group', `Delete "${group.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteGroup(group.id);
            setGroups(prev => prev.filter(g => g.id !== group.id));
          } catch {
            Alert.alert('Error', 'Could not delete group.');
          }
        },
      },
    ]);
  };

  const formatDate = (ts) => {
    if (!ts?.toDate) return 'Unknown';
    return ts.toDate().toLocaleDateString('vi-VN');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#0A0E1A', '#111827']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.kicker}>admin · group management</Text>
        <Text style={styles.title}>
          Groups  <Text style={{ color: A.accent }}>{groups.length}</Text>
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {groups.length === 0 && (
            <Text style={styles.empty}>No groups found.</Text>
          )}
          {groups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              {/* Icon */}
              <View style={styles.groupIcon}>
                <MessageSquare color={A.accent} size={22} />
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{group.name || 'Unnamed Group'}</Text>
                <View style={styles.metaRow}>
                  <Users color={A.muted} size={13} />
                  <Text style={styles.metaText}>
                    {group.members?.length ?? 0} members
                  </Text>
                  <Text style={styles.separator}>·</Text>
                  <Text style={styles.metaText}>{formatDate(group.createdAt)}</Text>
                </View>

                {/* Members preview */}
                {group.members?.length > 0 && (
                  <View style={styles.membersWrap}>
                    {group.members.slice(0, 5).map((uid, i) => (
                      <View key={uid} style={[styles.memberDot, { zIndex: 10 - i, marginLeft: i === 0 ? 0 : -6 }]}>
                        <Text style={styles.memberInitial}>{i + 1}</Text>
                      </View>
                    ))}
                    {group.members.length > 5 && (
                      <Text style={styles.moreMembers}>+{group.members.length - 5}</Text>
                    )}
                  </View>
                )}
              </View>

              {/* Delete */}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(group)}>
                <Trash2 color={A.red} size={16} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 },
  kicker: { color: A.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: A.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  list: { paddingHorizontal: 18, gap: 10 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: A.card, borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: A.border,
  },
  groupIcon: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  groupName: { color: A.text, fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { color: A.muted, fontSize: 12 },
  separator: { color: A.muted },
  membersWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  memberDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#1e1b4b', borderWidth: 1.5,
    borderColor: '#0A0E1A', alignItems: 'center', justifyContent: 'center',
  },
  memberInitial: { color: '#a78bfa', fontSize: 9, fontWeight: '800' },
  moreMembers: { color: A.muted, fontSize: 11, marginLeft: 8 },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  empty: { color: A.muted, textAlign: 'center', paddingVertical: 60, fontSize: 15 },
});
