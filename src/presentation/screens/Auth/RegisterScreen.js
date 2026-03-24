import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../../infrastructure/firebase/authService';

const { height: SCREEN_H } = Dimensions.get('window');

function Blobs() {
  return (
    <>
      <View style={[s.blob, { top: -80, left: -60, width: 220, height: 220, backgroundColor: 'rgba(139,92,246,0.18)' }]} />
      <View style={[s.blob, { top: SCREEN_H * 0.4, right: -70, width: 180, height: 180, backgroundColor: 'rgba(232,72,229,0.14)' }]} />
      <View style={[s.blob, { bottom: 40, left: -40, width: 150, height: 150, backgroundColor: 'rgba(236,72,153,0.12)' }]} />
    </>
  );
}

function GlassInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, maxLength }) {
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
    <Animated.View style={[s.inputBox, { borderColor }]}>
      <Text style={s.inputIcon}>{icon}</Text>
      <TextInput
        style={s.inputText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </Animated.View>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────
function TabToggle({ isOtpSent }) {
  return (
    <View style={s.tabRow}>
      <View style={[s.tab, !isOtpSent && s.tabActive]}>
        <Text style={[s.tabText, !isOtpSent && s.tabTextActive]}>📋 Thông tin</Text>
      </View>
      <View style={[s.tab, isOtpSent && s.tabActive]}>
        <Text style={[s.tabText, isOtpSent && s.tabTextActive]}>✉️ Xác thực OTP</Text>
      </View>
    </View>
  );
}

// ── Main RegisterScreen ───────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRequestOtp = async () => {
    if (!fullName || !email || !password || !phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }
    setLoading(true);
    try {
      await authService.requestRegisterOTP(email);
      setIsOtpSent(true);
      Alert.alert('Đã gửi!', 'Mã xác thực đã được gửi tới email của bạn.');
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp) { Alert.alert('Lỗi', 'Vui lòng nhập mã OTP'); return; }
    setLoading(true);
    try {
      await authService.verifyAndRegister(email, password, fullName, phone, otp);
      Alert.alert('Thành công 🎉', 'Tài khoản đã được tạo thành công!');
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D0D1A', '#12001A', '#0D0D1A']} style={StyleSheet.absoluteFill} />
      <Blobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={[{ transform: [{ translateY: slideUp }], opacity: fadeIn }]}>

            {/* Header */}
            <View style={s.header}>
              <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 28 }}>👤</Text>
              </LinearGradient>
              <Text style={s.appName}>GeoLink</Text>
              <Text style={s.tagline}>
                {isOtpSent ? `Mã đã gửi tới ${email}` : 'Tạo tài khoản mới'}
              </Text>
            </View>

            {/* Tab indicator */}
            <TabToggle isOtpSent={isOtpSent} />

            {/* Card */}
            <View style={s.card}>
              {!isOtpSent ? (
                <>
                  <GlassInput icon="👤" placeholder="Họ và tên" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                  <GlassInput icon="✉️" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                  <GlassInput icon="📞" placeholder="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <GlassInput icon="🔒" placeholder="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
                  <GlassInput icon="🔒" placeholder="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                  <TouchableOpacity style={[s.primaryBtn, loading && { opacity: 0.7 }]} onPress={handleRequestOtp} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Gửi mã xác thực →</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* OTP Step */}
                  <Text style={s.otpHint}>Nhập mã 6 chữ số đã gửi tới email của bạn</Text>

                  <GlassInput
                    icon="🔑" placeholder="Nhập mã OTP (6 chữ số)"
                    value={otp} onChangeText={setOtp}
                    keyboardType="number-pad" maxLength={6}
                  />

                  <TouchableOpacity style={[s.primaryBtn, loading && { opacity: 0.7 }]} onPress={handleVerifyAndRegister} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Xác nhận & Đăng ký 🎉</Text>}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={s.resendRow}>
                    <Text style={s.resendGray}>Chưa nhận được? </Text>
                    <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
                      <Text style={s.resendPink}>Gửi lại</Text>
                    </TouchableOpacity>
                    <Text style={s.resendGray}> · </Text>
                    <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                      <Text style={s.resendPink}>Sửa thông tin</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={s.footerRow}>
              <Text style={s.footerGray}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.footerPink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  blob: { position: 'absolute', borderRadius: 999 },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  logoGrad: {
    width: 68, height: 68, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    elevation: 10, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14,
  },
  appName: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4, textAlign: 'center' },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(232,72,229,0.2)', borderWidth: 1, borderColor: 'rgba(232,72,229,0.4)' },
  tabText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#E848E5' },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },

  // Input
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 52, marginBottom: 12,
  },
  inputIcon: { fontSize: 17, marginRight: 10 },
  inputText: { flex: 1, color: '#FFF', fontSize: 15 },

  // OTP hint
  otpHint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 18, lineHeight: 20 },

  // Primary button
  primaryBtn: {
    borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12,
    elevation: 8, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  primaryBtnGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Resend
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  resendGray: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  resendPink: { color: '#E848E5', fontSize: 13, fontWeight: '700' },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerGray: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  footerPink: { color: '#E848E5', fontSize: 14, fontWeight: '700' },
});

export default RegisterScreen;
