import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BatteryFull,
  MapPin,
  MessageCircle,
  Navigation,
  Smile,
  X,
} from "lucide-react-native";
import { COLORS, SHADOW } from "../../theme";

const EMOJIS = ["Hi", "Love", "Fire", "Haha", "Eyes"];

function formatRelativeTime(timestamp) {
  if (!timestamp) return "now";
  const diffMs = Date.now() - Number(timestamp);
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "Friend",
  )}`;
}

export function SelectedUserSheet({
  user,
  moments,
  onOpenMoment,
  onClose,
  onChat,
  onInteract,
  onNavigate,
  onSendSticker,
  onViewProfile,
  bottomOffset,
}) {
  const translateY = useRef(new Animated.Value(420)).current;
  const insets = useSafeAreaInsets();

  const [showUserMoments, setShowUserMoments] = React.useState(false);

  const userMoments = React.useMemo(() => {
    if (!user || !moments) return [];
    return moments.filter((m) => m.userId === user.uid);
  }, [moments, user]);

  const sheetBottom =
    typeof bottomOffset === "number"
      ? bottomOffset
      : Math.max(12, insets.bottom + 12);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: user ? 0 : 420,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [translateY, user]);

  if (!user) return null;

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          { bottom: sheetBottom, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.grabber} />

        <View style={styles.header}>
          <View style={styles.identityRow}>
            <TouchableOpacity onPress={onViewProfile}>
              <Image
                source={{
                  uri: user.avatarUrl || getFallbackAvatar(user.displayName),
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.displayName || "Friend"}</Text>
              <Text style={styles.handle}>
                @
                {(user.displayName || "friend")
                  .replace(/\s+/g, "")
                  .toLowerCase()}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose}>
            <X size={16} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => onChat(user)}
          >
            <MessageCircle color="#fff" size={18} />
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.momentButton}
            onPress={() => setShowUserMoments(true)}
          >
            <Text style={styles.momentButtonText}>
              Moments ({userMoments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
            <Navigation color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* MOMENT GRID */}
      {showUserMoments && (
        <View style={styles.modal}>
          <Text style={styles.title}>{user.displayName}'s Moments</Text>

          <FlatList
            data={userMoments}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => {
                  setShowUserMoments(false);
                  onOpenMoment && onOpenMoment(item);
                }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.gridImage}
                />
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={() => setShowUserMoments(false)}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 24,
    backgroundColor: COLORS.ink,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...SHADOW.card,
  },
  grabber: {
    width: 50,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  identityRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: COLORS.bgSoft,
  },
  name: {
    fontWeight: "900",
    fontSize: 18,
    color: COLORS.white,
  },
  handle: {
    color: COLORS.textMuted,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  chatButton: {
    flex: 1,
    backgroundColor: "#000",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    flexDirection: "row",
    gap: 6,
  },

  chatText: {
    color: "#fff",
    fontWeight: "900",
  },

  momentButton: {
    flex: 1,
    backgroundColor: COLORS.pink,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },

  momentButtonText: {
    color: "#fff",
    fontWeight: "900",
  },

  navigateButton: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    position: "absolute",
    top: "12%",
    left: 10,
    right: 10,
    bottom: 95,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
  },

  title: {
    textAlign: "center",
    fontWeight: "900",
    marginBottom: 10,
  },

  gridItem: {
    flex: 1,
    aspectRatio: 1,
    padding: 4,
  },

  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  close: {
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
  },
});
