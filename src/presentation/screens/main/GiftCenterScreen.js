import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Gift, SendHorizonal, Sparkles, X } from "lucide-react-native";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../../infrastructure/firebase/firebase";
import { chatService } from "../../../infrastructure/firebase/chatService";
import { giftService } from "../../../infrastructure/firebase/giftService";
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

function getAvatarUri(friend) {
  return (
    friend?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      friend?.name || "Friend",
    )}&background=111827&color=ffffff&bold=true&size=256`
  );
}

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
  const [friends, setFriends] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [sendingGift, setSendingGift] = useState(false);
  const [senderProfile, setSenderProfile] = useState(null);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return undefined;

    const loadMyProfile = async () => {
      const snapshot = await getDoc(doc(db, "users", currentUid));
      if (snapshot.exists()) {
        setSenderProfile(snapshot.data());
      }
    };

    loadMyProfile();

    const qFriends = query(collection(db, "friendships"), where("status", "==", "accepted"));
    const unsubscribe = onSnapshot(qFriends, async (snapshot) => {
      const nextFriends = [];

      for (const snap of snapshot.docs) {
        const friendship = snap.data();
        const friendUid =
          friendship.userId1 === currentUid
            ? friendship.userId2
            : friendship.userId2 === currentUid
              ? friendship.userId1
              : null;

        if (!friendUid) {
          continue;
        }

        const userSnapshot = await getDoc(doc(db, "users", friendUid));
        if (userSnapshot.exists()) {
          nextFriends.push({ uid: friendUid, ...userSnapshot.data() });
        }
      }

      setFriends(nextFriends);
    });

    return () => unsubscribe();
  }, []);

  const visibleGifts = useMemo(() => {
    if (selectedCategory === "All") return GIFTS;
    return GIFTS.filter((gift) => gift.category === selectedCategory);
  }, [selectedCategory]);

  const handleSendGift = async (friend) => {
    const myUid = auth.currentUser?.uid;
    if (!myUid || !selectedGift) {
      return;
    }

    setSendingGift(true);

    try {
      await giftService.sendGift({
        recipient: friend,
        gift: selectedGift,
        senderProfile,
      });

      await chatService.ensureDirectChatExists(myUid, friend.uid, friend);
      await chatService.sendDirectMessage(
        myUid,
        friend.uid,
        `Sent you ${selectedGift.title} ${selectedGift.price}`,
      );

      setSelectedGift(null);
      Alert.alert(
        "Gift sent",
        `${selectedGift.title} was sent to ${friend.name || "your friend"}.`,
        [
          {
            text: "Open chat",
            onPress: () =>
              navigation.navigate("DirectChat", {
                otherUid: friend.uid,
                otherName: friend.name || friend.email?.split("@")[0] || "Friend",
              }),
          },
          { text: "Close", style: "cancel" },
        ],
      );
    } catch (error) {
      Alert.alert("Send failed", error.message || "Could not send this gift.");
    } finally {
      setSendingGift(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
            <Sparkles color={COLORS.yellow} size={14} />
            <Text style={styles.heroBadgeText}>real send flow</Text>
          </View>
          <Text style={styles.heroTitle}>Pick a small gift, then choose which friend gets it.</Text>
          <Text style={styles.heroSubtitle}>
            Gifts are stored in Firestore and echoed into direct chat so the receiver sees them.
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
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.grid}>
          {visibleGifts.map((item) => (
            <GiftCard
              key={item.id}
              item={item}
              onSend={(gift) => setSelectedGift(gift)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={Boolean(selectedGift)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGift(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelectedGift(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>choose friend</Text>
                <Text style={styles.modalTitle}>{selectedGift?.title}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedGift(null)}>
                <X color={COLORS.textPrimary} size={18} />
              </TouchableOpacity>
            </View>

            {friends.length ? (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.friendList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.friendRow}
                    onPress={() => handleSendGift(item)}
                    disabled={sendingGift}
                  >
                    <Image source={{ uri: getAvatarUri(item) }} style={styles.friendAvatar} />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.name || "Friend"}</Text>
                      <Text style={styles.friendSub}>
                        @{item.username || item.email?.split("@")[0] || "friend"}
                      </Text>
                    </View>
                    <View style={styles.friendSendPill}>
                      {sendingGift ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Gift color={COLORS.white} size={14} />
                          <Text style={styles.friendSendText}>Send</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No friends available</Text>
                <Text style={styles.emptyStateHint}>
                  Add at least one friend before sending gifts.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDF9",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
  },
  headerCopy: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.accent,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  hero: {
    marginVertical: 10,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
  },
  heroBadge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 12,
    color: COLORS.yellow,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    marginTop: 8,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  categoryRow: {
    gap: 10,
    paddingVertical: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryChipText: {
    fontWeight: "700",
    color: COLORS.textSecondary,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
    ...SHADOW.card,
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
    color: COLORS.textPrimary,
  },
  giftSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    minHeight: 34,
  },
  giftFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  giftPrice: {
    fontWeight: "900",
    color: COLORS.yellow,
  },
  sendBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: "center",
  },
  sendBtnText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: "72%",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalKicker: {
    color: COLORS.accent,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  modalTitle: {
    marginTop: 4,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "900",
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  friendList: {
    paddingBottom: 10,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,20,25,0.06)",
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  friendSub: {
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  friendSendPill: {
    minWidth: 74,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  friendSendText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyStateTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyStateHint: {
    marginTop: 8,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
