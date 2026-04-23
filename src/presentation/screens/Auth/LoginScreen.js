import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated,
} from 'react-native';
import { Mail, Lock, MapPin, ChevronRight } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';
import { COLORS, SPACING, SHADOW, RADIUS } from '../../theme';

function SolidInput({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inkSoft, COLORS.accent],
  });

  return (
    <Animated.View style={[styles.inputBox, { borderColor }]}>
      <Icon color={focused ? COLORS.accent : COLORS.textMuted} size={20} style={{ marginRight: 12 }} />
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={COLORS.accent}
      />
    </Animated.View>
  );
}

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      await authService.login(email, password);
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <Animated.View style={[styles.content, { transform: [{ translateY: slideUp }], opacity: fadeIn }]}>

          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <MapPin color={COLORS.ink} size={36} strokeWidth={2.5} />
            </View>
            <Text style={styles.appName}>GeoLink</Text>
            <Text style={styles.tagline}>Welcome back. Ready to explore?</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <SolidInput icon={Mail} placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <SolidInput icon={Lock} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Log in</Text>
                  <ChevronRight color={COLORS.white} size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerGray}>New to GeoLink? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.footerHighlight}>Create an account</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ink },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING.xl, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 48 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '-5deg' }],
    ...SHADOW.accent,
  },
  appName: { color: COLORS.white, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: COLORS.textMuted, fontSize: 15, marginTop: 8, fontWeight: '500' },

  formContainer: { width: '100%' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inkSoft,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputText: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '600' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 32 },
  forgotText: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },

  primaryBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
    ...SHADOW.accent,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 48 },
  footerGray: { color: COLORS.textMuted, fontSize: 15, fontWeight: '500' },
  footerHighlight: { color: COLORS.white, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
});

export default LoginScreen;

