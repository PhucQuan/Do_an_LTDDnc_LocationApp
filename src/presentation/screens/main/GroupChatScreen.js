import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, SendHorizonal } from 'lucide-react-native';
import { auth } from '../../../infrastructure/firebase/firebase';
import { chatService } from '../../../infrastructure/firebase/chatService';

function getInitials(name = 'ME') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ME';
}

function formatTime(timestamp) {
  const date = timestamp?.toDate?.() ? timestamp.toDate() : null;
  if (!date) {
    return 'Now';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function GroupChatScreen({ navigation, route }) {
  const { groupId, groupName } = route.params;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = useMemo(() => {
    const currentName =
      auth.currentUser?.displayName ||
      auth.currentUser?.email?.split('@')[0] ||
      'You';

    return {
      id: auth.currentUser?.uid,
      name: currentName,
      initials: getInitials(currentName),
    };
  }, []);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToGroupMessages(groupId, (nextMessages) => {
      setMessages(nextMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleSend = async () => {
    if (!draft.trim() || sending) {
      return;
    }

    setSending(true);
    try {
      await chatService.sendGroupMessage(groupId, currentUser, draft);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{groupName}</Text>
          <Text style={styles.headerSubtitle}>Live group conversation</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <ActivityIndicator color="#38BDF8" style={{ marginTop: 28 }} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUser.id;
              return (
                <View style={[styles.messageRow, isMe && styles.messageRowRight]}>
                  {!isMe && (
                    <View style={styles.avatarWrap}>
                      <Text style={styles.avatarText}>{item.senderInitials || 'U'}</Text>
                    </View>
                  )}
                  <View style={[styles.messageBubble, isMe && styles.messageBubbleMine]}>
                    {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                    <Text style={[styles.messageText, isMe && styles.messageTextMine]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isMe && styles.messageTimeMine]}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>Send the first message to start this room.</Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Send a message..."
            placeholderTextColor="#64748B"
            value={draft}
            onChangeText={setDraft}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#062033" />
            ) : (
              <SendHorizonal color="#062033" size={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  messageList: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#223047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
  },
  messageBubble: {
    maxWidth: '78%',
    backgroundColor: '#162234',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.1)',
  },
  messageBubbleMine: {
    backgroundColor: '#FACC15',
    borderColor: '#FACC15',
  },
  senderName: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  messageText: {
    color: '#F8FAFC',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#062033',
  },
  messageTime: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },
  messageTimeMine: {
    color: '#334155',
  },
  emptyCard: {
    backgroundColor: '#111C2E',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.08)',
    backgroundColor: '#0B1220',
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#111C2E',
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.12)',
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FACC15',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});
