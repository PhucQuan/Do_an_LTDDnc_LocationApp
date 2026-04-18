import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../../../infrastructure/firebase/authService';

const { height: SCREEN_H } = Dimensions.get('window');

function Blobs() {
  return (
    <>
      <View style={[s.blob, { top: -60, right: -60, width: 200, height: 200, backgroundColor: 'rgba(232,72,229,0.18)' }]} />
      <View style={[s.blob, { top: SCREEN_H * 0.25, left: -80, width: 160, height: 160, backgroundColor: 'rgba(139,92,246,0.15)' }]} />
      <View style={[s.blob, { bottom: 80, right: -50, width: 180, height: 180, backgroundColor: 'rgba(236,72,153,0.12)' }]} />
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

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [loading, setLoading] = useState(false);

  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRequestOTP = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email của bạn");
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordResetOTP(email);
      Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn.");
      setStep(2);
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã OTP và mật khẩu mới");
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOTPAndReset(email, otp, newPassword);
      Alert.alert("Thành công", "Mật khẩu đã được thay đổi!", [
        { text: "Đăng nhập ngay", onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0D0D1A', '#12001A', '#0D0D1A']} style={StyleSheet.absoluteFill} />
      <Blobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <Animated.View style={[s.content, { transform: [{ translateY: slideUp }], opacity: fadeIn }]}>
          
          <TouchableOpacity style={s.backBtn} onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
              <Text style={{color: '#FFF', fontSize: 24}}>←</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.logoEmoji}>🔑</Text>
            </LinearGradient>
            <Text style={s.appName}>GeoLink</Text>
            <Text style={s.tagline}>
              {step === 1 ? 'Khôi phục mật khẩu của bạn' : 'Thiết lập mật khẩu mới'}
            </Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>{step === 1 ? 'Email xác thực' : 'Mật khẩu mới'}</Text>
            
            {step === 1 ? (
              <>
                <GlassInput icon="✉️" placeholder="Nhập email của bạn" value={email} onChangeText={setEmail} keyboardType="email-address" />
                
                <TouchableOpacity
                  style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRequestOTP}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Gửi mã xác thực →</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <GlassInput icon="🔐" placeholder="Mã OTP 6 chữ số" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
                <GlassInput icon="🔒" placeholder="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

                <TouchableOpacity
                  style={[s.primaryBtn, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#E848E5', '#8B5CF6']} style={s.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Đổi mật khẩu</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.footerRow}>
            <Text style={s.footerGray}>Quay lại </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerPink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 0, padding: 10, zIndex: 10 },
  blob: { position: 'absolute', borderRadius: 999 },
  
  header: { alignItems: 'center', marginBottom: 32 },
  logoGrad: {
    width: 68, height: 68, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    elevation: 10, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 14,
  },
  logoEmoji: { fontSize: 28 },
  appName: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  cardTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 20 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, height: 52, marginBottom: 12,
  },
  inputIcon: { fontSize: 17, marginRight: 10 },
  inputText: { flex: 1, color: '#FFF', fontSize: 15 },

  primaryBtn: {
    borderRadius: 16, overflow: 'hidden', marginTop: 10,
    elevation: 8, shadowColor: '#E848E5',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  primaryBtnGrad: { height: 54, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerGray: { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  footerPink: { color: '#E848E5', fontSize: 14, fontWeight: '700' },
});

export default ForgotPasswordScreen;
