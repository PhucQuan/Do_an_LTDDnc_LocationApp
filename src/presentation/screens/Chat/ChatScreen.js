import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { auth } from '../../../infrastructure/firebase/firebase';
import { chatService } from '../../../infrastructure/firebase/chatService';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, title, isGroup } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  const currentUser = auth.currentUser;

  useEffect(() => {
    // Đánh dấu tất cả là đã đọc khi vào màn hình
    chatService.markAllAsRead(chatId, currentUser.uid);

    const unsubscribe = chatService.subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);

      // Khi có tin nhắn mới, nếu đang ở màn hình này thì đánh dấu là đã đọc
      chatService.markAllAsRead(chatId, currentUser.uid);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await chatService.sendMessage(
        chatId,
        textToSend,
        currentUser.uid,
        currentUser.displayName || currentUser.email.split('@')[0]
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUser.uid;

    return (
      <View style={[
        styles.messageContainer,
        isMine ? styles.myMessage : styles.theirMessage
      ]}>
        {!isMine && isGroup && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isMine ? styles.myBubble : styles.theirBubble
        ]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>Bắt đầu cuộc trò chuyện...</Text>}
      />

      {loading && (
        <ActivityIndicator size="large" color="#38BDF8" style={styles.loader} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Aa"
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: { padding: 8 },
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  messageList: { padding: 16, paddingBottom: 20 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  senderName: { color: '#64748B', fontSize: 12, marginBottom: 4, marginLeft: 4 },
  messageBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  myBubble: { backgroundColor: '#38BDF8', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#1E293B', borderBottomLeftRadius: 4 },
  messageText: { color: '#F8FAFC', fontSize: 16 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: { backgroundColor: '#1E293B' },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 20 },
  loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }
});

export default ChatScreen;
