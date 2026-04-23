import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated, ScrollView
} from 'react-native';
import { User, Mail, Phone, Lock, Hash, MapPin, KeyRound, ChevronRight, AtSign, CheckCircle2 } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';
import { COLORS, SPACING, SHADOW, RADIUS } from '../../theme';

function SolidInput({ icon: Icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, maxLength }) {
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
        maxLength={maxLength}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={COLORS.accent}
      />
    </Animated.View>
  );
}

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
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
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRequestOtp = async () => {
    if (!fullName || !username || !email || !password || !phone) {
      Alert.alert('Chưa đầy đủ', 'Vui lòng điền đủ mọi thông tin'); return;
    }
    const usernameRegex = /^[a-zA-Z0-9_.-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Lỗi', 'Username không hợp lệ (3-20 ký tự, không dấu cách)'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp'); return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ'); return;
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
      await authService.verifyAndRegister(email, password, fullName, phone, username, otp);
      Alert.alert('Tuyệt vời', 'Tài khoản đã được tạo thành công! Vui lòng đăng nhập.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Lỗi đăng ký', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[{ transform: [{ translateY: slideUp }], opacity: fadeIn }]}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                {isOtpSent ? (
                  <CheckCircle2 color={COLORS.ink} size={36} strokeWidth={2.5} />
                ) : (
                  <MapPin color={COLORS.ink} size={36} strokeWidth={2.5} />
                )}
              </View>
              <Text style={styles.appName}>Join GeoLink</Text>
              <Text style={styles.tagline}>
                {isOtpSent ? `We sent a code to ${email}` : 'Get on the map with your friends.'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {!isOtpSent ? (
                <>
                  <SolidInput icon={User} placeholder="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                  <SolidInput icon={AtSign} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
                  <SolidInput icon={Mail} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                  <SolidInput icon={Phone} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                  <SolidInput icon={Lock} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                  <SolidInput icon={Lock} placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }, loading && { opacity: 0.7 }]} onPress={handleRequestOtp} disabled={loading} activeOpacity={0.8}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : (
                      <>
                        <Text style={styles.primaryBtnText}>Continue</Text>
                        <ChevronRight color={COLORS.white} size={20} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <SolidInput icon={KeyRound} placeholder="6-digit OTP code" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />

                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }, loading && { opacity: 0.7 }]} onPress={handleVerifyAndRegister} disabled={loading} activeOpacity={0.8}>
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Verify & Create Account</Text>}
                  </TouchableOpacity>

                  <View style={styles.resendRow}>
                    <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
                      <Text style={styles.resendAccent}>Resend Code</Text>
                    </TouchableOpacity>
                    <View style={styles.dot} />
                    <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                      <Text style={styles.resendAccent}>Edit Details</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerGray}>Already on GeoLink? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.footerHighlight}>Log in here</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ink },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: 80, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 40 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '5deg' }],
    ...SHADOW.accent,
  },
  appName: { color: COLORS.white, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: COLORS.textMuted, fontSize: 15, marginTop: 8, fontWeight: '500', textAlign: 'center' },

  formContainer: { width: '100%' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inkSoft,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  inputText: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '600' },

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

  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 12 },
  resendAccent: { color: COLORS.accent, fontSize: 14, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.textMuted },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerGray: { color: COLORS.textMuted, fontSize: 15, fontWeight: '500' },
  footerHighlight: { color: COLORS.white, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
});

export default RegisterScreen;
