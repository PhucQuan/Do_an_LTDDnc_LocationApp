import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../../infrastructure/firebase/authService';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Floating decorative blobs ──────────────────────────────────────────────
function Blobs() {
  return (
    <>
      <View style={[styles.blob, { top: -60, right: -60, width: 200, height: 200, backgroundColor: 'rgba(232,72,229,0.18)' }]} />
      <View style={[styles.blob, { top: SCREEN_H * 0.25, left: -80, width: 160, height: 160, backgroundColor: 'rgba(139,92,246,0.15)' }]} />
      <View style={[styles.blob, { bottom: 80, right: -50, width: 180, height: 180, backgroundColor: 'rgba(236,72,153,0.12)' }]} />
    </>
  );
}

// ── Input Field ───────────────────────────────────────────────────────────
function GlassInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize }) {
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
    outputRange: ['rgba(255,255,255,0.1)', 'rgba(232,72,229,0.7)'],
  });

  return (
    <Animated.View style={[styles.inputBox, { borderColor }]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.inputText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Animated.View>
  );
}

// ── Main LoginScreen ──────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Entry animation
  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
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
      {/* Dark background */}
      <LinearGradient colors={['#0D0D1A', '#12001A', '#0D0D1A']} style={StyleSheet.absoluteFill} />
      <Blobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <Animated.View style={[styles.content, { transform: [{ translateY: slideUp }], opacity: fadeIn }]}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={['#E848E5', '#8B5CF6']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoEmoji}>📍</Text>
            </LinearGradient>
            <Text style={styles.appName}>GeoLink</Text>
            <Text style={styles.tagline}>Chia sẻ vị trí với bạn bè realtime</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>

            <GlassInput icon="✉️" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <GlassInput icon="🔒" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Primary button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#E848E5', '#8B5CF6']} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.primaryBtnText}>Đăng nhập →</Text>}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>hoặc tiếp tục với</Text>
              <View style={styles.divLine} />
            </View>

            {/* Social */}
            <View style={styles.socialRow}>
              {['🍎', '🌐', 'f'].map((ic, i) => (
                <TouchableOpacity key={i} style={styles.socialBtn}>
                  <Text style={{ fontSize: 18 }}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerGray}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerPink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingTop: 40 },

  // Blobs
  blob: { position: 'absolute', borderRadius: 999 },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoGrad: {
    width: 72, height: 72, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    elevation: 10,
    shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 16,
  },
  logoEmoji: { fontSize: 32 },
  appName: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 20 },

  // Input
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 14,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  inputText: { flex: 1, color: '#FFF', fontSize: 15 },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#E848E5', fontSize: 13, fontWeight: '600' },

  // Primary button
  primaryBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 22, elevation: 8, shadowColor: '#E848E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 },
  primaryBtnGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  // Divider
  divRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  divText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, paddingHorizontal: 12 },

  // Social
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialBtn: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerGray: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  footerPink: { color: '#E848E5', fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
