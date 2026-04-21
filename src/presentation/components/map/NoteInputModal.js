import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS, SHADOW } from '../../theme';

const MAX_NOTE_LENGTH = 60;
const SUGGESTIONS = [
  'Uong ca phe',
  'Dang hoc bai',
  'Nghe nhac',
  'Buon ngu qua',
  'Dang chay bo',
  'Di an trua',
  'Dang code',
  'Choi game',
];

export function NoteInputModal({ visible, currentNote, onSave, onClose }) {
  const [text, setText] = useState(currentNote || '');
  const [saving, setSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setText(currentNote || '');
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 11,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 120);
      });
      return;
    }

    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [currentNote, slideAnim, visible]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text.trim() || null);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await onSave(null);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kbContainer}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Note</Text>
            <Text style={styles.subtitle}>Share what is on your mind</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={text}
              onChangeText={(nextText) => setText(nextText.slice(0, MAX_NOTE_LENGTH))}
              placeholder="Write something..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleSave}
            />
            <Text style={[styles.charCount, text.length >= MAX_NOTE_LENGTH && styles.charCountWarn]}>
              {text.length}/{MAX_NOTE_LENGTH}
            </Text>
          </View>

          <Text style={styles.suggLabel}>Quick picks</Text>
          <View style={styles.suggRow}>
            {SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={[styles.suggChip, text === suggestion && styles.suggChipActive]}
                onPress={() => setText(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggText, text === suggestion && styles.suggTextActive]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            {currentNote ? (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear} disabled={saving}>
                <Text style={styles.clearText}>Remove note</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.saveBtn, !text.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || !text.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Share note'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  kbContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    ...SHADOW.card,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 2,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 80,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginTop: 6,
  },
  charCountWarn: {
    color: COLORS.danger,
  },
  suggLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  suggRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  suggChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  suggText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  suggTextActive: {
    color: COLORS.white,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.bgSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },
  saveBtn: {
    flex: 2,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.white,
  },
});
