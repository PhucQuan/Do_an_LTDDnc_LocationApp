import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users, MessageSquare, Gift, TrendingUp,
  Ghost, UserCheck, LogOut, Activity,
} from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';
import { adminService } from '../../../infrastructure/firebase/adminService';

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

function KpiCard({ label, value, Icon, color, bg }) {
  return (
    <View style={[styles.kpiCard, { borderColor: color + '33' }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '22' }]}>
        <Icon color={color} size={20} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function RecentRow({ item }) {
  const time = item.createdAt?.toDate
    ? item.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  return (
    <View style={styles.actRow}>
      <View style={styles.actDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.actText} numberOfLines={1}>
          <Text style={{ color: A.accent }}>{item.senderName || 'User'}</Text>
          {' → '}
          <Text style={{ color: A.green }}>{item.recipientName || 'Friend'}</Text>
          {'  '}
          <Text style={{ color: A.yellow }}>{item.giftTitle}</Text>
          {' · '}{item.giftPrice}
        </Text>
      </View>
      <Text style={styles.actTime}>{time}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [recentGifts, setRecentGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, gifts] = await Promise.all([
          adminService.getStats(),
          adminService.getRecentGifts(5),
        ]);
        setStats(s);
        setRecentGifts(gifts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0A0E1A', '#111827', '#0A0E1A']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>admin panel</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color={A.red} size={18} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <LinearGradient
          colors={['#4C1D95', '#7C3AED', '#5B21B6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <Activity color="#fff" size={28} />
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.bannerTitle}>GeoLink Control Center</Text>
            <Text style={styles.bannerSub}>Real-time platform overview</Text>
          </View>
        </LinearGradient>

        {/* KPIs */}
        {loading ? (
          <ActivityIndicator color={A.accent} style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.kpiGrid}>
            <KpiCard label="Total Users" value={stats?.totalUsers} Icon={Users} color={A.blue} />
            <KpiCard label="Active (not ghost)" value={stats?.activeUsers} Icon={UserCheck} color={A.green} />
            <KpiCard label="Ghost Mode" value={stats?.ghostUsers} Icon={Ghost} color={A.muted} />
            <KpiCard label="Groups" value={stats?.totalGroups} Icon={MessageSquare} color={A.accent} />
            <KpiCard label="Gifts Sent" value={stats?.totalGifts} Icon={Gift} color={A.yellow} />
            <KpiCard label="Friendships" value={stats?.totalFriendships} Icon={TrendingUp} color={A.green} />
          </View>
        )}

        {/* Recent Gift Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Gift Activity</Text>
          <View style={styles.card}>
            {recentGifts.length === 0 ? (
              <Text style={styles.empty}>No gift transactions yet.</Text>
            ) : (
              recentGifts.map(item => <RecentRow key={item.id} item={item} />)
            )}
          </View>
        </View>

        {/* Quick Nav */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Navigate</Text>
          <View style={styles.quickRow}>
            {[
              { label: 'Users', tab: 'AdminUsers', color: A.blue, Icon: Users },
              { label: 'Groups', tab: 'AdminGroups', color: A.accent, Icon: MessageSquare },
              { label: 'Gifts', tab: 'AdminGifts', color: A.yellow, Icon: Gift },
            ].map(({ label, tab, color, Icon }) => (
              <TouchableOpacity
                key={tab}
                style={[styles.quickBtn, { borderColor: color + '44' }]}
                onPress={() => navigation.navigate(tab)}
              >
                <Icon color={color} size={22} />
                <Text style={[styles.quickLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  scroll: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  kicker: { color: A.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: A.text, fontSize: 30, fontWeight: '900', marginTop: 2 },
  logoutBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  banner: { borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 3 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  kpiCard: { width: '47%', borderRadius: 20, backgroundColor: A.card, borderWidth: 1, padding: 16, gap: 8 },
  kpiIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 32, fontWeight: '900' },
  kpiLabel: { color: A.sub, fontSize: 12, fontWeight: '700' },
  section: { marginVertical: 16 },
  sectionTitle: { color: A.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  card: { backgroundColor: A.card, borderRadius: 20, borderWidth: 1, borderColor: A.border, padding: 14, gap: 12 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: A.accent },
  actText: { color: A.sub, fontSize: 13, flex: 1 },
  actTime: { color: A.muted, fontSize: 11 },
  empty: { color: A.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, backgroundColor: A.card, borderWidth: 1, borderRadius: 18, paddingVertical: 18, alignItems: 'center', gap: 8 },
  quickLabel: { fontSize: 13, fontWeight: '800' },
});
