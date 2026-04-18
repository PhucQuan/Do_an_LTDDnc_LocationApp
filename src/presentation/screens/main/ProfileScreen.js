import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, LogOut, MapPin, MessageCircle, Shield, Users } from 'lucide-react-native';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { authService } from '../../../infrastructure/firebase/authService';
import { locationService } from '../../../infrastructure/firebase/locationService';
import { COLORS, SHADOW } from '../../theme';

function getAvatarUri(profile, currentName) {
  return (
    profile?.avatarUrl ||
    auth.currentUser?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName)}&background=ffffff&color=1d4ed8&size=256`
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
  const [stats, setStats] = useState({ groups: 0, friends: 0, trails: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }

      const groupsSnapshot = await getDocs(query(collection(db, 'groups'), where('members', 'array-contains', uid)));
      const friendshipsSnapshot = await getDocs(query(collection(db, 'friendships'), where('status', '==', 'accepted')));
      const trailsSnapshot = await getDocs(query(collection(db, 'locations_history'), where('uid', '==', uid)));

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
          setLoggingOut(true);
          try {
            await authService.logout();
          } catch {
            setLoggingOut(false);
            Alert.alert('Error', 'Could not log out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleQuickGhost = async () => {
    try {
      const nextValue = !profile?.isGhostMode;
      await locationService.setGhostMode(nextValue);
      setProfile((current) => ({ ...(current || {}), isGhostMode: nextValue }));
      Alert.alert('Updated', nextValue ? 'Ghost mode is on.' : 'Ghost mode is off.');
    } catch {
      Alert.alert('Error', 'Could not update ghost mode right now.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F4F7FF']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#DCEBFF', '#FDE7F3', '#FFF4CF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>your profile</Text>
              <Text style={styles.name}>{currentName}</Text>
              <Text style={styles.email}>{profile?.email || auth.currentUser?.email}</Text>
            </View>
            <Image source={{ uri: getAvatarUri(profile, currentName) }} style={styles.avatarImage} />
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Shield color={COLORS.textPrimary} size={14} />
              <Text style={styles.badgeText}>secure sync</Text>
            </View>
            <View style={styles.badge}>
              <MapPin color={COLORS.textPrimary} size={14} />
              <Text style={styles.badgeText}>live location</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={stats.friends} label="friends" accent={COLORS.accent} />
          <StatCard value={stats.groups} label="groups" accent={COLORS.purple} />
          <StatCard value={stats.trails} label="trails" accent={COLORS.green} />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Quick jumps</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Friends')}>
            <Users color={COLORS.textPrimary} size={18} />
            <Text style={styles.actionText}>Open friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('Chats')}>
            <MessageCircle color={COLORS.textPrimary} size={18} />
            <Text style={styles.actionText}>Open chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('CreateGroup')}>
            <Users color={COLORS.textPrimary} size={18} />
            <Text style={styles.actionText}>Create group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('GiftCenter')}>
            <Gift color={COLORS.textPrimary} size={18} />
            <Text style={styles.actionText}>Open Gift Center</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Privacy and visibility</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('PrivacySettings')}>
            <Shield color={COLORS.textPrimary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>Precise, approximate, freeze, ghost</Text>
              <Text style={styles.panelText}>Control how your location appears to friends.</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={handleQuickGhost}>
            <Shield color={COLORS.textPrimary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionText}>
                {profile?.isGhostMode ? 'Turn off ghost mode' : 'Turn on ghost mode'}
              </Text>
              <Text style={styles.panelText}>
                {profile?.isGhostMode ? 'You are hidden right now.' : 'Hide yourself from the live map quickly.'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Demo notes</Text>
          <Text style={styles.panelText}>
            To show yourself on screen for friends, keep location permission on, add friends, then use
            the map tab. Your avatar ring is the main live marker. Share a moment for extra visual flair.
          </Text>
        </View>

        <TouchableOpacity style={[styles.logoutButton, loggingOut && styles.logoutButtonLoading]} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <LogOut color={COLORS.white} size={18} />
          )}
          <Text style={styles.logoutText}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingTop: 56,
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.bgElevated,
    ...SHADOW.card,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.1,
    marginTop: 4,
  },
  email: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.66)',
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  panel: {
    borderRadius: 28,
    backgroundColor: COLORS.bgElevated,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  panelTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  actionRow: {
    minHeight: 60,
    borderRadius: 20,
    backgroundColor: COLORS.bgInput,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  panelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 22,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutButtonLoading: {
    opacity: 0.7,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
