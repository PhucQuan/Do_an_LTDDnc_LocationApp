import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, Mail, Lock, User, Phone, KeyRound, ArrowLeft } from 'lucide-react-native';
import { authService } from '../../../infrastructure/firebase/authService';

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Bước 1: Gửi mã OTP
  const handleRequestOtp = async () => {
    if (!fullName || !email || !password || !phone) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    // Kiểm tra định dạng email cơ bản
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      await authService.requestRegisterOTP(email);
      setIsOtpSent(true);
      Alert.alert("Thành công", "Mã xác thực đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư rác).");
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP và Tạo tài khoản thật
  const handleVerifyAndRegister = async () => {
    if (!otp) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP");
      return;
    }

    setLoading(true);
    try {
      // Hàm này trong authService chỉ tạo User khi OTP đúng
      await authService.verifyAndRegister(email, password, fullName, phone, otp);

      // Sau khi tạo thành công, Firebase tự đăng nhập.
      // App.js sẽ nhận được event và tự chuyển sang màn hình Main.
      Alert.alert("Thành công", "Tài khoản của bạn đã được tạo và kích hoạt thành công!");
    } catch (error) {
      Alert.alert("Đăng ký thất bại", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {isOtpSent && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setIsOtpSent(false)}>
              <ArrowLeft color="#F8FAFC" size={24} />
            </TouchableOpacity>
          )}

          <View style={styles.header}>
              <View style={styles.logoContainer}>
                  {isOtpSent ? <KeyRound color="#38BDF8" size={40} /> : <UserPlus color="#38BDF8" size={40} />}
              </View>
              <Text style={styles.title}>{isOtpSent ? 'Verify Email' : 'Create Account'}</Text>
              <Text style={styles.subtitle}>
                {isOtpSent ? `Chúng tôi đã gửi mã tới ${email}` : 'Join Bump to connect with friends'}
              </Text>
          </View>

          <View style={styles.form}>
              {!isOtpSent ? (
                <>
                  <View style={styles.inputContainer}>
                      <User color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Full Name"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          value={fullName}
                          onChangeText={setFullName}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <Mail color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Email Address"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          keyboardType="email-address"
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <Phone color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Phone Number"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          keyboardType="phone-pad"
                          value={phone}
                          onChangeText={setPhone}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <Lock color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Password"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          secureTextEntry
                          value={password}
                          onChangeText={setPassword}
                      />
                  </View>

                  <View style={styles.inputContainer}>
                      <Lock color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Confirm Password"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          secureTextEntry
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                      />
                  </View>

                  <TouchableOpacity
                    style={[styles.registerButton, loading && { opacity: 0.7 }]}
                    onPress={handleRequestOtp}
                    disabled={loading}
                  >
                      {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.registerButtonText}>Send OTP Code</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                      <KeyRound color="#64748B" size={20} style={styles.inputIcon} />
                      <TextInput
                          placeholder="Enter 6-digit OTP"
                          placeholderTextColor="#64748B"
                          style={styles.input}
                          keyboardType="number-pad"
                          maxLength={6}
                          value={otp}
                          onChangeText={setOtp}
                      />
                  </View>

                  <TouchableOpacity
                    style={[styles.registerButton, loading && { opacity: 0.7 }]}
                    onPress={handleVerifyAndRegister}
                    disabled={loading}
                  >
                      {loading ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.registerButtonText}>Verify & Sign Up</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleRequestOtp} disabled={loading}>
                      <Text style={[styles.loginLink, { textAlign: 'center' }]}>Resend Code</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                      <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
              </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 10, padding: 10, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#334155',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B',
    borderRadius: 16, marginBottom: 16, paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#334155',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 16 },
  registerButton: {
    backgroundColor: '#38BDF8', height: 56, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 24,
  },
  registerButtonText: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#94A3B8', fontSize: 14 },
  loginLink: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold' }
});

export default RegisterScreen;
