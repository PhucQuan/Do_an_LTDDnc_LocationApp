import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Gift, SendHorizonal, Sparkles } from 'lucide-react-native';
import { COLORS, SHADOW } from '../../theme';

const CATEGORIES = ['All', 'Cute', 'Food', 'Top-up', 'Voucher'];

const GIFTS = [
  { id: 'g1', title: 'Milk Tea Drop', subtitle: 'Cute surprise for besties', price: '29.000d', category: 'Food', accent: ['#FFE7D6', '#FFD0E7'] },
  { id: 'g2', title: 'Coffee Ping', subtitle: 'Morning energy in one tap', price: '35.000d', category: 'Food', accent: ['#FDE68A', '#FCA5A5'] },
  { id: 'g3', title: 'Sticker Burst', subtitle: 'Locket-style reaction pack', price: '9.000d', category: 'Cute', accent: ['#D8F3FF', '#E9D5FF'] },
  { id: 'g4', title: 'Phone Top-up 20K', subtitle: 'Quick recharge gift', price: '20.000d', category: 'Top-up', accent: ['#DBEAFE', '#BFDBFE'] },
  { id: 'g5', title: 'Phone Top-up 50K', subtitle: 'Big recharge for someone close', price: '50.000d', category: 'Top-up', accent: ['#E0EAFF', '#C7D2FE'] },
  { id: 'g6', title: 'Movie Voucher', subtitle: 'Weekend hangout idea', price: '79.000d', category: 'Voucher', accent: ['#FCE7F3', '#FDE68A'] },
  { id: 'g7', title: 'Midnight Snack', subtitle: 'Late-night comfort gift', price: '45.000d', category: 'Food', accent: ['#E9D5FF', '#FECACA'] },
  { id: 'g8', title: 'Heart Confetti', subtitle: 'Tiny but affectionate', price: '15.000d', category: 'Cute', accent: ['#FEE2E2', '#FBCFE8'] },
];

function GiftCard({ item, onSend }) {
  return (
    <View style={styles.giftCard}>
      <View style={[styles.giftArt, { backgroundColor: item.accent[0] }]}>
        <View style={[styles.giftOrb, { backgroundColor: item.accent[1] }]} />
        <Gift color={COLORS.textPrimary} size={24} />
      </View>
      <Text style={styles.giftTitle}>{item.title}</Text>
      <Text style={styles.giftSubtitle}>{item.subtitle}</Text>
      <View style={styles.giftFooter}>
        <Text style={styles.giftPrice}>{item.price}</Text>
        <TouchableOpacity style={styles.sendBtn} onPress={() => onSend(item)}>
          <SendHorizonal color={COLORS.white} size={14} />
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GiftCenterScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const visibleGifts = useMemo(() => {
    if (selectedCategory === 'All') return GIFTS;
    return GIFTS.filter((gift) => gift.category === selectedCategory);
  }, [selectedCategory]);

  const handleSendGift = (gift) => {
    Alert.alert(
      'Demo gift flow',
      `You selected "${gift.title}". Next step for the project can be choosing a friend, confirming amount, then saving gift history.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={COLORS.textPrimary} size={22} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerKicker}>social gifting</Text>
            <Text style={styles.headerTitle}>Gift Center</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Sparkles color={COLORS.textPrimary} size={14} />
            <Text style={styles.heroBadgeText}>more than location sharing</Text>
          </View>
          <Text style={styles.heroTitle}>Send a small surprise without leaving the app.</Text>
          <Text style={styles.heroText}>
            This module helps the app feel closer to Jagat, Locket and social gifting products:
            friends can receive cute items, drink treats, vouchers or phone top-up gifts.
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>8</Text>
              <Text style={styles.heroStatLabel}>gift ideas</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>3</Text>
              <Text style={styles.heroStatLabel}>money-ready</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>24h</Text>
              <Text style={styles.heroStatLabel}>highlight loop</Text>
            </View>
          </View>
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item === selectedCategory;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gift catalog</Text>
          <Text style={styles.sectionCaption}>{visibleGifts.length} items</Text>
        </View>

        <View style={styles.grid}>
          {visibleGifts.map((item) => (
            <GiftCard key={item.id} item={item} onSend={handleSendGift} />
          ))}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>How this should work in the final project</Text>
          <Text style={styles.noteLine}>1. Pick a friend from map, chat, or friends list.</Text>
          <Text style={styles.noteLine}>2. Choose a gift item or top-up package.</Text>
          <Text style={styles.noteLine}>3. Confirm sending, then save into gift history.</Text>
          <Text style={styles.noteLine}>4. Receiver gets a beautiful card, notification, and interaction highlight.</Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FF',
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    paddingBottom: 18,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCopy: {
    flex: 1,
  },
  headerKicker: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 4,
  },
  hero: {
    borderRadius: 32,
    padding: 20,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    ...SHADOW.card,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.76)',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderRadius: 18,
    padding: 14,
  },
  heroStatValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 18,
  },
  categoryChip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.84)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  categoryChipText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionCaption: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  giftCard: {
    width: '48.2%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  giftArt: {
    height: 110,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  giftOrb: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.55,
  },
  giftTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  giftSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
    minHeight: 34,
  },
  giftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  giftPrice: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  noteCard: {
    marginTop: 18,
    borderRadius: 26,
    padding: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.08)',
  },
  noteTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  noteLine: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },
});
