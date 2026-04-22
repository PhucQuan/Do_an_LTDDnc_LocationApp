import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, SendHorizonal, Sparkles } from "lucide-react-native";
import { COLORS, SHADOW } from "../../theme";

const CATEGORIES = ["All", "Cute", "Food", "Top-up", "Voucher"];

const GIFTS = [
  {
    id: "g1",
    title: "Milk Tea",
    subtitle: "Cute surprise for besties",
    price: "29.000d",
    category: "Food",
    image: "https://cdn-icons-png.flaticon.com/512/4949/4949857.png",
    accent: ["#FFE7D6", "#FFD0E7"],
  },
  {
    id: "g2",
    title: "Coffee",
    subtitle: "Morning energy in one tap",
    price: "35.000d",
    category: "Food",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050153.png",
    accent: ["#FDE68A", "#FCA5A5"],
  },
  {
    id: "g3",
    title: "Sticker Burst",
    subtitle: "Locket-style reaction pack",
    price: "9.000d",
    category: "Cute",
    image: "https://cdn-icons-png.flaticon.com/512/833/833472.png",
    accent: ["#D8F3FF", "#E9D5FF"],
  },
  {
    id: "g4",
    title: "Phone Top-up 20K",
    subtitle: "Quick recharge gift",
    price: "20.000d",
    category: "Top-up",
    image: "https://cdn-icons-png.flaticon.com/512/597/597177.png",
    accent: ["#DBEAFE", "#BFDBFE"],
  },
  {
    id: "g5",
    title: "Phone Top-up 50K",
    subtitle: "Big recharge for someone close",
    price: "50.000d",
    category: "Top-up",
    image: "https://cdn-icons-png.flaticon.com/128/9946/9946341.png",
    accent: ["#E0EAFF", "#C7D2FE"],
  },
  {
    id: "g6",
    title: "Movie Voucher",
    subtitle: "Weekend hangout idea",
    price: "79.000d",
    category: "Voucher",
    image: "https://cdn-icons-png.flaticon.com/512/1179/1179069.png",
    accent: ["#FCE7F3", "#FDE68A"],
  },
  {
    id: "g7",
    title: "Snack",
    subtitle: "Late-night comfort gift",
    price: "45.000d",
    category: "Food",
    image: "https://cdn-icons-png.flaticon.com/128/1051/1051948.png",
    accent: ["#E9D5FF", "#FECACA"],
  },
  {
    id: "g8",
    title: "Heart Confetti",
    subtitle: "Tiny but affectionate",
    price: "15.000d",
    category: "Cute",
    image: "https://cdn-icons-png.flaticon.com/512/1077/1077035.png",
    accent: ["#FEE2E2", "#FBCFE8"],
  },
];

function GiftCard({ item, onSend }) {
  return (
    <View style={styles.giftCard}>
      <View style={[styles.giftArt, { backgroundColor: item.accent[0] }]}>
        <Image source={{ uri: item.image }} style={styles.giftImage} />
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
  const [selectedCategory, setSelectedCategory] = useState("All");

  const visibleGifts = useMemo(() => {
    if (selectedCategory === "All") return GIFTS;
    return GIFTS.filter((gift) => gift.category === selectedCategory);
  }, [selectedCategory]);

  const handleSendGift = (gift) => {
    Alert.alert("Demo gift flow", `You selected "${gift.title}".`, [
      { text: "OK" },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
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
          <Text style={styles.heroTitle}>
            Send a small surprise without leaving the app.
          </Text>
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
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.grid}>
          {visibleGifts.map((item) => (
            <GiftCard key={item.id} item={item} onSend={handleSendGift} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F4FF",
  },
  content: {
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: "900",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
  },
  hero: {
    marginVertical: 10,
  },
  heroBadge: {
    flexDirection: "row",
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: "#000",
  },
  categoryChipText: {
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  giftCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  giftArt: {
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  giftImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  giftTitle: {
    fontWeight: "900",
  },
  giftSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  giftFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  giftPrice: {
    fontWeight: "900",
  },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: "#000",
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  sendBtnText: {
    color: "#fff",
    marginLeft: 4,
  },
});
