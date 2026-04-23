import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Check, MapPin, Plus, UserPlus, Users, X, Zap } from "lucide-react-native";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../../infrastructure/firebase/firebase";
import { friendService } from "../../../infrastructure/firebase/friendService";
import { chatService } from "../../../infrastructure/firebase/chatService";
import { seedDemoSocialData } from "../../../seedData";
import { COLORS, LAYOUT, SHADOW, SPACING } from "../../theme";

function getAvatarUri(user) {
  return (
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "Friend",
    )}&background=111827&color=ffffff&bold=true&size=256`
  );
}

function StatCard({ value, label, accent = COLORS.accent }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FriendChip({ user, onPress }) {
  return (
    <TouchableOpacity style={styles.friendChip} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.friendChipAvatarWrap}>
        <Image source={{ uri: getAvatarUri(user) }} style={styles.friendChipAvatar} />
        <View
          style={[
            styles.friendChipDot,
            { backgroundColor: user?.isGhostMode ? COLORS.offline : COLORS.online },
          ]}
        />
      </View>
      <Text style={styles.friendChipName} numberOfLines={1}>
        {user?.name?.split(" ")[0] || "Friend"}
      </Text>
    </TouchableOpacity>
  );
}

function FriendRow({ user, rightNode, onPress }) {
  return (
    <TouchableOpacity style={styles.friendRow} onPress={onPress} activeOpacity={0.82}>
      <Image source={{ uri: getAvatarUri(user) }} style={styles.friendAvatar} />
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName}>{user?.name || "Friend"}</Text>
          <View
            style={[
              styles.friendStatusDot,
              { backgroundColor: user?.isGhostMode ? COLORS.offline : COLORS.online },
            ]}
          />
        </View>
        <Text style={styles.friendSub}>
          {user?.isGhostMode
            ? "Ghost mode enabled"
            : `@${user?.username || user?.email?.split("@")[0] || "friend"}`}
        </Text>
      </View>
      {rightNode}
    </TouchableOpacity>
  );
}

export default function FriendsListScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return undefined;

    const qFriends = query(collection(db, "friendships"), where("status", "==", "accepted"));

    const unsubFriends = onSnapshot(qFriends, async (snapshot) => {
      try {
        const list = [];
        for (const snap of snapshot.docs) {
          const friendship = snap.data();
          const friendUid =
            friendship.userId1 === currentUid
              ? friendship.userId2
              : friendship.userId2 === currentUid
                ? friendship.userId1
                : null;

          if (!friendUid) continue;

          const userSnapshot = await getDoc(doc(db, "users", friendUid));
          if (userSnapshot.exists()) {
            list.push({ id: snap.id, uid: friendUid, ...userSnapshot.data() });
          }
        }
        setFriends(list);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    const unsubGroups = chatService.subscribeToUserGroups(currentUid, setGroups);
    const unsubRequests = friendService.subscribeToPendingRequests(currentUid, setPendingRequests);

    return () => {
      unsubFriends();
      unsubGroups();
      unsubRequests();
    };
  }, []);

  const visibleFriends = useMemo(() => friends.filter((friend) => !friend.isGhostMode), [friends]);

  const handleAccept = async (id) => {
    try {
      await friendService.acceptFriendRequest(id);
    } catch {
      Alert.alert("Error", "Could not accept request.");
    }
  };

  const handleDecline = async (id) => {
    try {
      await friendService.declineFriendRequest(id);
    } catch {
      Alert.alert("Error", "Could not decline request.");
    }
  };

  const handleLeaveGroup = (groupId) => {
    Alert.alert("Leave group", "Are you sure you want to leave this group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await chatService.leaveGroup(groupId, auth.currentUser.uid);
          } catch {
            Alert.alert("Error", "Could not leave this group.");
          }
        },
      },
    ]);
  };

  const handleOpenChat = async (friend) => {
    const myUid = auth.currentUser?.uid;
    if (!myUid) return;

    try {
      await chatService.ensureDirectChatExists(myUid, friend.uid, friend);
      navigation.navigate("DirectChat", {
        otherUid: friend.uid,
        otherName: friend.name || friend.email?.split("@")[0] || "Friend",
      });
    } catch {
      Alert.alert("Error", "Could not open chat.");
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await seedDemoSocialData();
      Alert.alert(
        "Demo ready",
        `Created ${result.createdUsers.length} demo friends and ${result.createdGroups.length} groups.`,
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Could not seed demo data.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient colors={["#FFFDF8", "#F7F3FF", "#EFF6FF"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.headerKicker}>social layer</Text>
              <Text style={styles.headerTitle}>Friends</Text>
              <Text style={styles.headerSubtitle}>
                Manage who appears on your map and who gets your moments.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddFriend")}
            >
              <UserPlus color={COLORS.white} size={22} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatCard value={friends.length} label="friends" />
            <StatCard value={visibleFriends.length} label="visible now" accent={COLORS.green} />
            <StatCard value={groups.length} label="groups" accent={COLORS.purple} />
          </View>

          {visibleFriends.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendChipRow}
            >
              {visibleFriends.map((friend) => (
                <FriendChip
                  key={friend.uid}
                  user={friend}
                  onPress={() => navigation.navigate("Map", { focusUid: friend.uid })}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("CreateGroup")}>
            <View style={[styles.actionIcon, { backgroundColor: "rgba(124,58,237,0.18)" }]}>
              <Plus color={COLORS.accent} size={20} />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>Create group</Text>
              <Text style={styles.actionHint}>Spin up a shared room for trips, classes or your project team.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleSeedDemo} disabled={seeding}>
            <View style={[styles.actionIcon, { backgroundColor: "rgba(245,158,11,0.18)" }]}>
              {seeding ? (
                <ActivityIndicator size="small" color={COLORS.yellow} />
              ) : (
                <Zap color={COLORS.yellow} size={20} />
              )}
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionLabel}>Seed demo</Text>
              <Text style={styles.actionHint}>Generate a quick social graph so the app looks alive for review.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {pendingRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend requests</Text>
            <View style={styles.sectionCard}>
              {pendingRequests.map((req) => (
                <FriendRow
                  key={req.friendshipId}
                  user={req.sender}
                  rightNode={
                    <View style={styles.btnGroup}>
                      <TouchableOpacity
                        style={styles.btnAccept}
                        onPress={() => handleAccept(req.friendshipId)}
                      >
                        <Check color={COLORS.white} size={16} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnDecline}
                        onPress={() => handleDecline(req.friendshipId)}
                      >
                        <X color={COLORS.danger} size={16} />
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Groups</Text>
            <Text style={styles.sectionCount}>{groups.length}</Text>
          </View>
          <View style={styles.sectionCard}>
            {groups.length ? (
              groups.map((group) => (
                <View key={group.id} style={styles.groupRow}>
                  <View style={styles.groupIcon}>
                    <Users color={COLORS.accent} size={18} />
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{group.name}</Text>
                    <Text style={styles.friendSub}>{group.members.length} members</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.groupOpenBtn}
                    onPress={() =>
                      navigation.navigate("GroupChat", {
                        groupId: group.id,
                        groupName: group.name,
                      })
                    }
                  >
                    <Text style={styles.groupOpenText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.groupLeaveBtn} onPress={() => handleLeaveGroup(group.id)}>
                    <X color={COLORS.danger} size={14} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No groups yet. Create one for your classmates or your travel crew.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All friends</Text>
            <Text style={styles.sectionCount}>{friends.length}</Text>
          </View>
          <View style={styles.sectionCard}>
            {loading ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
            ) : friends.length ? (
              friends.map((friend) => (
                <FriendRow
                  key={friend.uid}
                  user={friend}
                  onPress={() => handleOpenChat(friend)}
                  rightNode={
                    <View style={styles.friendActions}>
                      <TouchableOpacity
                        style={[styles.friendPill, friend.isGhostMode && styles.friendPillGhost]}
                        onPress={(event) => {
                          event.stopPropagation();
                          navigation.navigate("Map", { focusUid: friend.uid });
                        }}
                      >
                        <MapPin
                          size={13}
                          color={friend.isGhostMode ? COLORS.textMuted : COLORS.accent}
                        />
                        <Text
                          style={[
                            styles.friendPillText,
                            friend.isGhostMode && styles.friendPillTextGhost,
                          ]}
                        >
                          {friend.isGhostMode ? "Hidden" : "Live"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No friends yet. Tap the add button and build your circle.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: LAYOUT.tabBarBottom + LAYOUT.tabBarHeight + SPACING.xxl,
  },
  heroCard: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    marginBottom: 18,
    ...SHADOW.card,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  headerKicker: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 20,
  },
  addBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.accent,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(247,243,255,0.95)",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  friendChipRow: {
    gap: 14,
    paddingTop: 18,
  },
  friendChip: {
    width: 72,
    alignItems: "center",
  },
  friendChipAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
  },
  friendChipAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
    backgroundColor: "#111827",
  },
  friendChipDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#0B1220",
  },
  friendChipName: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  actionRow: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 24,
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
    ...SHADOW.card,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBody: {
    flex: 1,
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  actionHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  sectionCount: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.08)",
    overflow: "hidden",
    padding: 8,
    ...SHADOW.card,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 14,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: "#111827",
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  friendStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  friendSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  btnGroup: {
    flexDirection: "row",
    gap: 10,
  },
  btnAccept: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDecline: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 14,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "rgba(124,58,237,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  groupOpenBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  groupOpenText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },
  groupLeaveBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.14)",
  },
  friendPillGhost: {
    backgroundColor: "rgba(148,163,184,0.16)",
  },
  friendPillText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  friendPillTextGhost: {
    color: COLORS.textMuted,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    padding: 28,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
});
