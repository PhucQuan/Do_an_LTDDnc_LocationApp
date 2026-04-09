import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, Sparkles, Users } from 'lucide-react-native';
import { auth } from '../../../infrastructure/firebase/firebase';
import { chatService } from '../../../infrastructure/firebase/chatService';

function getAccent(index) {
  const colors = ['#F472B6', '#38BDF8', '#FACC15', '#34D399'];
  return colors[index % colors.length];
}

export default function ChatListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = chatService.subscribeToUserGroups(currentUid, (nextGroups) => {
      setGroups(nextGroups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalMembers = useMemo(
    () => groups.reduce((sum, group) => sum + (group.members?.length || 0), 0),
    [groups]
  );

  return (
    <LinearGradient colors={['#08090D', '#111318', '#1B1117']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>your convos</Text>
        <Text style={styles.title}>chat rooms</Text>
        <Text style={styles.subtitle}>
          Realtime group conversations, seeded demo messages and quick room handoffs from the map.
        </Text>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{groups.length}</Text>
          <Text style={styles.statLabel}>rooms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalMembers}</Text>
          <Text style={styles.statLabel}>members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>live</Text>
          <Text style={styles.statLabel}>sync</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Sparkles color="#FACC15" size={18} />
        <Text style={styles.heroText}>
          Open a room to see seeded demo messages first, then send your own live updates.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#FFFFFF" style={{ marginTop: 28 }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.roomCard}
              activeOpacity={0.86}
              onPress={() =>
                navigation.navigate('GroupChat', {
                  groupId: item.id,
                  groupName: item.name,
                })
              }
            >
              <View style={[styles.roomBadge, { backgroundColor: getAccent(index) }]}>
                <Users color="#111111" size={18} />
              </View>
              <View style={styles.roomBody}>
                <Text style={styles.roomName}>{item.name}</Text>
                <Text style={styles.roomMeta}>{item.members.length} people inside</Text>
                <Text style={styles.roomPreview} numberOfLines={1}>
                  {item.lastMessage || 'No message yet. Tap to open the room.'}
                </Text>
              </View>
              <View style={styles.roomAction}>
                <MessageCircle color="#FFFFFF" size={16} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptyText}>
                Create a group or seed demo data from Friends to make this screen come alive.
              </Text>
            </View>
          }
        />
      )}
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
  },
  kicker: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.1,
    textTransform: 'lowercase',
    marginTop: 2,
  },
  subtitle: {
    color: '#A7AFBF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 270,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'lowercase',
  },
  statLabel: {
    color: '#939AA8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'lowercase',
  },
  heroCard: {
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 12,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
  },
  roomBadge: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomBody: {
    flex: 1,
  },
  roomName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  roomMeta: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  roomPreview: {
    color: '#A7AFBF',
    fontSize: 12,
    marginTop: 6,
  },
  roomAction: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 18,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#A7AFBF',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
