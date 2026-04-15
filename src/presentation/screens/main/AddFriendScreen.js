import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera } from 'expo-camera';
import { CameraView } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, QrCode, Search, UserPlus } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';
import { friendService } from '../../../infrastructure/firebase/friendService';
import { COLORS, SHADOW } from '../../theme';

export default function AddFriendScreen({ navigation }) {
  const [tab, setTab] = useState('USERNAME');
  const [hasPermission, setHasPermission] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    const unsubscribe = authService.subscribe((user) => {
      if (user) {
        setMyProfile({
          ...user,
          id: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'me',
        });
      }
    });

    return () => unsubscribe?.();
  }, []);

  const handleSearch = async () => {
    if (!usernameInput.trim()) return;
    setIsSearching(true);
    setSearchedUser(null);
    try {
      const result = await friendService.searchUserByUsername(usernameInput);
      if (result) {
        setSearchedUser(result);
      } else {
        Alert.alert('Not found', 'No user matched that username.');
      }
    } catch {
      Alert.alert('Error', 'There was a problem searching for this username.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (targetUid) => {
    if (!myProfile) return;
    setIsAdding(true);
    try {
      await friendService.addFriend(myProfile.id || myProfile.uid, targetUid);
      Alert.alert('Sent', 'Friend request sent successfully.');
      setSearchedUser(null);
      setUsernameInput('');
      setTab('USERNAME');
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not send friend request.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'geolink' && parsed.uid) {
        Alert.alert('Add friend', 'Send a friend request to this account?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: () => handleAddFriend(parsed.uid) },
        ]);
      }
    } catch {
      // ignore invalid QR
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add friends</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'USERNAME' && styles.tabButtonActive]}
          onPress={() => setTab('USERNAME')}
        >
          <Search color={tab === 'USERNAME' ? COLORS.white : COLORS.textMuted} size={18} />
          <Text style={[styles.tabText, tab === 'USERNAME' && styles.tabTextActive]}>Username</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'SCAN' && styles.tabButtonActive]}
          onPress={() => setTab('SCAN')}
        >
          <QrCode color={tab === 'SCAN' ? COLORS.white : COLORS.textMuted} size={18} />
          <Text style={[styles.tabText, tab === 'SCAN' && styles.tabTextActive]}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'MY_QR' && styles.tabButtonActive]}
          onPress={() => setTab('MY_QR')}
        >
          <UserPlus color={tab === 'MY_QR' ? COLORS.white : COLORS.textMuted} size={18} />
          <Text style={[styles.tabText, tab === 'MY_QR' && styles.tabTextActive]}>My QR</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {tab === 'USERNAME' ? (
          <View style={styles.usernameTab}>
            <Text style={styles.sectionTitle}>Add by username</Text>
            <View style={styles.searchBar}>
              <Search color={COLORS.textMuted} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter username..."
                placeholderTextColor={COLORS.textMuted}
                value={usernameInput}
                onChangeText={setUsernameInput}
                autoCapitalize="none"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.searchBtnText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchedUser ? (
              <View style={styles.resultCard}>
                <View style={styles.resultInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{searchedUser.name?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.resultName}>{searchedUser.name}</Text>
                    <Text style={styles.resultUsername}>@{searchedUser.username}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddFriend(searchedUser.id)}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <UserPlus color={COLORS.white} size={18} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {tab === 'SCAN' ? (
          <View style={styles.scanTab}>
            {hasPermission === null ? <Text style={styles.instruction}>Requesting camera permission...</Text> : null}
            {hasPermission === false ? <Text style={styles.instruction}>Camera access was denied.</Text> : null}
            {hasPermission ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanTarget} />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {tab === 'MY_QR' && myProfile ? (
          <View style={styles.qrTab}>
            <Text style={styles.qrTitle}>@{myProfile.username || 'your-account'}</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={JSON.stringify({ type: 'geolink', uid: myProfile.id, username: myProfile.username })}
                size={220}
                color={COLORS.textPrimary}
                backgroundColor={COLORS.white}
              />
            </View>
            <Text style={styles.qrInstruction}>Let your friends scan this code to add you.</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: COLORS.white },
  content: { flex: 1, paddingHorizontal: 20 },
  usernameTab: { flex: 1, marginTop: 10 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 16, marginLeft: 12 },
  searchBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchBtnText: { color: COLORS.white, fontWeight: '800' },
  resultCard: {
    marginTop: 24,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  resultInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: COLORS.accent, fontSize: 20, fontWeight: '900' },
  resultName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  resultUsername: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  addBtnText: { color: COLORS.white, fontWeight: '800' },
  scanTab: { flex: 1, borderRadius: 24, overflow: 'hidden', marginBottom: 40 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  instruction: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.28)',
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
  qrTab: { flex: 1, alignItems: 'center', paddingTop: 40 },
  qrTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', marginBottom: 30 },
  qrWrapper: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    ...SHADOW.card,
  },
  qrInstruction: { color: COLORS.textSecondary, fontSize: 16, marginTop: 30, textAlign: 'center' },
});
