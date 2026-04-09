import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, MapPin, MessageCircle, Shield, Users } from 'lucide-react-native';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { authService } from '../../../infrastructure/firebase/authService';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { locationService } from '../../../infrastructure/firebase/locationService';

function getAvatarUri(profile, currentName) {
  return (
    profile?.avatarUrl ||
    auth.currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName)}&background=111827&color=FFFFFF&size=256`
  );
}

function StatCard({ label, value, accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    groups: 0,
    friends: 0,
    trails: 0,
  });
  const [ghostMode, setGhostMode] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
        setGhostMode(Boolean(userDoc.data().isGhostMode));
      }

      const groupsSnapshot = await getDocs(
        query(collection(db, 'groups'), where('members', 'array-contains', uid))
      );
      const friendshipsSnapshot = await getDocs(
        query(collection(db, 'friendships'), where('status', '==', 'accepted'))
      );
      const trailsSnapshot = await getDocs(
        query(collection(db, 'locations_history'), where('uid', '==', uid))
      );

      const friendCount = friendshipsSnapshot.docs.filter((entry) => {
        const data = entry.data();
        return data.userId1 === uid || data.userId2 === uid;
      }).length;

      setStats({
        groups: groupsSnapshot.size,
        friends: friendCount,
        trails: trailsSnapshot.size,
      });
    };

    loadProfile();
  }, []);

  const currentName = useMemo(
    () =>
      profile?.name ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'You',
    [profile?.name]
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Do you want to leave this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
          } catch (error) {
            Alert.alert('Error', 'Could not log out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleToggleGhostMode = async (value) => {
    setGhostMode(value);
    try {
      await locationService.setGhostMode(value);
      setProfile((current) => ({
        ...(current || {}),
        isGhostMode: value,
      }));
    } catch (error) {
      setGhostMode(!value);
      Alert.alert('Error', 'Could not update Ghost Mode right now.');
    }
  };

  return (
    <LinearGradient colors={['#F7E8D8', '#F3DCC4', '#ECD0B8']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.kicker}>your profile</Text>
              <Text style={styles.name}>{currentName}</Text>
              <Text style={styles.email}>{profile?.email || auth.currentUser?.email}</Text>
            </View>
            <Image source={{ uri: getAvatarUri(profile, currentName) }} style={styles.avatarImage} />
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Shield color="#111111" size={14} />
              <Text style={styles.badgeText}>secure sync</Text>
            </View>
            <View style={styles.badge}>
              <MapPin color="#111111" size={14} />
              <Text style={styles.badgeText}>live location</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={stats.friends} label="friends" accent="#2563EB" />
          <StatCard value={stats.groups} label="groups" accent="#F59E0B" />
          <StatCard value={stats.trails} label="trails" accent="#16A34A" />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Quick jumps</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Friends')}>
            <Users color="#111111" size={18} />
            <Text style={styles.actionText}>Open Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Chats')}>
            <MessageCircle color="#111111" size={18} />
            <Text style={styles.actionText}>Open Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('CreateGroup')}>
            <Users color="#111111" size={18} />
            <Text style={styles.actionText}>Create Group</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Privacy</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>Ghost Mode</Text>
              <Text style={styles.panelText}>
                Hide your live location from friends and stop broadcasting while enabled.
              </Text>
            </View>
            <Switch
              value={ghostMode}
              onValueChange={handleToggleGhostMode}
              trackColor={{ false: '#D1D5DB', true: '#111827' }}
              thumbColor={ghostMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Demo setup</Text>
          <Text style={styles.panelText}>
            Seed demo data from the Friends screen to populate live people, map trails, chat rooms and sample conversations.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#FFFFFF" size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: '#111111',
    padding: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'lowercase',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginTop: 4,
    textTransform: 'lowercase',
  },
  email: {
    color: '#B5BDC8',
    fontSize: 13,
    marginTop: 6,
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
  badgeText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'lowercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'lowercase',
  },
  panel: {
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.78)',
    padding: 16,
    gap: 10,
  },
  panelTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  actionRow: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  panelText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
  },
  toggleRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
