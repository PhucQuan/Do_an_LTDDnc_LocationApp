import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, EyeOff, Navigation, Snowflake, Target } from 'lucide-react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../infrastructure/firebase/firebase';
import { locationService } from '../../../infrastructure/firebase/locationService';
import { COLORS, SHADOW } from '../../theme';

function PrivacyOption({ title, description, icon, isSelected, onPress, color }) {
  return (
    <TouchableOpacity
      style={[styles.optionCard, isSelected && { borderColor: color, backgroundColor: COLORS.bgElevated }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: isSelected ? color : COLORS.bgInput }]}>{icon}</View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
      <View style={styles.radio}>{isSelected ? <View style={[styles.radioFill, { backgroundColor: color }]} /> : null}</View>
    </TouchableOpacity>
  );
}

export default function PrivacySettingsScreen({ navigation }) {
  const [privacyMap, setPrivacyMap] = useState({});
  const [myLocation, setMyLocation] = useState({ lat: 10.762622, long: 106.660172 });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUid = auth.currentUser?.uid;
        if (!currentUid) return;

        const userSnap = await getDoc(doc(db, 'users', currentUid));
        if (userSnap.exists()) {
          setPrivacyMap(userSnap.data().privacyMap || {});
        }
      } catch (e) {
        console.warn('Error fetching privacy settings', e);
      }
    };
    loadProfile();
  }, []);

  const changePrivacy = async (friendUid, level) => {
    const currentUid = auth.currentUser?.uid;
    const newMap = { ...privacyMap };

    if (level === 'precise') {
      delete newMap[friendUid];
    } else if (level === 'freeze') {
      newMap[friendUid] = {
        mode: 'freeze',
        lat: myLocation?.lat || 0,
        long: myLocation?.long || 0,
        updatedAt: Date.now(),
      };
    } else {
      newMap[friendUid] = level;
    }

    setPrivacyMap(newMap);

    try {
      await updateDoc(doc(db, 'users', currentUid), { privacyMap: newMap });
      await locationService.syncLocationVisibility();
      if (level === 'ghost') {
        await locationService.setGhostMode(true);
      } else {
        await locationService.setGhostMode(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to update privacy level.');
    }
  };

  const getLevel = (friendUid) => {
    const setting = privacyMap[friendUid];
    if (!setting) return 'precise';
    return typeof setting === 'string' ? setting : setting.mode;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visibility modes</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Choose how friends see your position. This is the key setting for your demo story.
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        <PrivacyOption
          title="Precise"
          description="Friends see your exact live location."
          icon={<Target color={getLevel('default') === 'precise' ? COLORS.white : COLORS.textMuted} size={20} />}
          color={COLORS.accent}
          isSelected={getLevel('default') === 'precise'}
          onPress={() => changePrivacy('default', 'precise')}
        />
        <PrivacyOption
          title="Approximate"
          description="Shift your pin slightly so the area is visible, not the exact point."
          icon={<Navigation color={getLevel('default') === 'approximate' ? COLORS.white : COLORS.textMuted} size={20} />}
          color={COLORS.yellow}
          isSelected={getLevel('default') === 'approximate'}
          onPress={() => changePrivacy('default', 'approximate')}
        />
        <PrivacyOption
          title="Freeze"
          description="Lock your map position in place until you change it."
          icon={<Snowflake color={getLevel('default') === 'freeze' ? COLORS.white : COLORS.textMuted} size={20} />}
          color={COLORS.purple}
          isSelected={getLevel('default') === 'freeze'}
          onPress={() => changePrivacy('default', 'freeze')}
        />
        <PrivacyOption
          title="Ghost"
          description="Hide completely from the live map."
          icon={<EyeOff color={getLevel('default') === 'ghost' ? COLORS.white : COLORS.textMuted} size={20} />}
          color={COLORS.ink}
          isSelected={getLevel('default') === 'ghost'}
          onPress={() => changePrivacy('default', 'ghost')}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to present this in your demo</Text>
          <Text style={styles.infoText}>
            1. Precise mode to show live avatar tracking.
          </Text>
          <Text style={styles.infoText}>
            2. Approximate mode to explain privacy-friendly sharing.
          </Text>
          <Text style={styles.infoText}>
            3. Freeze and Ghost to show safety controls for users.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900' },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 22,
  },
  content: { paddingHorizontal: 20, gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
    ...SHADOW.card,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  optionDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
  infoCard: {
    marginTop: 18,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  infoTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  infoText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
});
