import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { ArrowLeft, Camera, Check, User, Edit2, Users } from 'lucide-react-native';
import { db, auth } from '../../../infrastructure/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { chatService } from '../../../infrastructure/firebase/chatService';
import * as ImagePicker from 'expo-image-picker';

const GroupSettingsScreen = ({ route, navigation }) => {
  const { chatId } = route.params;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToGroup(chatId, async (groupData) => {
      setGroup(groupData);
      setGroupName(groupData.name);

      // Fetch member details
      const memberDetails = await Promise.all(
        groupData.members.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid));
          return { uid, ...(userSnap.exists() ? userSnap.data() : { name: 'Unknown' }) };
        })
      );
      setMembers(memberDetails);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === group.name) return;
    setUpdating(true);
    try {
      await chatService.updateGroupInfo(chatId, { name: groupName.trim() });
      Alert.alert("Thành công", "Đã đổi tên nhóm!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể đổi tên nhóm.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Quyền truy cập", "Ứng dụng cần quyền truy cập thư viện ảnh.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setUpdating(true);
      try {
        await chatService.updateGroupInfo(chatId, {
          avatarUrl: `data:image/jpeg;base64,${result.assets[0].base64}`
        });
        Alert.alert("Thành công", "Đã cập nhật ảnh đại diện nhóm!");
      } catch (error) {
        Alert.alert("Lỗi", "Không thể cập nhật ảnh.");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleChangeNickname = (member) => {
    const currentNickname = group.nicknames?.[member.uid] || member.name;

    Alert.prompt(
      "Đặt biệt danh",
      `Nhập biệt danh cho ${member.name}:`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Lưu",
          onPress: async (newNickname) => {
            if (newNickname) {
              try {
                await chatService.setUserNickname(chatId, member.uid, newNickname);
              } catch (error) {
                Alert.alert("Lỗi", "Không thể đặt biệt danh.");
              }
            }
          }
        }
      ],
      'plain-text',
      currentNickname
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#F8FAFC" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt nhóm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={updating}>
            {group.avatarUrl ? (
              <Image source={{ uri: group.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Users color="#94A3B8" size={40} />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera color="#fff" size={16} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tên nhóm</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Nhập tên nhóm..."
              placeholderTextColor="#64748B"
            />
            {groupName !== group.name && (
              <TouchableOpacity onPress={handleUpdateName} style={styles.saveBtn} disabled={updating}>
                <Check color="#38BDF8" size={24} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
          {members.map((member) => (
            <View key={member.uid} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {member.avatarUrl ? (
                  <Image source={{ uri: member.avatarUrl }} style={styles.smallAvatar} />
                ) : (
                  <User color="#94A3B8" size={20} />
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                {group.nicknames?.[member.uid] && (
                  <Text style={styles.nickname}>Biệt danh: {group.nicknames[member.uid]}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.editNicknameBtn} onPress={() => handleChangeNickname(member)}>
                <Edit2 color="#64748B" size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {updating && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
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
  headerTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#38BDF8',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0F172A'
  },
  section: { marginBottom: 25 },
  sectionTitle: { color: '#64748B', fontSize: 13, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#334155'
  },
  input: { flex: 1, color: '#F8FAFC', paddingVertical: 12, fontSize: 16 },
  saveBtn: { padding: 8 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden'
  },
  smallAvatar: { width: '100%', height: '100%' },
  memberInfo: { flex: 1 },
  memberName: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
  nickname: { color: '#38BDF8', fontSize: 12, marginTop: 2 },
  editNicknameBtn: { padding: 8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default GroupSettingsScreen;
