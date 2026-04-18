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
import { COLORS, SHADOW } from '../../theme';

function formatTime(timestamp) {
  const date = timestamp?.toDate?.() ? timestamp.toDate() : null;
  if (!date) return 'Now';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function DirectChatScreen({ navigation, route }) {
  const { otherUid, otherName } = route.params;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    const unsubscribe = chatService.subscribeToDirectMessages(myUid, otherUid, (nextMessages) => {
      setMessages(nextMessages);
      setLoading(false);
    });
    return unsubscribe;
  }, [myUid, otherUid]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await chatService.sendDirectMessage(myUid, otherUid, text);
    } catch (e) {
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === myUid;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerName}>{route.params?.otherName || 'Chat'}</Text>
          <Text style={styles.headerSub}>Direct message</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyHint}>No messages yet. Say hi!</Text>
            )
          }
          ListFooterComponent={<View style={{ height: 12 }} />}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
            autoCorrect
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!draft.trim() || sending}
          >
            <SendHorizonal color={COLORS.white} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  headerName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  headerSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  chatBody: { flex: 1 },
  messagesList: { paddingHorizontal: 16, paddingTop: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 8 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...SHADOW.card,
  },
  bubbleMe: {
    backgroundColor: COLORS.ink,
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    backgroundColor: COLORS.bgElevated,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  bubbleTextMe: { color: COLORS.white },
  bubbleTextThem: { color: COLORS.textPrimary },
  bubbleTime: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  bubbleTimeThem: { color: COLORS.textMuted },
  emptyHint: {
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.accent,
  },
  sendBtnDisabled: { backgroundColor: COLORS.textMuted },
});
